'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Zap,
  Target,
  BarChart3,
  Activity,
  Cpu,
  Database,
  Wifi,
  RefreshCw,
  Clock,
  Thermometer,
  Newspaper,
  Users,
  Shield,
  DollarSign,
  TrendingDown,
  Eye,
  BarChart,
  PieChart,
  LineChart
} from 'lucide-react';

interface MLPrediction {
  matchId: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  predictedScore: string;
  confidence: number;
  modelVersion: string;
  insight: string;
  bettingRecommendations: {
    recommendation: string;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    potentialReturn: number;
  };
  features: any;
  createdAt: string;
}

interface LiveMatchData {
  match_id: string;
  match_info: {
    home_team: string;
    away_team: string;
    league: string;
    venue: string;
    match_date: string;
    status: string;
  };
  live_data: {
    status: string;
    score: { home: number; away: number };
    time: string;
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    corners: { home: number; away: number };
    cards: { home: { yellow: number; red: number }; away: { yellow: number; red: number } };
  };
  weather: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    description: string;
    city: string;
  };
  team_news: {
    home_team: any[];
    away_team: any[];
  };
  injury_updates: any[];
  lineup_announcements: any;
  timestamp: string;
}

interface RealTimeMLInsightsProps {
  matchId: string;
  onPredictionUpdate?: (prediction: MLPrediction) => void;
  onLiveDataUpdate?: (liveData: LiveMatchData) => void;
}

export function RealTimeMLInsights({ 
  matchId, 
  onPredictionUpdate, 
  onLiveDataUpdate 
}: RealTimeMLInsightsProps) {
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);
  const [liveData, setLiveData] = useState<LiveMatchData | null>(null);
  const [mlServiceStatus, setMlServiceStatus] = useState<string>('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch ML prediction
  const fetchMLPrediction = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/predictions/ml-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ML prediction');
      }

      const data = await response.json();
      setMlPrediction(data);
      setLastUpdate(new Date());
      
      if (onPredictionUpdate) {
        onPredictionUpdate(data);
      }
    } catch (err) {
      setError('Failed to fetch ML prediction');
      console.error('ML prediction error:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId, API_BASE_URL, onPredictionUpdate]);

  // Fetch live match data
  const fetchLiveData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/live-data/match/${matchId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch live data');
      }

      const data = await response.json();
      setLiveData(data);
      
      if (onLiveDataUpdate) {
        onLiveDataUpdate(data);
      }
    } catch (err) {
      console.error('Live data error:', err);
    }
  }, [matchId, API_BASE_URL, onLiveDataUpdate]);

  // Check ML service status
  const checkMLServiceStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/predictions/ml-status`);
      const data = await response.json();
      setMlServiceStatus(data.status || 'unknown');
    } catch (err) {
      setMlServiceStatus('unavailable');
      console.error('ML service status error:', err);
    }
  }, [API_BASE_URL]);

  // Start real-time streaming
  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    
    // Initial fetch
    fetchMLPrediction();
    fetchLiveData();
    checkMLServiceStatus();

    // Set up intervals for real-time updates
    const mlInterval = setInterval(fetchMLPrediction, 60000); // ML updates every minute
    const liveInterval = setInterval(fetchLiveData, 30000); // Live data every 30 seconds
    const statusInterval = setInterval(checkMLServiceStatus, 300000); // Status every 5 minutes

    return () => {
      clearInterval(mlInterval);
      clearInterval(liveInterval);
      clearInterval(statusInterval);
    };
  }, [fetchMLPrediction, fetchLiveData, checkMLServiceStatus]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (matchId) {
      const cleanup = startStreaming();
      return cleanup;
    }
  }, [matchId, startStreaming]);

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { level: 'Very High', color: 'text-green-600', bg: 'bg-green-50' };
    if (confidence >= 0.6) return { level: 'High', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (confidence >= 0.4) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getRiskLevel = (risk: string) => {
    switch (risk) {
      case 'low': return { color: 'text-green-600', bg: 'bg-green-100' };
      case 'medium': return { color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'high': return { color: 'text-red-600', bg: 'bg-red-100' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'ready':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'unavailable':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Real-Time ML Insights
              </CardTitle>
              <CardDescription>
                Live AI-powered predictions and match analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${getStatusColor(mlServiceStatus)}`}>
                {mlServiceStatus === 'healthy' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <Badge variant={isStreaming ? "default" : "secondary"}>
                {isStreaming ? (
                  <>
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Live
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Static
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMLPrediction}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant={isStreaming ? "destructive" : "default"}
                size="sm"
                onClick={isStreaming ? stopStreaming : startStreaming}
              >
                {isStreaming ? 'Stop' : 'Start'} Streaming
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="prediction" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
          <TabsTrigger value="live-data">Live Data</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="betting">Betting</TabsTrigger>
        </TabsList>

        {/* ML Prediction Tab */}
        <TabsContent value="prediction" className="space-y-4">
          {mlPrediction ? (
            <>
              {/* Match Result Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Match Result Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(mlPrediction.homeWinProb * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Home Win</div>
                      <Progress value={mlPrediction.homeWinProb * 100} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {(mlPrediction.drawProb * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Draw</div>
                      <Progress value={mlPrediction.drawProb * 100} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {(mlPrediction.awayWinProb * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Away Win</div>
                      <Progress value={mlPrediction.awayWinProb * 100} className="mt-2" />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{mlPrediction.predictedScore}</div>
                      <div className="text-sm text-gray-600">Predicted Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Confidence Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Confidence Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {(mlPrediction.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {getConfidenceLevel(mlPrediction.confidence).level} Confidence
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${getConfidenceLevel(mlPrediction.confidence).bg}`}>
                      <span className={`text-sm font-medium ${getConfidenceLevel(mlPrediction.confidence).color}`}>
                        {getConfidenceLevel(mlPrediction.confidence).level}
                      </span>
                    </div>
                  </div>
                  <Progress value={mlPrediction.confidence * 100} className="mt-4" />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  {loading ? 'Loading prediction...' : 'No prediction available'}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Live Data Tab */}
        <TabsContent value="live-data" className="space-y-4">
          {liveData ? (
            <>
              {/* Match Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Live Match Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Score</h4>
                      <div className="text-3xl font-bold">
                        {liveData.live_data.score.home} - {liveData.live_data.score.away}
                      </div>
                      <div className="text-sm text-gray-600">
                        {liveData.match_info.home_team} vs {liveData.match_info.away_team}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Status</h4>
                      <Badge variant="outline">{liveData.live_data.status}</Badge>
                      {liveData.live_data.time && (
                        <div className="text-sm text-gray-600 mt-1">
                          {liveData.live_data.time}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Match Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Match Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{liveData.live_data.possession.home}%</div>
                      <div className="text-sm text-gray-600">Home Possession</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{liveData.live_data.possession.away}%</div>
                      <div className="text-sm text-gray-600">Away Possession</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{liveData.live_data.shots.home}</div>
                      <div className="text-sm text-gray-600">Home Shots</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{liveData.live_data.shots.away}</div>
                      <div className="text-sm text-gray-600">Away Shots</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weather Information */}
              {liveData.weather && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5" />
                      Weather Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{liveData.weather.temperature}°C</div>
                        <div className="text-sm text-gray-600">{liveData.weather.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Humidity: {liveData.weather.humidity}%</div>
                        <div className="text-sm text-gray-600">Wind: {liveData.weather.wind_speed} m/s</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  No live data available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {mlPrediction ? (
            <>
              {/* AI Insight */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-900 mb-2">Match Insight</div>
                        <div className="text-blue-800">{mlPrediction.insight}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Model Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Model Version</div>
                      <div className="font-medium">{mlPrediction.modelVersion}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Prediction Time</div>
                      <div className="font-medium">
                        {new Date(mlPrediction.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  No AI insights available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Betting Recommendations Tab */}
        <TabsContent value="betting" className="space-y-4">
          {mlPrediction?.bettingRecommendations ? (
            <>
              {/* Betting Recommendation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Betting Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900 mb-2">Recommendation</div>
                        <div className="text-green-800">{mlPrediction.bettingRecommendations.recommendation}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(mlPrediction.bettingRecommendations.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className={`px-3 py-1 rounded-full inline-block ${getRiskLevel(mlPrediction.bettingRecommendations.riskLevel).bg}`}>
                        <span className={`text-sm font-medium ${getRiskLevel(mlPrediction.bettingRecommendations.riskLevel).color}`}>
                          {mlPrediction.bettingRecommendations.riskLevel.toUpperCase()} Risk
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {mlPrediction.bettingRecommendations.potentialReturn}x
                      </div>
                      <div className="text-sm text-gray-600">Potential Return</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Warning */}
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900 mb-2">Risk Warning</div>
                      <div className="text-yellow-800 text-sm">
                        These predictions are for informational purposes only. Always gamble responsibly and never bet more than you can afford to lose. Past performance does not guarantee future results.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  No betting recommendations available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 