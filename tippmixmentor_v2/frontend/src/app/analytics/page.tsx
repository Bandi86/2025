'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Activity,
  Calendar,
  DollarSign,
  Award
} from 'lucide-react';

export default function AnalyticsPage() {
  // Mock data for analytics
  const performanceMetrics = [
    { name: 'Prediction Accuracy', value: 78.5, change: '+2.3%', trend: 'up' },
    { name: 'Total Predictions', value: 1247, change: '+15%', trend: 'up' },
    { name: 'User Engagement', value: 92.1, change: '+5.2%', trend: 'up' },
    { name: 'System Uptime', value: 99.9, change: '+0.1%', trend: 'up' },
  ];

  const topLeagues = [
    { name: 'Premier League', predictions: 342, accuracy: 82.1 },
    { name: 'La Liga', predictions: 298, accuracy: 79.3 },
    { name: 'Bundesliga', predictions: 267, accuracy: 76.8 },
    { name: 'Serie A', predictions: 234, accuracy: 74.2 },
    { name: 'Ligue 1', predictions: 189, accuracy: 71.5 },
  ];

  const recentTrends = [
    { period: 'Last 7 days', accuracy: 81.2, predictions: 89 },
    { period: 'Last 30 days', accuracy: 78.5, predictions: 342 },
    { period: 'Last 90 days', accuracy: 76.8, predictions: 987 },
    { period: 'Last 6 months', accuracy: 74.2, predictions: 2156 },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights into your prediction performance and system metrics
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Last 30 days</Badge>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{metric.name}</p>
                      <p className="text-2xl font-bold">{metric.value}{metric.name.includes('Accuracy') || metric.name.includes('Uptime') ? '%' : ''}</p>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{metric.change}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Leagues Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Top Leagues Performance</span>
                </CardTitle>
                <CardDescription>
                  Prediction accuracy by league
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topLeagues.map((league) => (
                    <div key={league.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{league.name}</p>
                        <p className="text-xs text-gray-500">{league.predictions} predictions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{league.accuracy}%</p>
                        <Progress value={league.accuracy} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Recent Trends</span>
                </CardTitle>
                <CardDescription>
                  Performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTrends.map((trend) => (
                    <div key={trend.period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{trend.period}</p>
                        <p className="text-xs text-gray-500">{trend.predictions} predictions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{trend.accuracy}% accuracy</p>
                        <Progress value={trend.accuracy} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>User Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Users</span>
                    <span className="font-semibold">342</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">New Users</span>
                    <span className="font-semibold">28</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Session</span>
                    <span className="font-semibold">24m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Bounce Rate</span>
                    <span className="font-semibold">12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>System Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">API Response</span>
                    <span className="font-semibold">245ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-semibold">0.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Load Time</span>
                    <span className="font-semibold">1.2s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Revenue Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Revenue</span>
                    <span className="font-semibold">$12,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Growth</span>
                    <span className="font-semibold text-green-600">+15.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Subscribers</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Churn Rate</span>
                    <span className="font-semibold">2.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Performance Chart</span>
              </CardTitle>
              <CardDescription>
                Prediction accuracy over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart component will be integrated here</p>
                  <p className="text-sm text-gray-400">Showing prediction accuracy trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 