'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react';

interface Insight {
  id: string;
  type: 'performance' | 'recommendation' | 'warning' | 'optimization';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  timestamp: Date;
}

export function AgentInsights() {
  // Mock insights data
  const insights: Insight[] = [
    {
      id: '1',
      type: 'performance',
      title: 'High Accuracy Trend',
      description: 'Market Analysis Agent shows consistent 87% accuracy over the last 30 days, indicating stable performance.',
      priority: 'low',
      category: 'Performance',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      type: 'recommendation',
      title: 'Optimize Response Time',
      description: 'Value Detection Agent response time increased by 15%. Consider scaling resources or optimizing algorithms.',
      priority: 'medium',
      category: 'Optimization',
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: '3',
      type: 'warning',
      title: 'Critical Agent Failure',
      description: 'Strategy Optimization Agent has failed 12 consecutive tasks. Immediate intervention required.',
      priority: 'high',
      category: 'System Health',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: '4',
      type: 'optimization',
      title: 'Resource Utilization',
      description: 'Prediction Optimization Agent is operating at 85% efficiency. Consider enabling additional features.',
      priority: 'low',
      category: 'Resource Management',
      timestamp: new Date(Date.now() - 5400000)
    },
    {
      id: '5',
      type: 'recommendation',
      title: 'Model Retraining Opportunity',
      description: 'Risk Assessment Agent accuracy has plateaued. Consider retraining with recent data for improved performance.',
      priority: 'medium',
      category: 'Model Management',
      timestamp: new Date(Date.now() - 9000000)
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'optimization':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      default:
        return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
      case 'Performance':
        return 'bg-blue-100 text-blue-800';
      case 'Optimization':
        return 'bg-purple-100 text-purple-800';
      case 'System Health':
        return 'bg-red-100 text-red-800';
      case 'Resource Management':
        return 'bg-green-100 text-green-800';
      case 'Model Management':
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

  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const mediumPriorityInsights = insights.filter(insight => insight.priority === 'medium');
  const lowPriorityInsights = insights.filter(insight => insight.priority === 'low');

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold">{highPriorityInsights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Medium Priority</p>
                <p className="text-2xl font-bold">{mediumPriorityInsights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Priority</p>
                <p className="text-2xl font-bold">{lowPriorityInsights.length}</p>
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
          <Card key={insight.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <Badge className={getCategoryColor(insight.category)}>
                        {insight.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatTimeAgo(insight.timestamp)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View Details
                      </button>
                      <button className="text-sm text-gray-600 hover:text-gray-800">
                        Dismiss
                      </button>
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
            Automated suggestions for improving agent performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Immediate Actions</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Restart the Strategy Optimization Agent and investigate the root cause of task failures.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Optimization Opportunities</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider implementing caching for Value Detection Agent to improve response times.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Performance Insights</h4>
                <p className="text-sm text-green-700 mt-1">
                  Overall system health is good with 80% of agents performing optimally.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 