"use client"

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Activity, 
  Wifi, 
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { 
  useHealthStatus, 
  usePerformanceMetrics, 
  useLiveMatches, 
  usePredictions,
  usePredictionStats,
  useAgents,
  useNotifications,
  useUserPerformance
} from '@/hooks/use-real-data';
import { useRealtimeDashboard } from '@/hooks/use-realtime-data';
import { useToast } from '@/hooks/use-toast';

export function EnhancedDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Real-time data hooks
  const realtime = useRealtimeDashboard();
  
  // Data fetching hooks
  const { data: health, isLoading: healthLoading } = useHealthStatus();
  const { data: metrics, isLoading: metricsLoading } = usePerformanceMetrics();
  const { data: liveMatches, isLoading: matchesLoading } = useLiveMatches();
  const { data: predictions, isLoading: predictionsLoading } = usePredictions();
  const { data: predictionStats, isLoading: statsLoading } = usePredictionStats();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: userPerformance, isLoading: performanceLoading } = useUserPerformance();

  // Subscribe to real-time updates when component mounts
  useEffect(() => {
    if (realtime.isConnected && user) {
      realtime.matches.subscribeToAllMatches();
      realtime.predictions.subscribeToUserPredictions(user.id);
      realtime.agents.subscribeToAllAgents();
      realtime.notifications.subscribeToNotifications(user.id);
      realtime.analytics.subscribeToAnalytics();
      
      toast({
        title: "Real-time connection established",
        description: "You're now receiving live updates",
      });
    }
  }, [realtime.isConnected, user, toast]);

  // Handle real-time connection status
  useEffect(() => {
    if (!realtime.isConnected) {
      toast({
        title: "Connection lost",
        description: "Attempting to reconnect...",
        variant: "destructive",
      });
    }
  }, [realtime.isConnected, toast]);

  const getSystemStatusColor = () => {
    if (healthLoading) return 'bg-gray-500';
    if (health?.status === 'healthy') return 'bg-green-500';
    return 'bg-red-500';
  };

  const getConnectionStatus = () => {
    if (realtime.isConnected) {
      return { icon: Wifi, color: 'text-green-500', text: 'Connected' };
    }
    return { icon: WifiOff, color: 'text-red-500', text: 'Disconnected' };
  };

  const ConnectionStatus = getConnectionStatus();

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || user?.username}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your predictions today
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ConnectionStatus.icon className={`h-5 w-5 ${ConnectionStatus.color}`} />
          <span className={`text-sm font-medium ${ConnectionStatus.color}`}>
            {ConnectionStatus.text}
          </span>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <div className={`h-3 w-3 rounded-full ${getSystemStatusColor()}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? 'Loading...' : health?.status === 'healthy' ? 'Healthy' : 'Issues'}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.uptime ? `Uptime: ${Math.floor(health.uptime / 3600)}h` : 'Checking...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : `${metrics?.responseTime || 0}ms`}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.requestsPerSecond ? `${metrics.requestsPerSecond} req/s` : 'Monitoring...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchesLoading ? '...' : liveMatches?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentsLoading ? '...' : agents?.filter(a => a.status === 'online').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {agents?.length || 0} total agents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="live-matches">Live Matches</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prediction Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction Performance</CardTitle>
                <CardDescription>Your recent prediction accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Accuracy</span>
                      <span className="text-sm font-bold">
                        {predictionStats?.accuracy ? `${(predictionStats.accuracy * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <Progress 
                      value={predictionStats?.accuracy ? predictionStats.accuracy * 100 : 0} 
                      className="h-2" 
                    />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {predictionStats?.correct || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Correct</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {predictionStats?.incorrect || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Incorrect</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {predictionStats?.pending || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Latest system updates</CardDescription>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications?.slice(0, 5).map((notification: any) => (
                      <div key={notification.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {notification.type === 'info' && <Clock className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Predictions</CardTitle>
              <CardDescription>Your latest prediction activity</CardDescription>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {predictions?.slice(0, 10).map((prediction: any) => (
                    <div key={prediction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{prediction.match?.homeTeam} vs {prediction.match?.awayTeam}</div>
                        <div className="text-sm text-gray-500">
                          Prediction: {prediction.predictedResult} (Confidence: {prediction.confidence}%)
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            prediction.status === 'correct' ? 'default' :
                            prediction.status === 'incorrect' ? 'destructive' : 'secondary'
                          }
                        >
                          {prediction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live-matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Matches</CardTitle>
              <CardDescription>Currently active matches</CardDescription>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {liveMatches?.map((match: any) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{match.homeTeam} vs {match.awayTeam}</div>
                        <div className="text-sm text-gray-500">
                          {match.league} • {match.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <div className="text-sm text-gray-500">
                          {match.minute}' {match.status === 'live' && <span className="text-red-500">●</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!liveMatches || liveMatches.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No live matches at the moment
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Status</CardTitle>
              <CardDescription>System agents and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {agents?.map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-500">
                          {agent.description} • {agent.currentTask || 'Idle'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            agent.status === 'online' ? 'default' :
                            agent.status === 'busy' ? 'secondary' :
                            agent.status === 'error' ? 'destructive' : 'outline'
                          }
                        >
                          {agent.status}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {agent.performance?.accuracy ? `${(agent.performance.accuracy * 100).toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Your performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userPerformance?.totalPredictions || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Predictions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {userPerformance?.successRate ? `${(userPerformance.successRate * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {userPerformance?.profitLoss || 0}
                      </div>
                      <div className="text-sm text-gray-500">Profit/Loss</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Weekly Trend</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <Progress value={userPerformance?.weeklyTrend || 0} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 