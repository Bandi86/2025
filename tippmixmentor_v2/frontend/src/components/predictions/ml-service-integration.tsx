'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  RefreshCw
} from 'lucide-react';

interface MLServiceStatus {
  status: string;
  version?: string;
  lastUpdate?: string;
  error?: string;
}

interface ModelInfo {
  models: Array<{
    name: string;
    version: string;
    accuracy: number;
    lastTrained: string;
  }>;
}

interface PredictionResult {
  matchId: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  confidence: number;
  modelVersion: string;
  insights?: string;
  recommendations?: string;
}

interface MLServiceIntegrationProps {
  matchId?: string;
  onPredictionUpdate?: (prediction: PredictionResult) => void;
}

export function MLServiceIntegration({ matchId, onPredictionUpdate }: MLServiceIntegrationProps) {
  const [mlStatus, setMlStatus] = useState<MLServiceStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    checkMLServiceStatus();
    getModelInfo();
  }, []);

  useEffect(() => {
    if (matchId) {
      getPrediction(matchId);
    }
  }, [matchId]);

  const checkMLServiceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/predictions/ml-status`);
      const data = await response.json();
      setMlStatus(data);
    } catch (err) {
      setError('Failed to check ML service status');
      console.error('ML service status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getModelInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/predictions/model-info`);
      const data = await response.json();
      setModelInfo(data);
    } catch (err) {
      setError('Failed to get model information');
      console.error('Model info error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPrediction = async (matchId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/predictions/ml-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId }),
      });
      const data = await response.json();
      setPrediction(data);
      if (onPredictionUpdate) {
        onPredictionUpdate(data);
      }
    } catch (err) {
      setError('Failed to get prediction');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'unavailable':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { level: 'Very High', color: 'text-green-600', bg: 'bg-green-50' };
    if (confidence >= 0.6) return { level: 'High', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (confidence >= 0.4) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="space-y-6">
      {/* ML Service Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            ML Service Status
          </CardTitle>
          <CardDescription>
            Real-time status of the machine learning prediction service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getStatusColor(mlStatus?.status || 'unknown')}`}>
                {mlStatus?.status === 'operational' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="font-medium">
                  {mlStatus?.status === 'operational' ? 'Service Operational' : 'Service Unavailable'}
                </div>
                <div className="text-sm text-gray-500">
                  Version: {mlStatus?.version || 'Unknown'}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkMLServiceStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {mlStatus?.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-600">{mlStatus.error}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Information */}
      {modelInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Model Information
            </CardTitle>
            <CardDescription>
              Current model versions and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelInfo.models.map((model, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{model.name}</div>
                    <Badge variant="secondary">v{model.version}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Accuracy:</span>
                      <span className="font-medium">{Math.round(model.accuracy * 100)}%</span>
                    </div>
                    <Progress value={model.accuracy * 100} className="h-2" />
                    <div className="text-xs text-gray-500">
                      Last trained: {new Date(model.lastTrained).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Prediction */}
      {prediction && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Prediction
            </CardTitle>
            <CardDescription>
              Machine learning prediction with confidence analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Prediction Results */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(prediction.homeWinProb * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Home Win</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">
                    {Math.round(prediction.drawProb * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Draw</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {Math.round(prediction.awayWinProb * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Away Win</div>
                </div>
              </div>

              {/* Confidence Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence Level</span>
                  <span className={`text-sm font-medium ${getConfidenceLevel(prediction.confidence).color}`}>
                    {getConfidenceLevel(prediction.confidence).level}
                  </span>
                </div>
                <Progress value={prediction.confidence * 100} className="h-2" />
                <div className="text-xs text-gray-500">
                  Model Version: {prediction.modelVersion}
                </div>
              </div>

              {/* AI Insights */}
              {prediction.insights && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-800">AI Insights</div>
                      <div className="text-sm text-blue-700 mt-1">{prediction.insights}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Betting Recommendations */}
              {prediction.recommendations && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-green-800">Betting Recommendation</div>
                      <div className="text-sm text-green-700 mt-1">{prediction.recommendations}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading ML service data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 