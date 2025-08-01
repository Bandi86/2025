'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { useLiveMatches } from '@/hooks/use-dashboard-data';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect } from 'react';

import { EnhancedFootballDashboard } from '@/components/football-data/enhanced-football-dashboard';
import { StandingsDashboard } from '@/components/football-data/standings-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Database, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Download,
  Trophy
} from 'lucide-react';

export default function FootballDataPage() {
  const { matches } = useLiveMatches(30000);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await apiClient.getESPNSupportedLeagues();
        if (response.success && response.data) {
          setLeagues(response.data);
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  // Calculate real stats
  const totalMatches = matches.length;
  const leaguesCount = leagues.length;
  const teamsCount = leagues.reduce((acc, league) => acc + (league.teams?.length || 0), 0);
  const seasonsCount = 8; // This is harder to calculate, keeping as estimate

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Football Data</h1>
              <p className="text-gray-600 mt-1">
                Access comprehensive football statistics, match data, and historical records from multiple sources
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>Auto-refresh</span>
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Matches</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : totalMatches}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Globe className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Leagues</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : leaguesCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teams</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : teamsCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seasons</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : seasonsCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="matches" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matches" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Matches & Live Data</span>
              </TabsTrigger>
              <TabsTrigger value="standings" className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>League Standings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="space-y-6">
              {/* Enhanced Football Data Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>Enhanced Football Data Dashboard</span>
                  </CardTitle>
                  <CardDescription>
                    Multi-source football data with smart merging and API-Football integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedFootballDashboard />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="standings" className="space-y-6">
              <StandingsDashboard />
            </TabsContent>
          </Tabs>

          {/* Data Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
                <CardDescription>
                  External APIs and data providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">ESPN API</p>
                      <p className="text-sm text-gray-500">Live match data & statistics</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">API-Football</p>
                      <p className="text-sm text-gray-500">Comprehensive football data</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Unified Data Service</p>
                      <p className="text-sm text-gray-500">Merged data from multiple sources</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Transfermarkt</p>
                      <p className="text-sm text-gray-500">Player data</p>
                    </div>
                  </div>
                  <Badge variant="outline">Limited</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>
                  Download data in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">CSV Export</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">JSON Export</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Excel Export</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">API Access</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 