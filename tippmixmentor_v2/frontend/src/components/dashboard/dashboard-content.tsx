'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Activity, 
  BarChart3, 
  MessageSquare,
  Globe,
  Clock,
  Trophy,
  Zap,
  Eye,
  Heart,
  ArrowRight,
  Brain,
  Database,
  Wifi,
  Shield,
  Sparkles,
  ChevronRight,
  PlayCircle,
  LineChart,
  Star,
  Award
} from 'lucide-react';
import { SocialFeed } from '@/components/social/social-feed';
import { AgentInsights } from '@/components/predictions/agent-insights';
import { LiveMatchesDashboard } from '@/components/predictions/live-matches-dashboard';
import { HealthStatus } from '@/components/ui/health-status';
import { 
  useHealthStatus, 
  usePerformanceMetrics, 
  useAgents, 
  useLiveMatches, 
  usePredictionStats,
  useUserPredictions,
  useUserProfile,
  useTestAuth
} from '@/hooks/use-api';
import { debugApiClient } from '@/lib/api-client';

interface DashboardStats {
  totalPredictions: number;
  accuracyRate: number;
  activeUsers: number;
  liveMatches: number;
  systemHealth: number;
  recentActivity: number;
  aiAgents: number;
  revenue: number;
}

export function DashboardContent() {
  const { user, debug: debugAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [apiUrl, setApiUrl] = useState<string>('');

  // Handle client-side only values to prevent hydration mismatch
  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
  }, []);

  // Real data hooks
  const { data: healthData } = useHealthStatus();
  const { data: metricsData } = usePerformanceMetrics();
  const { data: agentsData } = useAgents();
  const { data: liveMatchesData } = useLiveMatches();
  const { data: predictionStatsData } = usePredictionStats();
  const { data: userProfile } = useUserProfile();
  const { data: userPredictionsData } = useUserPredictions(user?.id || '', 5);
  const { data: testAuthData, error: testAuthError, refetch: testAuth } = useTestAuth();

  // Compute real stats from API data
  const stats: DashboardStats = {
    totalPredictions: predictionStatsData?.totalPredictions || 0,
    accuracyRate: predictionStatsData?.accuracyRate || 0,
    activeUsers: predictionStatsData?.activeUsers || 0,
    liveMatches: liveMatchesData?.length || 0,
    systemHealth: healthData?.status === 'healthy' ? 98 : 85,
    recentActivity: userPredictionsData?.length || 0,
    aiAgents: agentsData?.length || 0,
    revenue: predictionStatsData?.totalRevenue || 0,
  };

  // Real recent predictions from API
  const recentPredictions = userPredictionsData?.map((prediction: any) => ({
    id: prediction.id,
    match: `${prediction.homeTeam} vs ${prediction.awayTeam}`,
    prediction: prediction.predictedScore,
    confidence: prediction.confidence,
    status: prediction.status || 'pending',
    profit: prediction.profit ? `+$${prediction.profit}` : 'TBD',
    league: prediction.league || 'Unknown League'
  })) || [];

  const quickActions = [
    { 
      name: 'Create Prediction', 
      icon: Target, 
      href: '/predictions', 
      gradient: 'from-emerald-500 to-teal-600',
      description: 'AI-powered predictions'
    },
    { 
      name: 'Live Matches', 
      icon: PlayCircle, 
      href: '/live-matches', 
      gradient: 'from-red-500 to-pink-600',
      description: 'Real-time data'
    },
    { 
      name: 'AI Agents', 
      icon: Brain, 
      href: '/agents', 
      gradient: 'from-purple-500 to-indigo-600',
      description: 'Manage AI agents'
    },
    { 
      name: 'Analytics', 
      icon: LineChart, 
      href: '/analytics', 
      gradient: 'from-blue-500 to-cyan-600',
      description: 'Performance insights'
    },
  ];

  const featuredModules = [
    {
      title: 'Football Data Hub',
      icon: Database,
      description: 'Access comprehensive football statistics and match data',
      status: 'Active',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/football-data'
    },
    {
      title: 'Social Network',
      icon: MessageSquare,
      description: 'Connect with football prediction community',
      status: 'Live',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      href: '/social'
    },
    {
      title: 'Prediction Engine',
      icon: Sparkles,
      description: 'AI-powered match outcome predictions',
      status: 'Running',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/predictions'
    },
    {
      title: 'Live Data Stream',
      icon: Wifi,
      description: 'Real-time match updates and statistics',
      status: 'Connected',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/live-matches'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Welcome back, {user?.firstName || user?.username}! 
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Your AI-powered football prediction dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${healthData?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm font-medium">
                    {healthData?.status === 'healthy' ? 'System Online' : 'System Issues'}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {user?.role}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30">
                  {userProfile?.subscriptionPlan || 'Pro Plan'}
                </Badge>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">{stats.accuracyRate}%</div>
                <div className="text-sm text-blue-100">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300">+${stats.revenue.toLocaleString()}</div>
                <div className="text-sm text-blue-100">Monthly Revenue</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full translate-y-36 -translate-x-36"></div>
      </div>

      {/* Debug Section - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Information</CardTitle>
            <CardDescription>Authentication and API debugging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Authentication Status</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Not authenticated'}</p>
                  <p><strong>Token:</strong> {user ? 'Present' : 'Missing'}</p>
                  <p><strong>API URL:</strong> {apiUrl || 'Loading...'}</p>
                </div>
                <div className="space-x-2">
                  <Button 
                    onClick={() => testAuth()} 
                    variant="outline" 
                    size="sm"
                  >
                    Test Auth API
                  </Button>
                  <Button 
                    onClick={() => debugAuth()} 
                    variant="outline" 
                    size="sm"
                  >
                    Debug Auth
                  </Button>
                  <Button 
                    onClick={() => debugApiClient()} 
                    variant="outline" 
                    size="sm"
                  >
                    Debug API
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Test Results</h4>
                <div className="space-y-2 text-sm">
                  {testAuthError ? (
                    <p className="text-red-600"><strong>Error:</strong> {testAuthError.message}</p>
                  ) : testAuthData ? (
                    <p className="text-green-600"><strong>Success:</strong> API call working</p>
                  ) : (
                    <p className="text-gray-600">Click "Test Auth API" to test</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-700">Total Predictions</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.totalPredictions.toLocaleString()}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+12% this month</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-200 rounded-2xl group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">Accuracy Rate</p>
                <p className="text-3xl font-bold text-blue-900">{stats.accuracyRate}%</p>
                <div className="flex items-center space-x-1 text-xs">
                  <Award className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-600 font-medium">Above average</span>
                </div>
              </div>
              <div className="p-3 bg-blue-200 rounded-2xl group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:shadow-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700">AI Agents</p>
                <p className="text-3xl font-bold text-purple-900">{stats.aiAgents}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <Zap className="w-3 h-3 text-purple-600" />
                  <span className="text-purple-600 font-medium">All active</span>
                </div>
              </div>
              <div className="p-3 bg-purple-200 rounded-2xl group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700">Live Matches</p>
                <p className="text-3xl font-bold text-red-900">{stats.liveMatches}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <Wifi className="w-3 h-3 text-red-600" />
                  <span className="text-red-600 font-medium">Real-time</span>
                </div>
              </div>
              <div className="p-3 bg-red-200 rounded-2xl group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Modules */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Platform Modules</h2>
            <p className="text-slate-600">Explore our comprehensive football prediction ecosystem</p>
          </div>
          <Button variant="outline" className="gap-2">
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredModules.map((module, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${module.bgColor} group-hover:scale-110 transition-transform`}>
                      <module.icon className={`w-6 h-6 ${module.color}`} />
                    </div>
                    <Badge variant="outline" className={`text-xs font-medium ${module.color.replace('text-', 'border-').replace('600', '200')} ${module.bgColor.replace('bg-', 'bg-').replace('50', '100')}`}>
                      {module.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between group-hover:bg-blue-50 group-hover:text-blue-600"
                    asChild
                  >
                    <a href={module.href}>
                      Explore <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Social Feed
            </TabsTrigger>
            <TabsTrigger value="predictions" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Predictions
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              System
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-slate-50 to-white border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl">Quick Actions</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Jump into your most important tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={action.name}
                    variant="ghost"
                    className="w-full h-16 justify-start space-x-4 bg-white/70 hover:bg-white hover:shadow-md transition-all group border border-slate-200"
                    asChild
                  >
                    <a href={action.href}>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-900">{action.name}</p>
                        <p className="text-sm text-slate-500">{action.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Predictions */}
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl">Recent Predictions</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Your latest prediction results and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPredictions.map((prediction) => (
                  <div key={prediction.id} className="p-4 bg-white/70 rounded-xl border border-emerald-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs text-slate-600">
                          {prediction.league}
                        </Badge>
                        <Badge 
                          variant={prediction.status === 'correct' ? 'default' : prediction.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {prediction.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${prediction.profit.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {prediction.profit}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{prediction.match}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Prediction: <span className="font-medium">{prediction.prediction}</span></span>
                        <span className="text-slate-500">{prediction.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4 group">
                  View All Predictions <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* AI Agent Insights */}
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">AI Agent Insights</span>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Real-time intelligent recommendations and market analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentInsights />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">Community Social Feed</span>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Connect with football prediction enthusiasts worldwide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialFeed />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">Live Matches & Predictions</span>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Real-time match data with AI-powered predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveMatchesDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl">System Health</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Monitor platform performance and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthStatus 
                  showMetrics={true} 
                  autoRefresh={true}
                  refreshInterval={30000}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl">Performance Metrics</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Key performance indicators and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-900">API Response Time</span>
                      </div>
                      <span className="text-blue-600 font-bold">{metricsData?.responseTime || 0}ms</span>
                    </div>
                    <Progress value={Math.min((metricsData?.responseTime || 0) / 10, 100)} className="h-3 bg-blue-100" />
                    <p className="text-xs text-slate-500 mt-2">
                      {metricsData?.responseTime && metricsData.responseTime < 500 ? 'Excellent performance' : 'Good performance'}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-slate-900">Prediction Accuracy</span>
                      </div>
                      <span className="text-emerald-600 font-bold">{stats.accuracyRate}%</span>
                    </div>
                    <Progress value={stats.accuracyRate} className="h-3 bg-emerald-100" />
                    <p className="text-xs text-slate-500 mt-2">
                      {stats.accuracyRate > 75 ? 'Above industry average' : 'Good accuracy'}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-slate-900">System Uptime</span>
                      </div>
                      <span className="text-purple-600 font-bold">{healthData?.status === 'healthy' ? '99.9%' : '95.2%'}</span>
                    </div>
                    <Progress value={healthData?.status === 'healthy' ? 99.9 : 95.2} className="h-3 bg-purple-100" />
                    <p className="text-xs text-slate-500 mt-2">
                      {healthData?.status === 'healthy' ? 'Outstanding reliability' : 'Good reliability'}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-slate-900">Active Users</span>
                      </div>
                      <span className="text-orange-600 font-bold">{stats.activeUsers}</span>
                    </div>
                    <Progress value={Math.min((stats.activeUsers / 1000) * 100, 100)} className="h-3 bg-orange-100" />
                    <p className="text-xs text-slate-500 mt-2">Active platform users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 