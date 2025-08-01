'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Zap
} from 'lucide-react';

interface Prediction {
  id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    competition: string;
    date: Date;
  };
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
    recommendedBet: 'home' | 'draw' | 'away' | 'none';
    confidence: number;
  };
  result?: {
    homeScore: number;
    awayScore: number;
    outcome: 'home' | 'draw' | 'away';
    correct: boolean;
  };
  status: 'pending' | 'correct' | 'incorrect' | 'partial';
  createdAt: Date;
}

export function PredictionDashboard() {
  // Mock prediction data
  const predictions: Prediction[] = [
    {
      id: '1',
      match: {
        homeTeam: 'Manchester City',
        awayTeam: 'Arsenal',
        competition: 'Premier League',
        date: new Date(Date.now() - 86400000)
      },
      prediction: {
        homeWin: 65,
        draw: 22,
        awayWin: 13,
        recommendedBet: 'home',
        confidence: 87
      },
      result: {
        homeScore: 2,
        awayScore: 1,
        outcome: 'home',
        correct: true
      },
      status: 'correct',
      createdAt: new Date(Date.now() - 172800000)
    },
    {
      id: '2',
      match: {
        homeTeam: 'Liverpool',
        awayTeam: 'Chelsea',
        competition: 'Premier League',
        date: new Date(Date.now() - 43200000)
      },
      prediction: {
        homeWin: 58,
        draw: 25,
        awayWin: 17,
        recommendedBet: 'home',
        confidence: 82
      },
      result: {
        homeScore: 3,
        awayScore: 2,
        outcome: 'home',
        correct: true
      },
      status: 'correct',
      createdAt: new Date(Date.now() - 129600000)
    },
    {
      id: '3',
      match: {
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        competition: 'La Liga',
        date: new Date(Date.now() + 3600000)
      },
      prediction: {
        homeWin: 45,
        draw: 30,
        awayWin: 25,
        recommendedBet: 'home',
        confidence: 73
      },
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: '4',
      match: {
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        competition: 'Bundesliga',
        date: new Date(Date.now() - 21600000)
      },
      prediction: {
        homeWin: 70,
        draw: 20,
        awayWin: 10,
        recommendedBet: 'home',
        confidence: 91
      },
      result: {
        homeScore: 4,
        awayScore: 0,
        outcome: 'home',
        correct: true
      },
      status: 'correct',
      createdAt: new Date(Date.now() - 64800000)
    },
    {
      id: '5',
      match: {
        homeTeam: 'PSG',
        awayTeam: 'Marseille',
        competition: 'Ligue 1',
        date: new Date(Date.now() - 7200000)
      },
      prediction: {
        homeWin: 55,
        draw: 28,
        awayWin: 17,
        recommendedBet: 'home',
        confidence: 78
      },
      result: {
        homeScore: 1,
        awayScore: 2,
        outcome: 'away',
        correct: false
      },
      status: 'incorrect',
      createdAt: new Date(Date.now() - 43200000)
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-green-100 text-green-800';
      case 'incorrect': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'incorrect': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'partial': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRecommendedBetColor = (bet: string) => {
    switch (bet) {
      case 'home': return 'bg-blue-100 text-blue-800';
      case 'draw': return 'bg-yellow-100 text-yellow-800';
      case 'away': return 'bg-purple-100 text-purple-800';
      case 'none': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const totalPredictions = predictions.length;
  const correctPredictions = predictions.filter(p => p.status === 'correct').length;
  const incorrectPredictions = predictions.filter(p => p.status === 'incorrect').length;
  const pendingPredictions = predictions.filter(p => p.status === 'pending').length;
  const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / (correctPredictions + incorrectPredictions)) * 100) : 0;
  const averageConfidence = predictions.length > 0 
    ? Math.round(predictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / predictions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prediction Dashboard</h1>
          <p className="text-gray-600 mt-1">
            AI-powered match predictions and performance analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>New Prediction</span>
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold">{accuracy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Predictions</p>
                <p className="text-2xl font-bold">{totalPredictions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold">{averageConfidence}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingPredictions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Recent Predictions</span>
          </CardTitle>
          <CardDescription>
            Latest AI predictions and their outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map(prediction => (
              <div key={prediction.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(prediction.status)}
                    <div>
                      <h3 className="font-semibold">
                        {prediction.match.homeTeam} vs {prediction.match.awayTeam}
                      </h3>
                      <p className="text-sm text-gray-600">{prediction.match.competition}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(prediction.status)}>
                      {prediction.status.toUpperCase()}
                    </Badge>
                    <Badge className={getRecommendedBetColor(prediction.prediction.recommendedBet)}>
                      {prediction.prediction.recommendedBet.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Prediction Probabilities</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Home Win</span>
                        <span className="font-medium">{prediction.prediction.homeWin}%</span>
                      </div>
                      <Progress value={prediction.prediction.homeWin} className="h-1" />
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Draw</span>
                        <span className="font-medium">{prediction.prediction.draw}%</span>
                      </div>
                      <Progress value={prediction.prediction.draw} className="h-1" />
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Away Win</span>
                        <span className="font-medium">{prediction.prediction.awayWin}%</span>
                      </div>
                      <Progress value={prediction.prediction.awayWin} className="h-1" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Confidence & Result</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Confidence</span>
                        <span className="font-medium">{prediction.prediction.confidence}%</span>
                      </div>
                      {prediction.result && (
                        <div className="text-sm">
                          <div className="flex items-center justify-between">
                            <span>Result</span>
                            <span className="font-medium">
                              {prediction.result.homeScore} - {prediction.result.awayScore}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Outcome</span>
                            <span className="font-medium capitalize">{prediction.result.outcome}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Match Details</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Date</span>
                        <span>{formatDate(prediction.match.date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Created</span>
                        <span>{formatDate(prediction.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Similar Matches
                    </Button>
                  </div>
                  {prediction.status === 'pending' && (
                    <Button size="sm" className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>Update Prediction</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Accuracy Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 7 days</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 30 days</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">All time</span>
                <span className="text-sm font-medium">{accuracy}%</span>
              </div>
              <Progress value={accuracy} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Model Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{correctPredictions}</div>
                  <div className="text-sm text-green-700">Correct</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{incorrectPredictions}</div>
                  <div className="text-sm text-red-700">Incorrect</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>High Confidence (&gt;80%)</span>
                  <span className="font-medium">92% accuracy</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Medium Confidence (60-80%)</span>
                  <span className="font-medium">76% accuracy</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Low Confidence (&lt;60%)</span>
                  <span className="font-medium">45% accuracy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 