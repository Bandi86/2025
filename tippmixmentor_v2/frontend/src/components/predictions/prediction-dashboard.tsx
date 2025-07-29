'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Calendar, 
  Users, 
  Trophy,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PredictionStats {
  total: number;
  correct: number;
  incorrect: number;
  pending: number;
  accuracy: number;
  averageConfidence: number;
}

interface RecentPrediction {
  id: string;
  match: {
    homeTeam: { name: string };
    awayTeam: { name: string };
    matchDate: string;
  };
  prediction: string;
  confidence: number;
  isCorrect: boolean | null;
  createdAt: string;
}

export function PredictionDashboard() {
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<RecentPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch prediction statistics
      const statsResponse = await fetch('/api/predictions/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent predictions
      const predictionsResponse = await fetch('/api/predictions/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        setRecentPredictions(predictionsData);
      }
    } catch (error) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prediction Dashboard</h1>
          <p className="text-gray-600">Track your prediction performance and insights</p>
        </div>
        <Button onClick={fetchDashboardData} className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.total - stats.pending} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAccuracyColor(stats.accuracy)}`}>
                {stats.accuracy}%
              </div>
              <Progress value={stats.accuracy} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Correct Predictions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getConfidenceColor(stats.averageConfidence)}`}>
                {(stats.averageConfidence * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Model confidence level
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Breakdown
            </CardTitle>
            <CardDescription>
              Detailed analysis of your prediction performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Correct Predictions</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {stats.correct}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Incorrect Predictions</span>
                  <Badge variant="destructive">
                    {stats.incorrect}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending Results</span>
                  <Badge variant="secondary">
                    {stats.pending}
                  </Badge>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overall Accuracy</span>
                    <span className={`font-bold ${getAccuracyColor(stats.accuracy)}`}>
                      {stats.accuracy}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest predictions and their outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPredictions.slice(0, 5).map((prediction) => (
                <div key={prediction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {prediction.match.homeTeam.name} vs {prediction.match.awayTeam.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(prediction.match.matchDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{prediction.prediction}</div>
                    <div className={`text-xs ${getConfidenceColor(prediction.confidence)}`}>
                      {(prediction.confidence * 100).toFixed(1)}% confidence
                    </div>
                    {prediction.isCorrect === true && (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                    )}
                    {prediction.isCorrect === false && (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-1" />
                    )}
                    {prediction.isCorrect === null && (
                      <Clock className="h-4 w-4 text-gray-400 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2" variant="outline">
              <Target className="h-4 w-4" />
              Make New Prediction
            </Button>
            <Button className="flex items-center gap-2" variant="outline">
              <Calendar className="h-4 w-4" />
              View Upcoming Matches
            </Button>
            <Button className="flex items-center gap-2" variant="outline">
              <Users className="h-4 w-4" />
              Compare with Others
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 