import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class PredictionsService {
  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getMLServiceStatus() {
    try {
      const response = await this.httpService.get(
        `${process.env.ML_SERVICE_URL}/health`
      ).toPromise();
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }

  async getPrediction(matchId: string) {
    const cacheKey = `prediction:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/predict`,
        { match_id: matchId }
      ).toPromise();

      const prediction = response.data;
      await this.redis.set(cacheKey, JSON.stringify(prediction), 3600); // 1 hour
      
      return prediction;
    } catch (error) {
      throw new ServiceUnavailableException('ML service unavailable');
    }
  }

  async getBatchPredictions(matchIds: string[]) {
    const predictions = [];
    
    for (const matchId of matchIds) {
      try {
        const prediction = await this.getPrediction(matchId);
        predictions.push({ matchId, prediction });
      } catch (error) {
        predictions.push({ matchId, error: error.message });
      }
    }
    
    return predictions;
  }

  async getAIInsights(matchId: string) {
    const cacheKey = `ai-insights:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/ai-insights`,
        { match_id: matchId }
      ).toPromise();

      const insights = response.data;
      await this.redis.set(cacheKey, JSON.stringify(insights), 1800); // 30 minutes
      
      return insights;
    } catch (error) {
      throw new ServiceUnavailableException('AI insights service unavailable');
    }
  }

  // Enhanced prediction methods with agent integration
  async getAgentBasedPrediction(matchId: string, agentId?: string) {
    const cacheKey = `agent-prediction:${matchId}:${agentId || 'default'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Get match data
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Use agent system for enhanced prediction
      const agentResponse = await this.httpService.post(
        `${process.env.AGENT_OS_URL}/agents/${agentId || 'default'}/tasks`,
        {
          task_type: 'predict_match',
          input_data: {
            home_team_id: match.homeTeam.id,
            away_team_id: match.awayTeam.id,
            match_date: match.matchDate.toISOString(),
            home_team_name: match.homeTeam.name,
            away_team_name: match.awayTeam.name,
            match_id: matchId,
          },
        }
      ).toPromise();

      const prediction = agentResponse.data;
      await this.redis.set(cacheKey, JSON.stringify(prediction), 1800); // 30 minutes
      
      return prediction;
    } catch (error) {
      throw new ServiceUnavailableException('Agent-based prediction service unavailable');
    }
  }

  async getEnhancedInsights(matchId: string, insightType: string = 'comprehensive') {
    const cacheKey = `enhanced-insights:${matchId}:${insightType}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Get match data
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Use agent system for enhanced insights
      const agentResponse = await this.httpService.post(
        `${process.env.AGENT_OS_URL}/agents/default/tasks`,
        {
          task_type: 'generate_insights',
          input_data: {
            insight_type: insightType,
            match_data: {
              home_team_id: match.homeTeam.id,
              away_team_id: match.awayTeam.id,
              match_date: match.matchDate.toISOString(),
              home_team_name: match.homeTeam.name,
              away_team_name: match.awayTeam.name,
            },
          },
        }
      ).toPromise();

      const insights = agentResponse.data;
      await this.redis.set(cacheKey, JSON.stringify(insights), 900); // 15 minutes
      
      return insights;
    } catch (error) {
      throw new ServiceUnavailableException('Enhanced insights service unavailable');
    }
  }

  async getPredictionWorkflow(matchId: string, workflowType: string = 'standard') {
    const cacheKey = `workflow:${matchId}:${workflowType}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Get match data
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Execute prediction workflow
      const workflowResponse = await this.httpService.post(
        `${process.env.AGENT_OS_URL}/workflows/execute`,
        {
          workflow_type: workflowType,
          input_data: {
            match_id: matchId,
            home_team_id: match.homeTeam.id,
            away_team_id: match.awayTeam.id,
            match_date: match.matchDate.toISOString(),
            home_team_name: match.homeTeam.name,
            away_team_name: match.awayTeam.name,
          },
        }
      ).toPromise();

      const workflow = workflowResponse.data;
      await this.redis.set(cacheKey, JSON.stringify(workflow), 3600); // 1 hour
      
      return workflow;
    } catch (error) {
      throw new ServiceUnavailableException('Prediction workflow service unavailable');
    }
  }

  async getTeamAnalysis(teamId: string, analysisType: string = 'comprehensive') {
    const cacheKey = `team-analysis:${teamId}:${analysisType}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Use agent system for team analysis
      const agentResponse = await this.httpService.post(
        `${process.env.AGENT_OS_URL}/agents/default/tasks`,
        {
          task_type: 'analyze_team',
          input_data: {
            team_id: teamId,
            analysis_type: analysisType,
          },
        }
      ).toPromise();

      const analysis = agentResponse.data;
      await this.redis.set(cacheKey, JSON.stringify(analysis), 7200); // 2 hours
      
      return analysis;
    } catch (error) {
      throw new ServiceUnavailableException('Team analysis service unavailable');
    }
  }

  async getPredictionTrends(timePeriod: string = '7d', trendType: string = 'general') {
    const cacheKey = `trends:${timePeriod}:${trendType}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Use agent system for trend analysis
      const agentResponse = await this.httpService.post(
        `${process.env.AGENT_OS_URL}/agents/default/tasks`,
        {
          task_type: 'generate_insights',
          input_data: {
            insight_type: 'trend_analysis',
            parameters: {
              time_period: timePeriod,
              trend_type: trendType,
            },
          },
        }
      ).toPromise();

      const trends = agentResponse.data;
      await this.redis.set(cacheKey, JSON.stringify(trends), 3600); // 1 hour
      
      return trends;
    } catch (error) {
      throw new ServiceUnavailableException('Trend analysis service unavailable');
    }
  }

  async getAgentStatus(agentId: string) {
    try {
      const response = await this.httpService.get(
        `${process.env.AGENT_OS_URL}/agents/${agentId}/status`
      ).toPromise();
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('Agent status service unavailable');
    }
  }

  async getAgentHealth(agentId: string) {
    try {
      const response = await this.httpService.get(
        `${process.env.AGENT_OS_URL}/agents/${agentId}/health`
      ).toPromise();
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('Agent health service unavailable');
    }
  }

  async storePrediction(predictionData: any) {
    return this.prisma.prediction.create({
      data: predictionData,
    });
  }

  async storeBatchPredictions(predictionsData: any[]) {
    return this.prisma.prediction.createMany({
      data: predictionsData,
    });
  }

  async getUserPredictions(userId: string, limit = 20) {
    return this.prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });
  }

  async getPredictionStats(userId?: string) {
    const whereClause = userId ? { userId } : {};
    
    const stats = await this.prisma.prediction.groupBy({
      by: ['predictionType'],
      where: whereClause,
      _count: {
        predictionType: true,
      },
    });

    const accuracyStats = await this.prisma.prediction.groupBy({
      by: ['predictionType'],
      where: {
        ...whereClause,
        isCorrect: {
          not: null,
        },
      },
      _count: {
        isCorrect: true,
      },
    });

    return {
      totalByType: stats,
      accuracyByType: accuracyStats,
    };
  }

  async updatePredictionResult(predictionId: string, isCorrect: boolean) {
    return this.prisma.prediction.update({
      where: { id: predictionId },
      data: { isCorrect },
    });
  }

  async getModelInfo() {
    try {
      const response = await this.httpService.get(
        `${process.env.ML_SERVICE_URL}/models/info`
      ).toPromise();
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('ML service unavailable');
    }
  }

  async getModelStatus() {
    try {
      const response = await this.httpService.get(
        `${process.env.ML_SERVICE_URL}/models/status`
      ).toPromise();
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('ML service unavailable');
    }
  }

  async trainModels() {
    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/train`
      ).toPromise();
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('ML training service unavailable');
    }
  }
} 