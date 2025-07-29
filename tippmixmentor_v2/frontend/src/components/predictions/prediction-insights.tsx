'use client';

import { useState } from 'react';
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
  BarChart3
} from 'lucide-react';

interface PredictionInsightsProps {
  prediction: any;
  matchData: any;
  onBetRecommendation?: (recommendation: any) => void;
}

export function PredictionInsights({ prediction, matchData, onBetRecommendation }: PredictionInsightsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Advanced analysis and betting recommendations powered by machine learning
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Confidence Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Match Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {prediction.match_result.prediction}
              </div>
              <Progress 
                value={prediction.confidence.match_result * 100} 
                className="h-2"
              />
              <div className="text-sm text-gray-600">
                {getConfidenceLevel(prediction.confidence.match_result).level} Confidence
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Goals Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {prediction.over_under.prediction}
              </div>
              <Progress 
                value={prediction.confidence.over_under * 100} 
                className="h-2"
              />
              <div className="text-sm text-gray-600">
                {getConfidenceLevel(prediction.confidence.over_under).level} Confidence
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Both Teams Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {prediction.both_teams_score.prediction}
              </div>
              <Progress 
                value={prediction.confidence.both_teams_score * 100} 
                className="h-2"
              />
              <div className="text-sm text-gray-600">
                {getConfidenceLevel(prediction.confidence.both_teams_score).level} Confidence
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      {prediction.insight && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-900 leading-relaxed">
                {prediction.insight}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Betting Recommendations */}
      {prediction.betting_recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Betting Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered betting advice and risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Risk Level */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Risk Level:</span>
                <Badge 
                  className={`${getRiskLevel(prediction.betting_recommendations.risk_level).bg} ${getRiskLevel(prediction.betting_recommendations.risk_level).color}`}
                >
                  {prediction.betting_recommendations.risk_level.toUpperCase()}
                </Badge>
              </div>

              {/* Confidence */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Confidence:</span>
                <Badge variant="outline">
                  {prediction.betting_recommendations.confidence.toUpperCase()}
                </Badge>
              </div>

              {/* Explanation */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  {prediction.betting_recommendations.explanation}
                </p>
              </div>

              {/* Recommended Bets */}
              {prediction.betting_recommendations.recommended_bets && 
               prediction.betting_recommendations.recommended_bets.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommended Bets:</h4>
                  <div className="space-y-2">
                    {prediction.betting_recommendations.recommended_bets.map((bet: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{bet.type.replace('_', ' ').toUpperCase()}</div>
                          <div className="text-sm text-gray-600">{bet.prediction}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {(bet.confidence * 100).toFixed(1)}% confidence
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {bet.recommended_stake} stake
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Advanced Analysis
          </CardTitle>
          <CardDescription>
            Detailed statistical breakdown and model insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Analysis
          </Button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {/* Match Result Probabilities */}
              <div>
                <h4 className="font-medium mb-2">Match Result Probabilities:</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-600">
                      {(prediction.match_result.probabilities.home_win * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs">Home Win</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-bold text-yellow-600">
                      {(prediction.match_result.probabilities.draw * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs">Draw</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-600">
                      {(prediction.match_result.probabilities.away_win * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs">Away Win</div>
                  </div>
                </div>
              </div>

              {/* Model Information */}
              {prediction.model_info && (
                <div>
                  <h4 className="font-medium mb-2">Model Information:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Version: {prediction.model_info.metadata?.version || '1.0.0'}</div>
                    <div>Training Samples: {prediction.model_info.metadata?.training_samples || 'N/A'}</div>
                    <div>Last Updated: {prediction.model_info.metadata?.last_updated || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Feature Importance */}
              {prediction.model_info?.feature_importance && (
                <div>
                  <h4 className="font-medium mb-2">Key Factors:</h4>
                  <div className="space-y-1">
                    {Object.entries(prediction.model_info.feature_importance.match_result || {})
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([feature, importance]) => (
                        <div key={feature} className="flex justify-between text-sm">
                          <span className="capitalize">
                            {feature.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium">
                            {(importance * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-orange-800 mb-1">Important Disclaimer</p>
              <p>
                These predictions are for educational and entertainment purposes only. 
                Always gamble responsibly and never bet more than you can afford to lose. 
                Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 