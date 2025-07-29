import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemOverview() {
    const [
      totalUsers,
      totalMatches,
      totalPredictions,
      activeLeagues,
      totalTeams,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.prediction.count(),
      this.prisma.league.count({ where: { isActive: true } }),
      this.prisma.team.count(),
    ]);

    // Get recent activity
    const recentPredictions = await this.prisma.prediction.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const liveMatches = await this.prisma.match.count({
      where: { isLive: true },
    });

    return {
      overview: {
        totalUsers,
        totalMatches,
        totalPredictions,
        activeLeagues,
        totalTeams,
      },
      recentActivity: {
        predictionsLast24h: recentPredictions,
        liveMatches,
      },
    };
  }

  async getUserPerformance(userId: string, period: string = 'month') {
    const startDate = this.getStartDate(period);

    const predictions = await this.prisma.prediction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        isCorrect: { not: null },
      },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.isCorrect).length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Calculate streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (const prediction of predictions) {
      if (prediction.isCorrect) {
        tempStreak++;
        currentStreak = tempStreak;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
        currentStreak = 0;
      }
    }

    // Performance by league
    const leaguePerformance = await this.prisma.prediction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        isCorrect: { not: null },
      },
      include: {
        match: {
          include: {
            league: true,
          },
        },
      },
    });

    // Group by league manually
    const leagueStatsMap = new Map();
    for (const prediction of leaguePerformance) {
      const leagueId = prediction.match.leagueId;
      if (!leagueStatsMap.has(leagueId)) {
        leagueStatsMap.set(leagueId, { total: 0, correct: 0 });
      }
      const stats = leagueStatsMap.get(leagueId);
      stats.total++;
      if (prediction.isCorrect) {
        stats.correct++;
      }
    }

    const leagueStats = Array.from(leagueStatsMap.entries()).map(([leagueId, stats]) => ({
      leagueId,
      totalPredictions: stats.total,
      correctPredictions: stats.correct,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
    }));

    return {
      period,
      totalPredictions,
      correctPredictions,
      accuracy: Math.round(accuracy * 100) / 100,
      currentStreak,
      bestStreak,
      leaguePerformance: leagueStats,
      recentPredictions: predictions.slice(0, 10),
    };
  }

  async getLeagueStats(leagueId?: string) {
    const where = leagueId ? { leagueId } : {};

    const [matches, predictions, standings] = await Promise.all([
      this.prisma.match.findMany({
        where,
        include: {
          league: true,
          homeTeam: true,
          awayTeam: true,
        },
      }),
      this.prisma.prediction.findMany({
        where: {
          match: where,
          isCorrect: { not: null },
        },
      }),
      this.prisma.standing.findMany({
        where,
        include: {
          team: true,
        },
        orderBy: [
          { points: 'desc' },
          { goalDifference: 'desc' },
        ],
      }),
    ]);

    const totalMatches = matches.length;
    const finishedMatches = matches.filter(m => m.isFinished).length;
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.isCorrect).length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Most predicted teams
    const teamPredictions = await this.prisma.prediction.findMany({
      where: {
        match: where,
      },
      include: {
        match: true,
      },
    });

    // Group by team manually
    const teamStatsMap = new Map();
    for (const prediction of teamPredictions) {
      const teamId = prediction.match.homeTeamId; // Use home team for grouping
      if (!teamStatsMap.has(teamId)) {
        teamStatsMap.set(teamId, { count: 0 });
      }
      const stats = teamStatsMap.get(teamId);
      stats.count++;
    }

    const teamPredictionsStats = Array.from(teamStatsMap.entries()).map(([teamId, stats]) => ({
      teamId,
      count: stats.count,
    }));

    return {
      leagueId,
      matches: {
        total: totalMatches,
        finished: finishedMatches,
        live: matches.filter(m => m.isLive).length,
      },
      predictions: {
        total: totalPredictions,
        correct: correctPredictions,
        accuracy: Math.round(accuracy * 100) / 100,
      },
      standings: standings.slice(0, 10), // Top 10 teams
      teamPredictions: teamPredictionsStats.slice(0, 5), // Top 5 most predicted teams
    };
  }

  async getTeamStats(teamId?: string) {
    if (!teamId) {
      return { message: 'Team ID is required' };
    }

    const [matches, predictions] = await Promise.all([
      this.prisma.match.findMany({
        where: {
          OR: [
            { homeTeamId: teamId },
            { awayTeamId: teamId },
          ],
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      }),
      this.prisma.prediction.findMany({
        where: {
          match: {
            OR: [
              { homeTeamId: teamId },
              { awayTeamId: teamId },
            ],
          },
          isCorrect: { not: null },
        },
      }),
    ]);

    const homeMatches = matches.filter(m => m.homeTeamId === teamId);
    const awayMatches = matches.filter(m => m.awayTeamId === teamId);

    const homeWins = homeMatches.filter(m => m.homeScore > m.awayScore).length;
    const homeDraws = homeMatches.filter(m => m.homeScore === m.awayScore).length;
    const homeLosses = homeMatches.filter(m => m.homeScore < m.awayScore).length;

    const awayWins = awayMatches.filter(m => m.awayScore > m.homeScore).length;
    const awayDraws = awayMatches.filter(m => m.awayScore === m.homeScore).length;
    const awayLosses = awayMatches.filter(m => m.awayScore < m.homeScore).length;

    const totalWins = homeWins + awayWins;
    const totalDraws = homeDraws + awayDraws;
    const totalLosses = homeLosses + awayLosses;
    const totalMatches = totalWins + totalDraws + totalLosses;

    const winRate = totalMatches > 0 ? totalWins / totalMatches : 0;
    const drawRate = totalMatches > 0 ? totalDraws / totalMatches : 0;
    const lossRate = totalMatches > 0 ? totalLosses / totalMatches : 0;

    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.isCorrect).length;
    const predictionAccuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    return {
      teamId,
      matches: {
        total: totalMatches,
        wins: totalWins,
        draws: totalDraws,
        losses: totalLosses,
        winRate: Math.round(winRate * 100) / 100,
        drawRate: Math.round(drawRate * 100) / 100,
        lossRate: Math.round(lossRate * 100) / 100,
      },
      home: {
        matches: homeMatches.length,
        wins: homeWins,
        draws: homeDraws,
        losses: homeLosses,
      },
      away: {
        matches: awayMatches.length,
        wins: awayWins,
        draws: awayDraws,
        losses: awayLosses,
      },
      predictions: {
        total: totalPredictions,
        correct: correctPredictions,
        accuracy: Math.round(predictionAccuracy * 100) / 100,
      },
      recentMatches: matches.slice(0, 10),
    };
  }

  async getPredictionAccuracy(modelVersion?: string, period: string = 'month') {
    const startDate = this.getStartDate(period);
    const where: any = {
      createdAt: { gte: startDate },
      isCorrect: { not: null },
    };

    if (modelVersion) {
      where.modelVersion = modelVersion;
    }

    const predictions = await this.prisma.prediction.findMany({
      where,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
      },
    });

    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.isCorrect).length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Accuracy by prediction type
    const accuracyByType = await this.prisma.prediction.findMany({
      where,
    });

    // Group by type manually
    const typeStatsMap = new Map();
    for (const prediction of accuracyByType) {
      const type = prediction.predictionType;
      if (!typeStatsMap.has(type)) {
        typeStatsMap.set(type, { total: 0, correct: 0 });
      }
      const stats = typeStatsMap.get(type);
      stats.total++;
      if (prediction.isCorrect) {
        stats.correct++;
      }
    }

    const typeStats = Array.from(typeStatsMap.entries()).map(([type, stats]) => ({
      type,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
    }));

    // Accuracy by confidence level
    const confidenceRanges = [
      { min: 0, max: 0.3, label: 'Low (0-30%)' },
      { min: 0.3, max: 0.7, label: 'Medium (30-70%)' },
      { min: 0.7, max: 1, label: 'High (70-100%)' },
    ];

    const confidenceStats = confidenceRanges.map(range => {
      const rangePredictions = predictions.filter(
        p => p.confidence >= range.min && p.confidence < range.max
      );
      const correct = rangePredictions.filter(p => p.isCorrect).length;
      return {
        range: range.label,
        total: rangePredictions.length,
        correct,
        accuracy: rangePredictions.length > 0 ? correct / rangePredictions.length : 0,
      };
    });

    return {
      period,
      modelVersion,
      overall: {
        totalPredictions,
        correctPredictions,
        accuracy: Math.round(accuracy * 100) / 100,
      },
      byType: typeStats,
      byConfidence: confidenceStats,
    };
  }

  async getTrends(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const predictions = await this.prisma.prediction.findMany({
      where: {
        createdAt: { gte: startDate },
        isCorrect: { not: null },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyStats = new Map();
    
    for (const prediction of predictions) {
      const date = prediction.createdAt.toISOString().split('T')[0];
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { total: 0, correct: 0 });
      }
      const stats = dailyStats.get(date);
      stats.total++;
      if (prediction.isCorrect) {
        stats.correct++;
      }
    }

    const trends = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
    }));

    return {
      period: `${days} days`,
      trends,
    };
  }

  async getInsights(userId: string) {
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats || userStats.totalPredictions === 0) {
      return {
        insights: [
          'Start making predictions to get personalized insights!',
          'Try predicting matches from different leagues to improve your accuracy.',
        ],
      };
    }

    const insights = [];

    // Accuracy insights
    if (userStats.accuracy < 0.4) {
      insights.push('Your prediction accuracy is below average. Consider analyzing team form and head-to-head records more carefully.');
    } else if (userStats.accuracy > 0.7) {
      insights.push('Excellent prediction accuracy! You\'re performing better than most users.');
    }

    // Streak insights
    if (userStats.streak > 5) {
      insights.push(`Great job! You\'re on a ${userStats.streak}-prediction winning streak. Keep up the momentum!`);
    }

    if (userStats.bestStreak > 10) {
      insights.push(`Your best streak is ${userStats.bestStreak} predictions. Try to beat your record!`);
    }

    // Activity insights
    const lastPrediction = await this.prisma.prediction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastPrediction) {
      const daysSinceLastPrediction = Math.floor(
        (Date.now() - lastPrediction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastPrediction > 7) {
        insights.push('You haven\'t made any predictions recently. Stay active to maintain your ranking!');
      }
    }

    // League performance insights
    const leaguePerformance = await this.prisma.prediction.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            league: true,
          },
        },
      },
    });

    // Group by league manually
    const leagueStatsMap = new Map();
    for (const prediction of leaguePerformance) {
      const leagueId = prediction.match.leagueId;
      if (!leagueStatsMap.has(leagueId)) {
        leagueStatsMap.set(leagueId, { total: 0, correct: 0 });
      }
      const stats = leagueStatsMap.get(leagueId);
      stats.total++;
      if (prediction.isCorrect) {
        stats.correct++;
      }
    }

    const bestLeague = Array.from(leagueStatsMap.entries())
      .filter(([leagueId, stats]) => stats.total >= 5) // At least 5 predictions
      .sort((a, b) => {
        const aAccuracy = a[1].total > 0 ? a[1].correct / a[1].total : 0;
        const bAccuracy = b[1].total > 0 ? b[1].correct / b[1].total : 0;
        return bAccuracy - aAccuracy;
      })[0];

    if (bestLeague) {
      const accuracy = bestLeague[1].total > 0 ? 
        bestLeague[1].correct / bestLeague[1].total : 0;
      insights.push(`You perform best in ${bestLeague[0]} with ${Math.round(accuracy * 100)}% accuracy.`);
    }

    return {
      insights: insights.length > 0 ? insights : [
        'Keep making predictions to get more personalized insights!',
        'Try different prediction types to improve your overall accuracy.',
      ],
    };
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Enhanced Analytics Methods
  async getModelPerformanceAnalytics(modelVersion?: string) {
    const where: any = {};
    if (modelVersion) {
      where.modelVersion = modelVersion;
    }

    const predictions = await this.prisma.prediction.findMany({
      where: {
        ...where,
        isCorrect: { not: null },
      },
      select: {
        modelVersion: true,
        confidence: true,
        isCorrect: true,
        predictionType: true,
        createdAt: true,
      },
    });

    const modelStats = new Map();

    predictions.forEach(prediction => {
      if (!modelStats.has(prediction.modelVersion)) {
        modelStats.set(prediction.modelVersion, {
          total: 0,
          correct: 0,
          confidenceSum: 0,
          byType: new Map(),
        });
      }

      const stats = modelStats.get(prediction.modelVersion);
      stats.total++;
      stats.confidenceSum += prediction.confidence;

      if (prediction.isCorrect) {
        stats.correct++;
      }

      if (!stats.byType.has(prediction.predictionType)) {
        stats.byType.set(prediction.predictionType, { total: 0, correct: 0 });
      }

      const typeStats = stats.byType.get(prediction.predictionType);
      typeStats.total++;
      if (prediction.isCorrect) {
        typeStats.correct++;
      }
    });

    const results = [];
    for (const [version, stats] of modelStats) {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const avgConfidence = stats.total > 0 ? stats.confidenceSum / stats.total : 0;

      const byType = {};
      for (const [type, typeStats] of stats.byType) {
        byType[type] = {
          total: typeStats.total,
          correct: typeStats.correct,
          accuracy: typeStats.total > 0 ? (typeStats.correct / typeStats.total) * 100 : 0,
        };
      }

      results.push({
        modelVersion: version,
        totalPredictions: stats.total,
        correctPredictions: stats.correct,
        accuracy: Math.round(accuracy * 100) / 100,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        byType,
      });
    }

    return results;
  }

  async getSystemPerformanceMetrics() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      predictions24h,
      predictions7d,
      users24h,
      users7d,
      matches24h,
      matches7d,
    ] = await Promise.all([
      this.prisma.prediction.count({
        where: { createdAt: { gte: last24h } },
      }),
      this.prisma.prediction.count({
        where: { createdAt: { gte: last7d } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: last24h } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: last7d } },
      }),
      this.prisma.match.count({
        where: { createdAt: { gte: last24h } },
      }),
      this.prisma.match.count({
        where: { createdAt: { gte: last7d } },
      }),
    ]);

    // Calculate prediction accuracy trends
    const accuracy24h = await this.getPredictionAccuracyForPeriod(last24h);
    const accuracy7d = await this.getPredictionAccuracyForPeriod(last7d);

    return {
      last24h: {
        predictions: predictions24h,
        newUsers: users24h,
        newMatches: matches24h,
        predictionAccuracy: accuracy24h,
      },
      last7d: {
        predictions: predictions7d,
        newUsers: users7d,
        newMatches: matches7d,
        predictionAccuracy: accuracy7d,
      },
      trends: {
        predictionGrowth: this.calculateGrowthRate(predictions7d, predictions24h),
        userGrowth: this.calculateGrowthRate(users7d, users24h),
        matchGrowth: this.calculateGrowthRate(matches7d, matches24h),
      },
    };
  }

  private async getPredictionAccuracyForPeriod(startDate: Date) {
    const predictions = await this.prisma.prediction.findMany({
      where: {
        createdAt: { gte: startDate },
        isCorrect: { not: null },
      },
      select: { isCorrect: true },
    });

    const total = predictions.length;
    const correct = predictions.filter(p => p.isCorrect).length;
    return total > 0 ? (correct / total) * 100 : 0;
  }

  private calculateGrowthRate(period1: number, period2: number): number {
    if (period1 === 0) return period2 > 0 ? 100 : 0;
    return ((period2 - period1) / period1) * 100;
  }

  async getUserEngagementMetrics() {
    const now = new Date();
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get active users (users who made predictions in last 30 days)
    const activeUsers = await this.prisma.prediction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: last30d },
      },
      _count: {
        id: true,
      },
    });

    const totalUsers = await this.prisma.user.count();
    const activeUserCount = activeUsers.length;
    const engagementRate = totalUsers > 0 ? (activeUserCount / totalUsers) * 100 : 0;

    // Get user activity distribution
    const activityDistribution = await this.prisma.prediction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: last30d },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const topUsers = activityDistribution.slice(0, 10).map(user => ({
      userId: user.userId,
      predictionCount: user._count.id,
    }));

    return {
      totalUsers,
      activeUsers: activeUserCount,
      engagementRate: Math.round(engagementRate * 100) / 100,
      topUsers,
      activityDistribution: {
        high: activityDistribution.filter(u => u._count.id >= 20).length,
        medium: activityDistribution.filter(u => u._count.id >= 5 && u._count.id < 20).length,
        low: activityDistribution.filter(u => u._count.id < 5).length,
      },
    };
  }

  async getLeaguePerformanceAnalytics() {
    const leagues = await this.prisma.league.findMany({
      include: {
        matches: {
          include: {
            predictions: {
              where: {
                isCorrect: { not: null },
              },
            },
          },
        },
      },
    });

    return leagues.map(league => {
      const totalMatches = league.matches.length;
      const totalPredictions = league.matches.reduce(
        (sum, match) => sum + match.predictions.length,
        0
      );

      const correctPredictions = league.matches.reduce(
        (sum, match) => sum + match.predictions.filter(p => p.isCorrect).length,
        0
      );

      const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

      return {
        leagueId: league.id,
        leagueName: league.name,
        totalMatches,
        totalPredictions,
        correctPredictions,
        accuracy: Math.round(accuracy * 100) / 100,
        averagePredictionsPerMatch: totalMatches > 0 ? totalPredictions / totalMatches : 0,
      };
    });
  }

  async getPredictionTrends(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const predictions = await this.prisma.prediction.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        isCorrect: true,
        predictionType: true,
        confidence: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyStats = new Map();
    
    predictions.forEach(prediction => {
      const date = prediction.createdAt.toISOString().split('T')[0];
      
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          total: 0,
          correct: 0,
          byType: new Map(),
          avgConfidence: 0,
          confidenceSum: 0,
        });
      }

      const stats = dailyStats.get(date);
      stats.total++;
      stats.confidenceSum += prediction.confidence;

      if (prediction.isCorrect) {
        stats.correct++;
      }

      if (!stats.byType.has(prediction.predictionType)) {
        stats.byType.set(prediction.predictionType, { total: 0, correct: 0 });
      }

      const typeStats = stats.byType.get(prediction.predictionType);
      typeStats.total++;
      if (prediction.isCorrect) {
        typeStats.correct++;
      }
    });

    const trends = [];
    for (const [date, stats] of dailyStats) {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const avgConfidence = stats.total > 0 ? stats.confidenceSum / stats.total : 0;

      const byType = {};
      for (const [type, typeStats] of stats.byType) {
        byType[type] = {
          total: typeStats.total,
          correct: typeStats.correct,
          accuracy: typeStats.total > 0 ? (typeStats.correct / typeStats.total) * 100 : 0,
        };
      }

      trends.push({
        date,
        totalPredictions: stats.total,
        correctPredictions: stats.correct,
        accuracy: Math.round(accuracy * 100) / 100,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        byType,
      });
    }

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }
} 