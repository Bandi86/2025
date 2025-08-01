import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';


export interface PerformanceMetrics {
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

export interface PredictionAnalytics {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  actualResult: string;
  isCorrect: boolean;
  confidence: number;
  odds: number;
  stake: number;
  return: number;
  profit: number;
  date: string;
  agentId?: string;
  agentType?: string;
}

export interface ROIAnalysis {
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

export interface ModelPerformance {
  modelId: string;
  modelName: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  averageConfidence: number;
  profitGenerated: number;
  roi: number;
  lastUpdated: string;
  performanceHistory: Array<{
    date: string;
    accuracy: number;
    profit: number;
  }>;
}

export interface AdvancedInsights {
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
    var95: number; // Value at Risk (95%)
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly cacheTtl = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get comprehensive performance metrics for a user or system-wide
   */
  async getPerformanceMetrics(userId?: string, period: string = '30d'): Promise<PerformanceMetrics> {
    const cacheKey = `performance_metrics:${userId || 'system'}:${period}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const cutoffDate = this.getCutoffDate(period);
      
      // For now, return mock data since we don't have prediction data yet
      const mockPredictions = [
        {
          id: 'pred-1',
          userId: userId || 'system',
          matchId: 'match-1',
          prediction: 'home',
          actualResult: 'home',
          isCorrect: true,
          confidence: 0.85,
          odds: 2.1,
          stake: 100,
          return: 210,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team A', awayTeam: 'Team B', league: 'PL' },
          agent: { agentType: 'prediction' }
        },
        {
          id: 'pred-2',
          userId: userId || 'system',
          matchId: 'match-2',
          prediction: 'away',
          actualResult: 'home',
          isCorrect: false,
          confidence: 0.75,
          odds: 3.2,
          stake: 50,
          return: 0,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team C', awayTeam: 'Team D', league: 'PL' },
          agent: { agentType: 'prediction' }
        }
      ];

      const metrics = this.calculatePerformanceMetrics(mockPredictions, period);
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(metrics), this.cacheTtl);
      
      return metrics;
    } catch (error) {
      this.logger.error(`Error getting performance metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed ROI analysis
   */
  async getROIAnalysis(userId?: string, period: string = '90d'): Promise<ROIAnalysis> {
    const cacheKey = `roi_analysis:${userId || 'system'}:${period}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const cutoffDate = this.getCutoffDate(period);
      
      // For now, return mock data since we don't have prediction data yet
      const mockPredictions = [
        {
          id: 'pred-1',
          userId: userId || 'system',
          matchId: 'match-1',
          prediction: 'home',
          actualResult: 'home',
          isCorrect: true,
          confidence: 0.85,
          odds: 2.1,
          stake: 100,
          return: 210,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team A', awayTeam: 'Team B', league: 'PL' },
          agent: { agentType: 'prediction' }
        },
        {
          id: 'pred-2',
          userId: userId || 'system',
          matchId: 'match-2',
          prediction: 'away',
          actualResult: 'home',
          isCorrect: false,
          confidence: 0.75,
          odds: 3.2,
          stake: 50,
          return: 0,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team C', awayTeam: 'Team D', league: 'PL' },
          agent: { agentType: 'prediction' }
        }
      ];

      const roiAnalysis = this.calculateROIAnalysis(mockPredictions, period);
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(roiAnalysis), this.cacheTtl);
      
      return roiAnalysis;
    } catch (error) {
      this.logger.error(`Error getting ROI analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get model performance analytics
   */
  async getModelPerformance(modelId?: string): Promise<ModelPerformance[]> {
    const cacheKey = `model_performance:${modelId || 'all'}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get model performance data
      const modelPerformance = await this.getModelPerformanceData(modelId);
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(modelPerformance), this.cacheTtl);
      
      return modelPerformance;
    } catch (error) {
      this.logger.error(`Error getting model performance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get advanced insights and patterns
   */
  async getAdvancedInsights(userId?: string, period: string = '90d'): Promise<AdvancedInsights> {
    const cacheKey = `advanced_insights:${userId || 'system'}:${period}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const cutoffDate = this.getCutoffDate(period);
      
      // For now, return mock data since we don't have prediction data yet
      const mockPredictions = [
        {
          id: 'pred-1',
          userId: userId || 'system',
          matchId: 'match-1',
          prediction: 'home',
          actualResult: 'home',
          isCorrect: true,
          confidence: 0.85,
          odds: 2.1,
          stake: 100,
          return: 210,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team A', awayTeam: 'Team B', league: 'PL' },
          agent: { agentType: 'prediction' }
        },
        {
          id: 'pred-2',
          userId: userId || 'system',
          matchId: 'match-2',
          prediction: 'away',
          actualResult: 'home',
          isCorrect: false,
          confidence: 0.75,
          odds: 3.2,
          stake: 50,
          return: 0,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team C', awayTeam: 'Team D', league: 'PL' },
          agent: { agentType: 'prediction' }
        }
      ];

      const insights = this.calculateAdvancedInsights(mockPredictions);
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(insights), this.cacheTtl);
      
      return insights;
    } catch (error) {
      this.logger.error(`Error getting advanced insights: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get prediction analytics with detailed breakdown
   */
  async getPredictionAnalytics(
    userId?: string, 
    period: string = '30d',
    filters?: { league?: string; agentType?: string; minConfidence?: number }
  ): Promise<PredictionAnalytics[]> {
    const cacheKey = `prediction_analytics:${userId || 'system'}:${period}:${JSON.stringify(filters)}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const cutoffDate = this.getCutoffDate(period);
      
      // Build where clause
      const whereClause: any = {
        ...(userId && { userId }),
        createdAt: { gte: cutoffDate },
        isCompleted: true,
        ...(filters?.league && { match: { league: filters.league } }),
        ...(filters?.agentType && { agent: { agentType: filters.agentType } }),
        ...(filters?.minConfidence && { confidence: { gte: filters.minConfidence } }),
      };

      // For now, return mock data since we don't have prediction data yet
      const mockPredictions = [
        {
          id: 'pred-1',
          userId: userId || 'system',
          matchId: 'match-1',
          prediction: 'home',
          actualResult: 'home',
          isCorrect: true,
          confidence: 0.85,
          odds: 2.1,
          stake: 100,
          return: 210,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team A', awayTeam: 'Team B', league: 'PL' },
          agent: { agentType: 'prediction' }
        },
        {
          id: 'pred-2',
          userId: userId || 'system',
          matchId: 'match-2',
          prediction: 'away',
          actualResult: 'home',
          isCorrect: false,
          confidence: 0.75,
          odds: 3.2,
          stake: 50,
          return: 0,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team C', awayTeam: 'Team D', league: 'PL' },
          agent: { agentType: 'prediction' }
        }
      ];

      const analytics = mockPredictions.map(pred => this.mapToPredictionAnalytics(pred));
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(analytics), this.cacheTtl);
      
      return analytics;
    } catch (error) {
      this.logger.error(`Error getting prediction analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealTimeAnalytics(): Promise<{
    activePredictions: number;
    todayPredictions: number;
    todayProfit: number;
    todayROI: number;
    activeAgents: number;
    systemHealth: string;
    topPerformingAgent: any;
    recentPredictions: any[];
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // For now, return mock data since we don't have prediction data yet
      const mockTodayPredictions = [
        {
          id: 'pred-1',
          userId: 'system',
          matchId: 'match-1',
          prediction: 'home',
          actualResult: 'home',
          isCorrect: true,
          confidence: 0.85,
          odds: 2.1,
          stake: 100,
          return: 210,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team A', awayTeam: 'Team B', league: 'PL' },
          agent: { agentType: 'prediction' }
        }
      ];

      const activePredictions = 5; // Mock data
      const activeAgents = 3; // Mock data
      const todayMetrics = this.calculatePerformanceMetrics(mockTodayPredictions, '1d');

      // Get top performing agent (placeholder for now)
      const topPerformingAgent = {
        id: 'agent-1',
        name: 'Default Agent',
        agentType: 'prediction',
        isActive: true,
        performance: { accuracy: 75.5 }
      };

      // Get recent predictions (mock data)
      const recentPredictions = [
        {
          id: 'pred-1',
          userId: 'system',
          matchId: 'match-1',
          prediction: 'home',
          actualResult: 'home',
          isCorrect: true,
          confidence: 0.85,
          odds: 2.1,
          stake: 100,
          return: 210,
          createdAt: new Date(),
          isCompleted: true,
          match: { homeTeam: 'Team A', awayTeam: 'Team B', league: 'PL' },
          agent: { agentType: 'prediction' }
        }
      ];

      return {
        activePredictions,
        todayPredictions: mockTodayPredictions.length,
        todayProfit: todayMetrics.profit,
        todayROI: todayMetrics.roi,
        activeAgents,
        systemHealth: 'healthy', // This would be calculated based on various metrics
        topPerformingAgent,
        recentPredictions,
      };
    } catch (error) {
      this.logger.error(`Error getting real-time analytics: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods

  private getCutoffDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private calculatePerformanceMetrics(predictions: any[], period: string): PerformanceMetrics {
    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        totalStake: 0,
        totalReturn: 0,
        profit: 0,
        roi: 0,
        winRate: 0,
        averageOdds: 0,
        bestBet: { matchId: '', prediction: '', odds: 0, profit: 0, date: '' },
        worstBet: { matchId: '', prediction: '', odds: 0, loss: 0, date: '' },
        period,
        lastUpdated: new Date().toISOString(),
      };
    }

    const correctPredictions = predictions.filter(p => p.isCorrect).length;
    const totalStake = predictions.reduce((sum, p) => sum + (p.stake || 0), 0);
    const totalReturn = predictions.reduce((sum, p) => sum + (p.return || 0), 0);
    const profit = totalReturn - totalStake;
    const averageOdds = predictions.reduce((sum, p) => sum + (p.odds || 0), 0) / predictions.length;

    // Find best and worst bets
    const bestBet = predictions
      .filter(p => p.isCorrect)
      .sort((a, b) => (b.return || 0) - (a.return || 0))[0];

    const worstBet = predictions
      .filter(p => !p.isCorrect)
      .sort((a, b) => (a.stake || 0) - (b.stake || 0))[0];

    return {
      totalPredictions: predictions.length,
      correctPredictions,
      accuracy: (correctPredictions / predictions.length) * 100,
      totalStake,
      totalReturn,
      profit,
      roi: totalStake > 0 ? (profit / totalStake) * 100 : 0,
      winRate: (correctPredictions / predictions.length) * 100,
      averageOdds,
      bestBet: bestBet ? {
        matchId: bestBet.matchId,
        prediction: bestBet.prediction,
        odds: bestBet.odds,
        profit: bestBet.return - bestBet.stake,
        date: bestBet.createdAt.toISOString(),
      } : { matchId: '', prediction: '', odds: 0, profit: 0, date: '' },
      worstBet: worstBet ? {
        matchId: worstBet.matchId,
        prediction: worstBet.prediction,
        odds: worstBet.odds,
        loss: worstBet.stake,
        date: worstBet.createdAt.toISOString(),
      } : { matchId: '', prediction: '', odds: 0, loss: 0, date: '' },
      period,
      lastUpdated: new Date().toISOString(),
    };
  }

  private calculateROIAnalysis(predictions: any[], period: string): ROIAnalysis {
    if (predictions.length === 0) {
      return {
        period,
        totalBets: 0,
        totalStake: 0,
        totalReturn: 0,
        profit: 0,
        roi: 0,
        winRate: 0,
        averageOdds: 0,
        profitMargin: 0,
        riskAdjustedReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        bestStreak: 0,
        worstStreak: 0,
        monthlyBreakdown: [],
        leagueBreakdown: [],
        agentBreakdown: [],
      };
    }

    const totalBets = predictions.length;
    const totalStake = predictions.reduce((sum, p) => sum + (p.stake || 0), 0);
    const totalReturn = predictions.reduce((sum, p) => sum + (p.return || 0), 0);
    const profit = totalReturn - totalStake;
    const roi = totalStake > 0 ? (profit / totalStake) * 100 : 0;
    const winRate = (predictions.filter(p => p.isCorrect).length / totalBets) * 100;
    const averageOdds = predictions.reduce((sum, p) => sum + (p.odds || 0), 0) / totalBets;

    // Calculate streaks
    const streaks = this.calculateStreaks(predictions);
    
    // Calculate monthly breakdown
    const monthlyBreakdown = this.calculateMonthlyBreakdown(predictions);
    
    // Calculate league breakdown
    const leagueBreakdown = this.calculateLeagueBreakdown(predictions);
    
    // Calculate agent breakdown
    const agentBreakdown = this.calculateAgentBreakdown(predictions);

    return {
      period,
      totalBets,
      totalStake,
      totalReturn,
      profit,
      roi,
      winRate,
      averageOdds,
      profitMargin: totalStake > 0 ? (profit / totalStake) * 100 : 0,
      riskAdjustedReturn: this.calculateRiskAdjustedReturn(predictions),
      sharpeRatio: this.calculateSharpeRatio(predictions),
      maxDrawdown: this.calculateMaxDrawdown(predictions),
      consecutiveWins: streaks.consecutiveWins,
      consecutiveLosses: streaks.consecutiveLosses,
      bestStreak: streaks.bestStreak,
      worstStreak: streaks.worstStreak,
      monthlyBreakdown,
      leagueBreakdown,
      agentBreakdown,
    };
  }

  private calculateStreaks(predictions: any[]): {
    consecutiveWins: number;
    consecutiveLosses: number;
    bestStreak: number;
    worstStreak: number;
  } {
    let currentStreak = 0;
    let bestStreak = 0;
    let worstStreak = 0;
    let consecutiveWins = 0;
    let consecutiveLosses = 0;

    for (const prediction of predictions) {
      if (prediction.isCorrect) {
        if (currentStreak > 0) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        consecutiveWins = Math.max(consecutiveWins, currentStreak);
      } else {
        if (currentStreak < 0) {
          currentStreak--;
        } else {
          currentStreak = -1;
        }
        consecutiveLosses = Math.max(consecutiveLosses, Math.abs(currentStreak));
      }

      bestStreak = Math.max(bestStreak, currentStreak);
      worstStreak = Math.min(worstStreak, currentStreak);
    }

    return {
      consecutiveWins,
      consecutiveLosses,
      bestStreak,
      worstStreak: Math.abs(worstStreak),
    };
  }

  private calculateMonthlyBreakdown(predictions: any[]): Array<{
    month: string;
    bets: number;
    profit: number;
    roi: number;
  }> {
    const monthlyData = new Map<string, { bets: number; stake: number; return: number }>();

    for (const prediction of predictions) {
      const month = prediction.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || { bets: 0, stake: 0, return: 0 };
      
      existing.bets++;
      existing.stake += prediction.stake || 0;
      existing.return += prediction.return || 0;
      
      monthlyData.set(month, existing);
    }

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      bets: data.bets,
      profit: data.return - data.stake,
      roi: data.stake > 0 ? ((data.return - data.stake) / data.stake) * 100 : 0,
    }));
  }

  private calculateLeagueBreakdown(predictions: any[]): Array<{
    league: string;
    bets: number;
    profit: number;
    roi: number;
    accuracy: number;
  }> {
    const leagueData = new Map<string, { bets: number; correct: number; stake: number; return: number }>();

    for (const prediction of predictions) {
      const league = prediction.match?.league || 'Unknown';
      const existing = leagueData.get(league) || { bets: 0, correct: 0, stake: 0, return: 0 };
      
      existing.bets++;
      if (prediction.isCorrect) existing.correct++;
      existing.stake += prediction.stake || 0;
      existing.return += prediction.return || 0;
      
      leagueData.set(league, existing);
    }

    return Array.from(leagueData.entries()).map(([league, data]) => ({
      league,
      bets: data.bets,
      profit: data.return - data.stake,
      roi: data.stake > 0 ? ((data.return - data.stake) / data.stake) * 100 : 0,
      accuracy: (data.correct / data.bets) * 100,
    }));
  }

  private calculateAgentBreakdown(predictions: any[]): Array<{
    agentId: string;
    agentType: string;
    bets: number;
    profit: number;
    roi: number;
    accuracy: number;
  }> {
    const agentData = new Map<string, { bets: number; correct: number; stake: number; return: number; agentType: string }>();

    for (const prediction of predictions) {
      const agentId = prediction.agentId || 'manual';
      const agentType = prediction.agent?.agentType || 'manual';
      const existing = agentData.get(agentId) || { bets: 0, correct: 0, stake: 0, return: 0, agentType };
      
      existing.bets++;
      if (prediction.isCorrect) existing.correct++;
      existing.stake += prediction.stake || 0;
      existing.return += prediction.return || 0;
      
      agentData.set(agentId, existing);
    }

    return Array.from(agentData.entries()).map(([agentId, data]) => ({
      agentId,
      agentType: data.agentType,
      bets: data.bets,
      profit: data.return - data.stake,
      roi: data.stake > 0 ? ((data.return - data.stake) / data.stake) * 100 : 0,
      accuracy: (data.correct / data.bets) * 100,
    }));
  }

  private calculateRiskAdjustedReturn(predictions: any[]): number {
    if (predictions.length === 0) return 0;
    
    const returns = predictions.map(p => {
      const profit = (p.return || 0) - (p.stake || 0);
      return p.stake > 0 ? (profit / p.stake) * 100 : 0;
    });
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  private calculateSharpeRatio(predictions: any[]): number {
    if (predictions.length === 0) return 0;
    
    const returns = predictions.map(p => {
      const profit = (p.return || 0) - (p.stake || 0);
      return p.stake > 0 ? (profit / p.stake) * 100 : 0;
    });
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Assuming risk-free rate of 0% for simplicity
    return stdDev > 0 ? (avgReturn - 0) / stdDev : 0;
  }

  private calculateMaxDrawdown(predictions: any[]): number {
    if (predictions.length === 0) return 0;
    
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;
    
    for (const prediction of predictions) {
      const profit = (prediction.return || 0) - (prediction.stake || 0);
      runningTotal += profit;
      
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private async getModelPerformanceData(modelId?: string): Promise<ModelPerformance[]> {
    // This would integrate with the ML service to get actual model performance
    // For now, return placeholder data
    return [
      {
        modelId: 'model-1',
        modelName: 'ESPN Prediction Model',
        totalPredictions: 1000,
        correctPredictions: 750,
        accuracy: 75,
        precision: 0.78,
        recall: 0.72,
        f1Score: 0.75,
        averageConfidence: 0.82,
        profitGenerated: 2500,
        roi: 15.5,
        lastUpdated: new Date().toISOString(),
        performanceHistory: [
          { date: '2024-01-01', accuracy: 72, profit: 1200 },
          { date: '2024-01-15', accuracy: 75, profit: 2500 },
        ],
      },
    ];
  }

  private calculateAdvancedInsights(predictions: any[]): AdvancedInsights {
    // Calculate top performing leagues
    const leagueBreakdown = this.calculateLeagueBreakdown(predictions);
    const topPerformingLeagues = leagueBreakdown
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);

    // Calculate top performing agents
    const agentBreakdown = this.calculateAgentBreakdown(predictions);
    const topPerformingAgents = agentBreakdown
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);

    // Calculate betting patterns
    const bettingPatterns = this.calculateBettingPatterns(predictions);

    // Calculate market efficiency
    const marketEfficiency = this.calculateMarketEfficiency(predictions);

    // Calculate risk analysis
    const riskAnalysis = this.calculateRiskAnalysis(predictions);

    return {
      topPerformingLeagues,
      topPerformingAgents,
      bettingPatterns,
      marketEfficiency,
      riskAnalysis,
    };
  }

  private calculateBettingPatterns(predictions: any[]): any {
    // This would analyze betting patterns
    return {
      mostProfitableBetType: 'home',
      mostProfitableTimeOfDay: 'evening',
      mostProfitableDayOfWeek: 'saturday',
      averageStakeSize: predictions.reduce((sum, p) => sum + (p.stake || 0), 0) / predictions.length,
      optimalStakeSize: 50, // This would be calculated based on Kelly Criterion
    };
  }

  private calculateMarketEfficiency(predictions: any[]): any {
    // This would calculate market efficiency metrics
    return {
      overallEfficiency: 85,
      leagueEfficiency: [
        { league: 'PL', efficiency: 88 },
        { league: 'PD', efficiency: 82 },
      ],
      timeBasedEfficiency: [
        { timeSlot: 'morning', efficiency: 80 },
        { timeSlot: 'evening', efficiency: 90 },
      ],
    };
  }

  private calculateRiskAnalysis(predictions: any[]): any {
    // This would calculate risk metrics
    return {
      volatility: 12.5,
      maxDrawdown: this.calculateMaxDrawdown(predictions),
      var95: 8.5, // Value at Risk (95%)
      sharpeRatio: this.calculateSharpeRatio(predictions),
      sortinoRatio: 1.2,
      calmarRatio: 0.8,
    };
  }

  private mapToPredictionAnalytics(prediction: any): PredictionAnalytics {
    return {
      matchId: prediction.matchId,
      homeTeam: prediction.match?.homeTeam || 'Unknown',
      awayTeam: prediction.match?.awayTeam || 'Unknown',
      league: prediction.match?.league || 'Unknown',
      prediction: prediction.prediction,
      actualResult: prediction.actualResult || 'Unknown',
      isCorrect: prediction.isCorrect,
      confidence: prediction.confidence || 0,
      odds: prediction.odds || 0,
      stake: prediction.stake || 0,
      return: prediction.return || 0,
      profit: (prediction.return || 0) - (prediction.stake || 0),
      date: prediction.createdAt.toISOString(),
      agentId: prediction.agentId,
      agentType: prediction.agent?.agentType,
    };
  }
} 