'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { LiveMatchesDashboard } from '@/components/predictions/live-matches-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, TrendingUp } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';

export default function LiveMatchesPage() {
  const { data, loading, error } = useDashboardData();

  // Calculate real stats
  const liveMatchesCount = data?.liveMatches?.filter(m => m.status === 'live').length || 0;
  const upcomingMatchesCount = data?.liveMatches?.filter(m => m.status === 'scheduled').length || 0;
  const predictionsCount = data?.predictions?.length || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Matches</h1>
              <p className="text-gray-600 mt-1">
                Real-time match data, live scores, and instant predictions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Activity className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Live Matches</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : liveMatchesCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : upcomingMatchesCount}
                    </p>
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
                    <p className="text-sm text-gray-600">Predictions</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : predictionsCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Matches Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Live Matches Dashboard</span>
              </CardTitle>
              <CardDescription>
                Real-time match data with live scores, statistics, and AI-powered predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveMatchesDashboard />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 