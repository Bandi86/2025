import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';

@Injectable()
export class PredictionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPredictions(userId: string, params: {
    page?: number;
    limit?: number;
    matchId?: string;
  }) {
    const { page = 1, limit = 10, matchId } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (matchId) {
      where.matchId = matchId;
    }

    const [predictions, total] = await Promise.all([
      this.prisma.prediction.findMany({
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prediction.count({ where }),
    ]);

    return {
      data: predictions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMatchPredictions(matchId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return predictions;
  }

  async getUserStats(userId: string) {
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats) {
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        streak: 0,
        bestStreak: 0,
        totalPoints: 0,
        rank: null,
      };
    }

    return userStats;
  }

  async getLeaderboard(limit: number = 10) {
    const leaderboard = await this.prisma.userStats.findMany({
      where: {
        totalPredictions: {
          gt: 0,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { accuracy: 'desc' },
        { totalPredictions: 'desc' },
      ],
      take: limit,
    });

    return leaderboard.map((stat, index) => ({
      ...stat,
      rank: index + 1,
    }));
  }

  async create(userId: string, createPredictionDto: CreatePredictionDto) {
    // Check if match exists
    const match = await this.prisma.match.findUnique({
      where: { id: createPredictionDto.matchId },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${createPredictionDto.matchId} not found`);
    }

    // Check if match hasn't started yet
    if (match.matchDate <= new Date()) {
      throw new BadRequestException('Cannot create prediction for a match that has already started');
    }

    // Check if user already has a prediction for this match
    const existingPrediction = await this.prisma.prediction.findFirst({
      where: {
        userId,
        matchId: createPredictionDto.matchId,
      },
    });

    if (existingPrediction) {
      throw new BadRequestException('User already has a prediction for this match');
    }

    // Validate probabilities sum to 1
    const totalProb = createPredictionDto.homeWinProb + createPredictionDto.drawProb + createPredictionDto.awayWinProb;
    if (Math.abs(totalProb - 1) > 0.01) {
      throw new BadRequestException('Probabilities must sum to 1');
    }

    const prediction = await this.prisma.prediction.create({
      data: {
        modelVersion: createPredictionDto.modelVersion,
        homeWinProb: createPredictionDto.homeWinProb,
        drawProb: createPredictionDto.drawProb,
        awayWinProb: createPredictionDto.awayWinProb,
        predictedScore: createPredictionDto.predictedScore,
        confidence: createPredictionDto.confidence,
        features: createPredictionDto.features,
        predictionType: (createPredictionDto.predictionType || 'MATCH_RESULT') as any,
        match: { connect: { id: createPredictionDto.matchId } },
        user: { connect: { id: userId } },
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
    });

    // Update user stats
    await this.updateUserStats(userId);

    return prediction;
  }

  async createBatch(userId: string, createPredictionDtos: CreatePredictionDto[]) {
    const predictions = [];

    for (const dto of createPredictionDtos) {
      try {
        const prediction = await this.create(userId, dto);
        predictions.push(prediction);
      } catch (error) {
        // Continue with other predictions even if one fails
        console.error(`Failed to create prediction for match ${dto.matchId}:`, error.message);
      }
    }

    return predictions;
  }

  async analyzeMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        matchStats: true,
        predictions: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    // Calculate average predictions
    const predictions = match.predictions;
    if (predictions.length === 0) {
      return {
        match,
        analysis: {
          totalPredictions: 0,
          averageHomeWinProb: 0,
          averageDrawProb: 0,
          averageAwayWinProb: 0,
          mostPredictedResult: 'No predictions',
        },
      };
    }

    const avgHomeWinProb = predictions.reduce((sum, p) => sum + p.homeWinProb, 0) / predictions.length;
    const avgDrawProb = predictions.reduce((sum, p) => sum + p.drawProb, 0) / predictions.length;
    const avgAwayWinProb = predictions.reduce((sum, p) => sum + p.awayWinProb, 0) / predictions.length;

    const mostPredictedResult = [avgHomeWinProb, avgDrawProb, avgAwayWinProb].indexOf(
      Math.max(avgHomeWinProb, avgDrawProb, avgAwayWinProb)
    ) === 0 ? 'Home Win' : 
    [avgHomeWinProb, avgDrawProb, avgAwayWinProb].indexOf(
      Math.max(avgHomeWinProb, avgDrawProb, avgAwayWinProb)
    ) === 1 ? 'Draw' : 'Away Win';

    return {
      match,
      analysis: {
        totalPredictions: predictions.length,
        averageHomeWinProb: avgHomeWinProb,
        averageDrawProb: avgDrawProb,
        averageAwayWinProb: avgAwayWinProb,
        mostPredictedResult,
        predictions: predictions.slice(0, 10), // Top 10 predictions
      },
    };
  }

  async updateResults(userId: string) {
    // Get user's predictions for finished matches that haven't been evaluated
    const predictions = await this.prisma.prediction.findMany({
      where: {
        userId,
        isCorrect: null,
        match: {
          isFinished: true,
        },
      },
      include: {
        match: true,
      },
    });

    let updatedCount = 0;

    for (const prediction of predictions) {
      const match = prediction.match;
      let isCorrect = false;

      if (match.homeScore !== null && match.awayScore !== null) {
        const actualResult = match.homeScore > match.awayScore ? 'HOME_WIN' :
                           match.homeScore < match.awayScore ? 'AWAY_WIN' : 'DRAW';

        const predictedResult = prediction.homeWinProb > prediction.drawProb && 
                               prediction.homeWinProb > prediction.awayWinProb ? 'HOME_WIN' :
                               prediction.awayWinProb > prediction.drawProb && 
                               prediction.awayWinProb > prediction.homeWinProb ? 'AWAY_WIN' : 'DRAW';

        isCorrect = actualResult === predictedResult;
      }

      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: { isCorrect },
      });

      updatedCount++;
    }

    // Update user stats
    if (updatedCount > 0) {
      await this.updateUserStats(userId);
    }

    return {
      message: `Updated ${updatedCount} prediction results`,
      updatedCount,
    };
  }

  private async updateUserStats(userId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: {
        userId,
        isCorrect: {
          not: null,
        },
      },
    });

    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.isCorrect).length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Calculate streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (const prediction of predictions.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )) {
      if (prediction.isCorrect) {
        tempStreak++;
        currentStreak = tempStreak;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
        currentStreak = 0;
      }
    }

    // Calculate points (simple scoring system)
    const totalPoints = correctPredictions * 10;

    // Upsert user stats
    await this.prisma.userStats.upsert({
      where: { userId },
      update: {
        totalPredictions,
        correctPredictions,
        accuracy,
        streak: currentStreak,
        bestStreak,
        totalPoints,
        lastPredictionDate: predictions.length > 0 ? 
          predictions[predictions.length - 1].createdAt : null,
      },
      create: {
        userId,
        totalPredictions,
        correctPredictions,
        accuracy,
        streak: currentStreak,
        bestStreak,
        totalPoints,
        lastPredictionDate: predictions.length > 0 ? 
          predictions[predictions.length - 1].createdAt : null,
      },
    });
  }
} 