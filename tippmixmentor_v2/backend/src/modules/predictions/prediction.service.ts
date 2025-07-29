import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { PredictionResponseDto } from './dto/prediction-response.dto';
import axios from 'axios';

@Injectable()
export class PredictionsService {
  private readonly mlServiceUrl: string;
  private readonly cacheTtl = 3600; // 1 hour cache for predictions

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.mlServiceUrl = this.configService.get('ML_SERVICE_URL', 'http://localhost:8000');
  }

  async createPrediction(createPredictionDto: CreatePredictionDto, userId?: string) {
    try {
      // Validate input
      await this.validatePredictionInput(createPredictionDto);

      // Check cache first
      const cacheKey = `prediction:${createPredictionDto.matchId}:${createPredictionDto.predictionType}`;
      const cachedPrediction = await this.redisService.get(cacheKey);
      
      if (cachedPrediction) {
        const parsed = JSON.parse(cachedPrediction);
        return this.createPredictionFromCache(parsed, userId);
      }

      // Get match data for ML prediction
      const match = await this.prisma.match.findUnique({
        where: { id: createPredictionDto.matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      });

      if (!match) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
      }

      // Prepare enhanced match data for ML service
      const matchData = await this.prepareMatchDataForML(match);

      // Get ML prediction with retry logic
      const predictionResult = await this.getMLPredictionWithRetry(matchData);

      // Cache the prediction result
      await this.redisService.set(cacheKey, JSON.stringify(predictionResult), this.cacheTtl);

      // Create prediction record
      const prediction = await this.prisma.prediction.create({
        data: {
          userId: userId || 'system',
          matchId: createPredictionDto.matchId,
          modelVersion: predictionResult.model_info.version,
          homeWinProb: predictionResult.match_result.probabilities.home_win,
          drawProb: predictionResult.match_result.probabilities.draw,
          awayWinProb: predictionResult.match_result.probabilities.away_win,
          predictedScore: this.generatePredictedScore(predictionResult),
          confidence: predictionResult.confidence.match_result,
          features: predictionResult.model_info,
          predictionType: createPredictionDto.predictionType as any || 'MATCH_RESULT',
        },
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Return enhanced response
      const response: any = {
        id: prediction.id,
        matchId: prediction.matchId,
        userId: prediction.userId,
        modelVersion: prediction.modelVersion,
        homeWinProb: prediction.homeWinProb,
        drawProb: prediction.drawProb,
        awayWinProb: prediction.awayWinProb,
        predictedScore: prediction.predictedScore,
        confidence: prediction.confidence,
        predictionType: prediction.predictionType,
        isCorrect: prediction.isCorrect,
        createdAt: prediction.createdAt,
        updatedAt: prediction.updatedAt,
        match: prediction.match,
        user: prediction.user,
        insight: predictionResult.insight || null,
        bettingRecommendations: predictionResult.betting_recommendations || null,
        overUnderPrediction: predictionResult.over_under_prediction || null,
        bothTeamsScorePrediction: predictionResult.both_teams_score_prediction || null,
      };

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create prediction: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    
    return this.prisma.prediction.findMany({
      where,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!prediction) {
      throw new HttpException('Prediction not found', HttpStatus.NOT_FOUND);
    }

    return prediction;
  }

  async getMatchPredictions(matchId: string) {
    return this.prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserPredictions(userId: string) {
    return this.prisma.prediction.findMany({
      where: { userId },
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
  }

  async getPredictionStats(userId?: string) {
    const where = userId ? { userId } : {};
    
    const predictions = await this.prisma.prediction.findMany({
      where,
      select: {
        isCorrect: true,
        confidence: true,
        predictionType: true,
        createdAt: true,
      },
    });

    const total = predictions.length;
    const correct = predictions.filter(p => p.isCorrect === true).length;
    const incorrect = predictions.filter(p => p.isCorrect === false).length;
    const pending = predictions.filter(p => p.isCorrect === null).length;

    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgConfidence = predictions.length > 0 
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
      : 0;

    return {
      total,
      correct,
      incorrect,
      pending,
      accuracy: Math.round(accuracy * 100) / 100,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      byType: this.groupByType(predictions),
      byMonth: this.groupByMonth(predictions),
    };
  }

  async updatePredictionResult(predictionId: string, isCorrect: boolean) {
    return this.prisma.prediction.update({
      where: { id: predictionId },
      data: { isCorrect },
    });
  }

  async batchUpdateResults() {
    // Get all predictions for finished matches that haven't been evaluated
    const pendingPredictions = await this.prisma.prediction.findMany({
      where: {
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

    for (const prediction of pendingPredictions) {
      const match = prediction.match;
      
      if (!match.homeScore || !match.awayScore) {
        continue; // Skip if match doesn't have final scores
      }

      let isCorrect = false;

      // Determine if prediction was correct based on prediction type
      switch (prediction.predictionType) {
        case 'MATCH_RESULT':
          const predictedWinner = this.getPredictedWinner(prediction);
          const actualWinner = this.getActualWinner(match.homeScore, match.awayScore);
          isCorrect = predictedWinner === actualWinner;
          break;
        
        case 'OVER_UNDER':
          const totalGoals = match.homeScore + match.awayScore;
          const predictedOver = prediction.homeWinProb > 0.5; // Simplified logic
          const actualOver = totalGoals > 2.5; // Assuming 2.5 as threshold
          isCorrect = predictedOver === actualOver;
          break;
        
        case 'BOTH_TEAMS_SCORE':
          const predictedBothScore = prediction.homeWinProb > 0.5; // Simplified logic
          const actualBothScore = match.homeScore > 0 && match.awayScore > 0;
          isCorrect = predictedBothScore === actualBothScore;
          break;
        
        default:
          // For other prediction types, use a simple comparison
          isCorrect = prediction.confidence > 0.7; // High confidence predictions
      }

      // Update prediction result
      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: { isCorrect },
      });

      updatedCount++;
    }

    return { updatedCount, total: pendingPredictions.length };
  }

  private getPredictedWinner(prediction: any): 'home' | 'away' | 'draw' {
    const { homeWinProb, drawProb, awayWinProb } = prediction;
    
    if (homeWinProb > drawProb && homeWinProb > awayWinProb) {
      return 'home';
    } else if (awayWinProb > drawProb && awayWinProb > homeWinProb) {
      return 'away';
    } else {
      return 'draw';
    }
  }

  private getActualWinner(homeScore: number, awayScore: number): 'home' | 'away' | 'draw' {
    if (homeScore > awayScore) {
      return 'home';
    } else if (awayScore > homeScore) {
      return 'away';
    } else {
      return 'draw';
    }
  }

  private groupByType(predictions: any[]) {
    const grouped = {};
    predictions.forEach(p => {
      const type = p.predictionType;
      if (!grouped[type]) {
        grouped[type] = { total: 0, correct: 0, accuracy: 0 };
      }
      grouped[type].total++;
      if (p.isCorrect === true) {
        grouped[type].correct++;
      }
    });

    // Calculate accuracy for each type
    Object.keys(grouped).forEach(type => {
      const { total, correct } = grouped[type];
      grouped[type].accuracy = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;
    });

    return grouped;
  }

  private groupByMonth(predictions: any[]) {
    const grouped = {};
    predictions.forEach(p => {
      const month = p.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      if (!grouped[month]) {
        grouped[month] = { total: 0, correct: 0, accuracy: 0 };
      }
      grouped[month].total++;
      if (p.isCorrect === true) {
        grouped[month].correct++;
      }
    });

    // Calculate accuracy for each month
    Object.keys(grouped).forEach(month => {
      const { total, correct } = grouped[month];
      grouped[month].accuracy = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;
    });

    return grouped;
  }

  private async validatePredictionInput(dto: CreatePredictionDto) {
    if (!dto.matchId) {
      throw new HttpException('Match ID is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!dto.predictionType) {
      throw new HttpException('Prediction type is required', HttpStatus.BAD_REQUEST);
    }

    // Check if prediction already exists for this user and match
    const existingPrediction = await this.prisma.prediction.findFirst({
      where: {
        matchId: dto.matchId,
        userId: dto.userId,
        predictionType: dto.predictionType as any,
      },
    });

    if (existingPrediction) {
      throw new HttpException(
        'Prediction already exists for this match and user',
        HttpStatus.CONFLICT,
      );
    }
  }

  private async prepareMatchDataForML(match: any) {
    // Get team form and statistics
    const homeTeamStats = await this.getTeamStats(match.homeTeamId, 5); // Last 5 matches
    const awayTeamStats = await this.getTeamStats(match.awayTeamId, 5);

    return {
      match_id: match.id,
      home_team: match.homeTeam.name,
      away_team: match.awayTeam.name,
      league: match.league.name,
      match_date: match.matchDate.toISOString(),
      home_team_form: homeTeamStats.form,
      away_team_form: awayTeamStats.form,
      home_team_goals_scored: homeTeamStats.goalsScored,
      home_team_goals_conceded: homeTeamStats.goalsConceded,
      away_team_goals_scored: awayTeamStats.goalsScored,
      away_team_goals_conceded: awayTeamStats.goalsConceded,
      home_team_position: homeTeamStats.position || 0,
      away_team_position: awayTeamStats.position || 0,
      home_team_points: homeTeamStats.points || 0,
      away_team_points: awayTeamStats.points || 0,
    };
  }

  private async getTeamStats(teamId: string, matchesCount: number) {
    // Get recent matches for the team
    const recentMatches = await this.prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: teamId },
          { awayTeamId: teamId },
        ],
        isFinished: true,
      },
      orderBy: { matchDate: 'desc' },
      take: matchesCount,
    });

    let goalsScored = 0;
    let goalsConceded = 0;
    const form = [];

    for (const match of recentMatches) {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      goalsScored += teamScore || 0;
      goalsConceded += opponentScore || 0;

      // Determine result (W/D/L)
      if (teamScore > opponentScore) {
        form.push('W');
      } else if (teamScore === opponentScore) {
        form.push('D');
      } else {
        form.push('L');
      }
    }

    return {
      form,
      goalsScored,
      goalsConceded,
      position: 0, // Will be implemented when league table is available
      points: 0, // Will be implemented when league table is available
    };
  }

  private async getMLPredictionWithRetry(matchData: any, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.mlServiceUrl}/predictions/predict`,
          matchData,
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        return response.data;
      } catch (error) {
        if (attempt === maxRetries) {
          throw new HttpException(
            `ML service error after ${maxRetries} attempts: ${error.response?.data?.detail || error.message}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private async createPredictionFromCache(cachedResult: any, userId?: string) {
    // Create prediction from cached ML result
    const prediction = await this.prisma.prediction.create({
      data: {
        userId: userId || 'system',
        matchId: cachedResult.match_id,
        modelVersion: cachedResult.model_info.version,
        homeWinProb: cachedResult.match_result.probabilities.home_win,
        drawProb: cachedResult.match_result.probabilities.draw,
        awayWinProb: cachedResult.match_result.probabilities.away_win,
        predictedScore: this.generatePredictedScore(cachedResult),
        confidence: cachedResult.confidence.match_result,
        features: cachedResult.model_info,
        predictionType: 'MATCH_RESULT',
      },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      id: prediction.id,
      matchId: prediction.matchId,
      userId: prediction.userId,
      modelVersion: prediction.modelVersion,
      homeWinProb: prediction.homeWinProb,
      drawProb: prediction.drawProb,
      awayWinProb: prediction.awayWinProb,
      predictedScore: prediction.predictedScore,
      confidence: prediction.confidence,
      predictionType: prediction.predictionType,
      isCorrect: prediction.isCorrect,
      createdAt: prediction.createdAt,
      updatedAt: prediction.updatedAt,
      match: prediction.match,
      user: prediction.user,
      insight: (cachedResult as any).insight || null,
      bettingRecommendations: (cachedResult as any).betting_recommendations || null,
      overUnderPrediction: (cachedResult as any).over_under_prediction || null,
      bothTeamsScorePrediction: (cachedResult as any).both_teams_score_prediction || null,
      fromCache: true,
    };
  }

  private generatePredictedScore(predictionResult: any): string {
    // Extract predicted score from ML result
    const homeGoals = Math.round(predictionResult.match_result.predicted_score.home || 0);
    const awayGoals = Math.round(predictionResult.match_result.predicted_score.away || 0);
    return `${homeGoals}-${awayGoals}`;
  }

  async getMLServiceStatus() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/health`, {
        timeout: 5000
      });
      return {
        status: 'healthy',
        response: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async trainModels() {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/models/train`,
        {},
        { timeout: 300000 } // 5 minutes timeout for training
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Model training failed: ${error.response?.data?.detail || error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getModelInfo() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/predictions/models/info`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to get model info: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getModelStatus() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/predictions/models/status`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to get model status: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async batchPredict(matchIds: string[]) {
    try {
      const matches = await this.prisma.match.findMany({
        where: { id: { in: matchIds } },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      });

      const matchDataArray = await Promise.all(
        matches.map(match => this.prepareMatchDataForML(match))
      );

      const response = await axios.post(
        `${this.mlServiceUrl}/predictions/batch-predict`,
        { matches: matchDataArray },
        { timeout: 60000 }
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to perform batch prediction: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getPredictionAccuracy() {
    const predictions = await this.prisma.prediction.findMany({
      where: {
        isCorrect: { not: null },
      },
      select: {
        isCorrect: true,
        predictionType: true,
        confidence: true,
      },
    });

    const total = predictions.length;
    const correct = predictions.filter(p => p.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    const byType = this.groupByType(predictions);
    const byConfidence = this.groupByConfidence(predictions);

    return {
      overall: {
        total,
        correct,
        accuracy: Math.round(accuracy * 100) / 100,
      },
      byType,
      byConfidence,
    };
  }

  private groupByConfidence(predictions: any[]) {
    const confidenceRanges = [
      { min: 0.8, max: 1.0, label: 'High (80-100%)' },
      { min: 0.6, max: 0.79, label: 'Medium (60-79%)' },
      { min: 0.4, max: 0.59, label: 'Low (40-59%)' },
      { min: 0, max: 0.39, label: 'Very Low (0-39%)' },
    ];

    return confidenceRanges.map(range => {
      const filtered = predictions.filter(p => 
        p.confidence >= range.min && p.confidence < range.max
      );
      const total = filtered.length;
      const correct = filtered.filter(p => p.isCorrect).length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;

      return {
        range: range.label,
        total,
        correct,
        accuracy: Math.round(accuracy * 100) / 100,
      };
    });
  }

  async createBatch(userId: string, createPredictionDtos: CreatePredictionDto[]) {
    const predictions = [];
    
    for (const dto of createPredictionDtos) {
      try {
        const prediction = await this.createPrediction(dto, userId);
        predictions.push(prediction);
      } catch (error) {
        // Log error but continue with other predictions
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
      },
    });

    if (!match) {
      throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
    }

    const matchData = await this.prepareMatchDataForML(match);
    const predictionResult = await this.getMLPredictionWithRetry(matchData);

    return {
      match,
      analysis: {
        prediction: predictionResult,
        insights: predictionResult.insight || null,
        bettingRecommendations: predictionResult.betting_recommendations || null,
        confidence: predictionResult.confidence,
        modelVersion: predictionResult.model_info.version,
      },
    };
  }

  async getRecentPredictions(limit: number = 10) {
    return this.prisma.prediction.findMany({
      take: limit,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserStats(userId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: { userId },
      select: {
        isCorrect: true,
        predictionType: true,
        confidence: true,
        createdAt: true,
      },
    });

    const total = predictions.length;
    const correct = predictions.filter(p => p.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    const byType = this.groupByType(predictions);
    const byMonth = this.groupByMonth(predictions);

    return {
      overall: {
        total,
        correct,
        accuracy: Math.round(accuracy * 100) / 100,
      },
      byType,
      byMonth,
    };
  }

  async getLeaderboard(limit: number = 10) {
    const users = await this.prisma.user.findMany({
      include: {
        predictions: {
          where: {
            isCorrect: { not: null },
          },
          select: {
            isCorrect: true,
          },
        },
      },
    });

    const leaderboard = users
      .map(user => {
        const total = user.predictions.length;
        const correct = user.predictions.filter(p => p.isCorrect).length;
        const accuracy = total > 0 ? (correct / total) * 100 : 0;

        return {
          userId: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          totalPredictions: total,
          correctPredictions: correct,
          accuracy: Math.round(accuracy * 100) / 100,
        };
      })
      .filter(user => user.totalPredictions > 0)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit);

    return leaderboard;
  }

  async updateResults(userId: string) {
    // This method would typically be called by a scheduled job
    // to update prediction results when matches are finished
    const pendingPredictions = await this.prisma.prediction.findMany({
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

    const updatedPredictions = [];

    for (const prediction of pendingPredictions) {
      const isCorrect = this.checkPredictionAccuracy(prediction);
      
      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: { isCorrect },
      });

      updatedPredictions.push({
        id: prediction.id,
        isCorrect,
      });
    }

    return {
      updated: updatedPredictions.length,
      predictions: updatedPredictions,
    };
  }

  private checkPredictionAccuracy(prediction: any): boolean {
    const match = prediction.match;
    const predictedWinner = this.getPredictedWinner(prediction);
    const actualWinner = this.getActualWinner(match.homeScore, match.awayScore);
    
    return predictedWinner === actualWinner;
  }
} 