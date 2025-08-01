'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  timestamp: Date;
  relatedMatches?: string[];
}

export function PredictionInsights() {
  // Mock insights data
  const insights: Insight[] = [
    {
      id: '1',
      type: 'trend',
      title: 'Home Team Dominance Pattern',
      description: 'Teams playing at home in the Premier League have shown 15% higher win rates in evening matches (7-9 PM) over the last 3 months.',
      impact: 'high',
      category: 'Performance Analysis',
      confidence: 89,
      timestamp: new Date(Date.now() - 3600000),
      relatedMatches: ['Manchester City vs Arsenal', 'Liverpool vs Chelsea']
    },
    {
      id: '2',
      type: 'anomaly',
      title: 'Unusual Betting Line Movement',
      description: 'Significant odds movement detected for Bayern Munich vs Dortmund match. Odds shifted 20% in favor of away team in last 24 hours.',
      impact: 'medium',
      category: 'Market Analysis',
      confidence: 76,
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Value Betting Opportunity',
      description: 'Underdog teams in La Liga have outperformed expectations by 12% when playing against top-4 teams this season.',
      impact: 'high',
      category: 'Betting Strategy',
      confidence: 82,
      timestamp: new Date(Date.now() - 10800000)
    },
    {
      id: '4',
      type: 'warning',
      title: 'Model Confidence Decline',
      description: 'Prediction accuracy has decreased by 8% in Bundesliga matches over the last 2 weeks. Consider model retraining.',
      impact: 'medium',
      category: 'System Health',
      confidence: 91,
      timestamp: new Date(Date.now() - 14400000)
    },
    {
      id: '5',
      type: 'trend',
      title: 'Weather Impact Correlation',
      description: 'Matches played in rainy conditions show 25% higher draw probability compared to clear weather conditions.',
      impact: 'medium',
      category: 'Environmental Factors',
      confidence: 78,
      timestamp: new Date(Date.now() - 18000000)
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Performance Analysis':
        return 'bg-blue-100 text-blue-800';
      case 'Market Analysis':
        return 'bg-purple-100 text-purple-800';
      case 'Betting Strategy':
        return 'bg-green-100 text-green-800';
      case 'System Health':
        return 'bg-red-100 text-red-800';
      case 'Environmental Factors':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const highImpactInsights = insights.filter(insight => insight.impact === 'high');
  const mediumImpactInsights = insights.filter(insight => insight.impact === 'medium');
  const lowImpactInsights = insights.filter(insight => insight.impact === 'low');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prediction Insights</h1>
          <p className="text-gray-600 mt-1">
            AI-generated insights and recommendations for better predictions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Refresh Insights</span>
          </Button>
        </div>
      </div>

      {/* Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Impact</p>
                <p className="text-2xl font-bold">{highImpactInsights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Medium Impact</p>
                <p className="text-2xl font-bold">{mediumImpactInsights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Impact</p>
                <p className="text-2xl font-bold">{lowImpactInsights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map(insight => (
          <Card key={insight.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact} Impact
                      </Badge>
                      <Badge className={getCategoryColor(insight.category)}>
                        {insight.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">{insight.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Confidence: {insight.confidence}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{formatTimeAgo(insight.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {insight.relatedMatches && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Related Matches:</h4>
                      <div className="flex flex-wrap gap-2">
                        {insight.relatedMatches.map((match, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {match}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Apply to Predictions
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        Dismiss
                      </Button>
                      <Button variant="ghost" size="sm">
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Recommendations</span>
          </CardTitle>
          <CardDescription>
            Strategic recommendations based on current insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Immediate Actions</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Consider retraining the prediction model due to declining accuracy in Bundesliga matches.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Optimization Opportunities</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Incorporate weather data into prediction algorithms to improve draw probability accuracy.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900">Strategic Insights</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Focus on evening matches in Premier League for higher home team success rates.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Market Opportunities</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Monitor odds movements more closely for potential value betting opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Insight Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High Impact Accuracy</span>
                <span className="text-sm font-medium">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Medium Impact Accuracy</span>
                <span className="text-sm font-medium">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low Impact Accuracy</span>
                <span className="text-sm font-medium">76%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '76%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Trend Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+15%</div>
                  <div className="text-sm text-green-700">Accuracy Improvement</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">23</div>
                  <div className="text-sm text-blue-700">Insights Generated</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Trend Detection Rate</span>
                  <span className="font-medium">89%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Anomaly Detection Rate</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Recommendation Adoption</span>
                  <span className="font-medium">67%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 