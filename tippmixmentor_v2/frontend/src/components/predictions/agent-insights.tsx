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
  Clock, 
  Zap,
  Target,
  BarChart3,
  Lightbulb,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface AgentInsight {
  id: string;
  type: 'market_trend' | 'performance_optimization' | 'risk_alert' | 'opportunity' | 'prediction_accuracy';
  title: string;
  content: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  createdAt: Date;
  agentId: string;
  agentName: string;
  metadata?: {
    affectedMatches?: number;
    potentialProfit?: number;
    riskLevel?: string;
    timeframe?: string;
  };
}

interface AgentInsightsProps {
  matchId?: string;
  leagueId?: string;
  className?: string;
}

export function AgentInsights({ matchId, leagueId, className }: AgentInsightsProps) {
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockInsights: AgentInsight[] = [
      {
        id: '1',
        type: 'market_trend',
        title: 'Home Team Advantage Strengthening',
        content: 'Analysis shows home team performance has improved by 15% in evening matches this season. This trend is particularly strong for teams with recent coaching changes.',
        confidence: 0.87,
        impact: 'high',
        createdAt: new Date(Date.now() - 1800000),
        agentId: 'agent-1',
        agentName: 'Market Analysis Agent',
        metadata: {
          affectedMatches: 12,
          potentialProfit: 2500,
          timeframe: 'Next 2 weeks'
        }
      },
      {
        id: '2',
        type: 'risk_alert',
        title: 'High Volatility Expected',
        content: 'Recent player injuries and weather conditions suggest higher than usual match volatility. Consider reducing bet sizes and diversifying predictions.',
        confidence: 0.92,
        impact: 'high',
        createdAt: new Date(Date.now() - 3600000),
        agentId: 'agent-2',
        agentName: 'Risk Assessment Agent',
        metadata: {
          riskLevel: 'High',
          affectedMatches: 8
        }
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Underdog Value Detected',
        content: 'Statistical analysis reveals undervalued underdogs in 3 upcoming matches. Historical data suggests 40% higher ROI on similar scenarios.',
        confidence: 0.78,
        impact: 'medium',
        createdAt: new Date(Date.now() - 5400000),
        agentId: 'agent-3',
        agentName: 'Value Detection Agent',
        metadata: {
          affectedMatches: 3,
          potentialProfit: 1800
        }
      },
      {
        id: '4',
        type: 'prediction_accuracy',
        title: 'Model Performance Improving',
        content: 'Recent predictions show 8% improvement in accuracy. The model has learned from recent match outcomes and adjusted its algorithms accordingly.',
        confidence: 0.85,
        impact: 'medium',
        createdAt: new Date(Date.now() - 7200000),
        agentId: 'agent-4',
        agentName: 'Prediction Optimization Agent'
      },
      {
        id: '5',
        type: 'performance_optimization',
        title: 'Optimal Betting Strategy',
        content: 'Analysis of your betting patterns suggests optimal bet sizing of 2-3% of bankroll per match, with focus on accumulator bets for higher ROI.',
        confidence: 0.91,
        impact: 'high',
        createdAt: new Date(Date.now() - 9000000),
        agentId: 'agent-5',
        agentName: 'Strategy Optimization Agent',
        metadata: {
          potentialProfit: 3200
        }
      }
    ];

    setInsights(mockInsights);
    setIsLoading(false);
  }, [matchId, leagueId]);

  const getInsightIcon = (type: AgentInsight['type']) => {
    switch (type) {
      case 'market_trend': return <TrendingUp className="w-5 h-5" />;
      case 'risk_alert': return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity': return <Target className="w-5 h-5" />;
      case 'prediction_accuracy': return <BarChart3 className="w-5 h-5" />;
      case 'performance_optimization': return <Zap className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: AgentInsight['type']) => {
    switch (type) {
      case 'market_trend': return 'text-blue-600 bg-blue-100';
      case 'risk_alert': return 'text-red-600 bg-red-100';
      case 'opportunity': return 'text-green-600 bg-green-100';
      case 'prediction_accuracy': return 'text-purple-600 bg-purple-100';
      case 'performance_optimization': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: AgentInsight['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Intelligent recommendations from your AI agents
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {formatTimeAgo(lastUpdated)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map(insight => (
            <div key={insight.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.content}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant="outline" className="text-xs">
                        {insight.agentName}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getImpactColor(insight.impact)}`}
                      >
                        {insight.impact} impact
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>{Math.round(insight.confidence * 100)}% confidence</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(insight.createdAt)}</span>
                      </div>
                    </div>
                    
                    {insight.metadata?.potentialProfit && (
                      <div className="text-sm font-medium text-green-600">
                        +${insight.metadata.potentialProfit}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <Progress value={insight.confidence * 100} className="flex-1 h-2" />
                    <span className="text-xs font-medium">{Math.round(insight.confidence * 100)}%</span>
                  </div>

                  {insight.metadata && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {insight.metadata.affectedMatches && (
                        <span>{insight.metadata.affectedMatches} matches affected</span>
                      )}
                      {insight.metadata.timeframe && (
                        <span>Timeframe: {insight.metadata.timeframe}</span>
                      )}
                      {insight.metadata.riskLevel && (
                        <span className="text-red-600">Risk: {insight.metadata.riskLevel}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Details
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Apply to Predictions
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {insights.length === 0 && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
            <p className="text-gray-600">
              AI agents are analyzing your data. Check back soon for intelligent recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 