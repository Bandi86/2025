'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity, 
  Users, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface PerformanceMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalStake: number;
  totalReturn: number;
  profit: number;
  roi: number;
  winRate: number;
  averageOdds: number;
  bestBet: {
    matchId: string;
    prediction: string;
    odds: number;
    profit: number;
    date: string;
  };
  worstBet: {
    matchId: string;
    prediction: string;
    odds: number;
    loss: number;
    date: string;
  };
  period: string;
  lastUpdated: string;
}

interface ROIAnalysis {
  period: string;
  totalBets: number;
  totalStake: number;
  totalReturn: number;
  profit: number;
  roi: number;
  winRate: number;
  averageOdds: number;
  profitMargin: number;
  riskAdjustedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  bestStreak: number;
  worstStreak: number;
  monthlyBreakdown: Array<{
    month: string;
    bets: number;
    profit: number;
    roi: number;
  }>;
  leagueBreakdown: Array<{
    league: string;
    bets: number;
    profit: number;
    roi: number;
    accuracy: number;
  }>;
  agentBreakdown: Array<{
    agentId: string;
    agentType: string;
    bets: number;
    profit: number;
    roi: number;
    accuracy: number;
  }>;
}

interface AdvancedInsights {
  topPerformingLeagues: Array<{
    league: string;
    accuracy: number;
    profit: number;
    roi: number;
  }>;
  topPerformingAgents: Array<{
    agentId: string;
    agentType: string;
    accuracy: number;
    profit: number;
    roi: number;
  }>;
  bettingPatterns: {
    mostProfitableBetType: string;
    mostProfitableTimeOfDay: string;
    mostProfitableDayOfWeek: string;
    averageStakeSize: number;
    optimalStakeSize: number;
  };
  marketEfficiency: {
    overallEfficiency: number;
    leagueEfficiency: Array<{
      league: string;
      efficiency: number;
    }>;
    timeBasedEfficiency: Array<{
      timeSlot: string;
      efficiency: number;
    }>;
  };
  riskAnalysis: {
    volatility: number;
    maxDrawdown: number;
    var95: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
  };
}

interface RealTimeAnalytics {
  activePredictions: number;
  todayPredictions: number;
  todayProfit: number;
  todayROI: number;
  activeAgents: number;
  systemHealth: string;
  topPerformingAgent: any;
  recentPredictions: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('30d');
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [roiAnalysis, setRoiAnalysis] = useState<ROIAnalysis | null>(null);
  const [advancedInsights, setAdvancedInsights] = useState<AdvancedInsights | null>(null);
  const [realTimeAnalytics, setRealTimeAnalytics] = useState<RealTimeAnalytics | null>(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, roiRes, insightsRes, realtimeRes] = await Promise.all([
        fetch(`/api/analytics/performance?period=${period}${userId ? `&userId=${userId}` : ''}`),
        fetch(`/api/analytics/roi?period=${period}${userId ? `&userId=${userId}` : ''}`),
        fetch(`/api/analytics/insights?period=${period}${userId ? `&userId=${userId}` : ''}`),
        fetch('/api/analytics/realtime'),
      ]);

      if (!metricsRes.ok || !roiRes.ok || !insightsRes.ok || !realtimeRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [metrics, roi, insights, realtime] = await Promise.all([
        metricsRes.json(),
        roiRes.json(),
        insightsRes.json(),
        realtimeRes.json(),
      ]);

      setPerformanceMetrics(metrics);
      setRoiAnalysis(roi);
      setAdvancedInsights(insights);
      setRealTimeAnalytics(realtime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [period, userId]);

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getROIColor = (roi: number) => {
    if (roi >= 10) return 'text-green-600';
    if (roi >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSystemHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchAnalyticsData} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive performance metrics and insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Status Cards */}
      {realTimeAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Predictions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTimeAnalytics.activePredictions}</div>
              <p className="text-xs text-muted-foreground">
                Currently tracking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getProfitColor(realTimeAnalytics.todayProfit)}`}>
                ${realTimeAnalytics.todayProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                ROI: {realTimeAnalytics.todayROI.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTimeAnalytics.activeAgents}</div>
              <p className="text-xs text-muted-foreground">
                Running predictions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSystemHealthColor(realTimeAnalytics.systemHealth)}`}>
                {realTimeAnalytics.systemHealth}
              </div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="insights">Advanced Insights</TabsTrigger>
          <TabsTrigger value="models">ML Models</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceMetrics.accuracy.toFixed(1)}%</div>
                  <Progress value={performanceMetrics.accuracy} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {performanceMetrics.correctPredictions} / {performanceMetrics.totalPredictions} correct
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getProfitColor(performanceMetrics.profit)}`}>
                    ${performanceMetrics.profit.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ROI: <span className={getROIColor(performanceMetrics.roi)}>
                      {performanceMetrics.roi.toFixed(1)}%
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceMetrics.winRate.toFixed(1)}%</div>
                  <Progress value={performanceMetrics.winRate} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Average odds: {performanceMetrics.averageOdds.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Best and Worst Bets */}
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Best Bet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Profit:</span>
                      <span className="text-green-600 font-bold">${performanceMetrics.bestBet.profit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Odds:</span>
                      <span>{performanceMetrics.bestBet.odds.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prediction:</span>
                      <span>{performanceMetrics.bestBet.prediction}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(performanceMetrics.bestBet.date).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Worst Bet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Loss:</span>
                      <span className="text-red-600 font-bold">${performanceMetrics.worstBet.loss.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Odds:</span>
                      <span>{performanceMetrics.worstBet.odds.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prediction:</span>
                      <span>{performanceMetrics.worstBet.prediction}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(performanceMetrics.worstBet.date).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {roiAnalysis && (
            <>
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Bets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{roiAnalysis.totalBets}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Sharpe Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{roiAnalysis.sharpeRatio.toFixed(2)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Max Drawdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${roiAnalysis.maxDrawdown.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Best Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {roiAnalysis.bestStreak}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roiAnalysis.monthlyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="profit" fill="#8884d8" name="Profit" />
                      <Bar dataKey="roi" fill="#82ca9d" name="ROI %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* League Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>League Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roiAnalysis.leagueBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="league" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="roi" fill="#ffc658" name="ROI %" />
                      <Bar dataKey="accuracy" fill="#ff7300" name="Accuracy %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ROI Analysis Tab */}
        <TabsContent value="roi" className="space-y-4">
          {roiAnalysis && (
            <>
              {/* ROI Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Investment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${roiAnalysis.totalStake.toFixed(2)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Return</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${roiAnalysis.totalReturn.toFixed(2)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getProfitColor(roiAnalysis.profit)}`}>
                      ${roiAnalysis.profit.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profit Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Profit Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={roiAnalysis.monthlyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="profit" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Risk-Adjusted Return:</span>
                      <span className="font-bold">{roiAnalysis.riskAdjustedReturn.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sharpe Ratio:</span>
                      <span className="font-bold">{roiAnalysis.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Drawdown:</span>
                      <span className="font-bold text-red-600">${roiAnalysis.maxDrawdown.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Streak Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Best Streak:</span>
                      <span className="font-bold text-green-600">{roiAnalysis.bestStreak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Worst Streak:</span>
                      <span className="font-bold text-red-600">{roiAnalysis.worstStreak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consecutive Wins:</span>
                      <span className="font-bold">{roiAnalysis.consecutiveWins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consecutive Losses:</span>
                      <span className="font-bold">{roiAnalysis.consecutiveLosses}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Advanced Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {advancedInsights && (
            <>
              {/* Top Performing Leagues */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Leagues</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={advancedInsights.topPerformingLeagues}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="league" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
                      <Bar dataKey="accuracy" fill="#82ca9d" name="Accuracy %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Market Efficiency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{advancedInsights.marketEfficiency.overallEfficiency}%</div>
                      <p className="text-sm text-muted-foreground">Overall Efficiency</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {advancedInsights.marketEfficiency.leagueEfficiency.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.league}:</span>
                          <span className="font-bold">{item.efficiency}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Volatility:</span>
                      <span className="font-bold">{advancedInsights.riskAnalysis.volatility.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VaR (95%):</span>
                      <span className="font-bold">{advancedInsights.riskAnalysis.var95.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sortino Ratio:</span>
                      <span className="font-bold">{advancedInsights.riskAnalysis.sortinoRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calmar Ratio:</span>
                      <span className="font-bold">{advancedInsights.riskAnalysis.calmarRatio.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Betting Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Betting Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{advancedInsights.bettingPatterns.mostProfitableBetType}</div>
                      <p className="text-sm text-muted-foreground">Most Profitable Bet Type</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{advancedInsights.bettingPatterns.mostProfitableTimeOfDay}</div>
                      <p className="text-sm text-muted-foreground">Best Time of Day</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{advancedInsights.bettingPatterns.mostProfitableDayOfWeek}</div>
                      <p className="text-sm text-muted-foreground">Best Day of Week</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">${advancedInsights.bettingPatterns.optimalStakeSize}</div>
                      <p className="text-sm text-muted-foreground">Optimal Stake Size</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ML Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ML Model Performance</CardTitle>
              <CardDescription>
                Advanced machine learning model analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  ML model analytics will be available when models are deployed and running.
                </p>
                <Button className="mt-4" variant="outline">
                  View Model Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 