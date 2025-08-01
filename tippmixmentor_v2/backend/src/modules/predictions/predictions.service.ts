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

  async getPredictions(limit?: number) {
    try {
      // For now, return mock data. In a real implementation, this would fetch from the database
      const mockPredictions = [
        {
          id: '1',
          homeTeam: 'Liverpool',
          awayTeam: 'Chelsea',
          prediction: 'HOME_WIN',
          confidence: 0.82,
          odds: 1.85,
          stake: 50,
          potentialWin: 92.5,
          matchTime: '2025-08-01T20:00:00Z',
          league: 'Premier League',
          status: 'pending'
        },
        {
          id: '2',
          homeTeam: 'PSG',
          awayTeam: 'Marseille',
          prediction: 'AWAY_WIN',
          confidence: 0.68,
          odds: 2.4,
          stake: 30,
          potentialWin: 72,
          matchTime: '2025-08-02T21:00:00Z',
          league: 'Ligue 1',
          status: 'pending'
        },
        {
          id: '3',
          homeTeam: 'AC Milan',
          awayTeam: 'Inter Milan',
          prediction: 'DRAW',
          confidence: 0.45,
          odds: 3.2,
          stake: 25,
          potentialWin: 80,
          matchTime: '2025-08-01T18:30:00Z',
          league: 'Serie A',
          status: 'live'
        }
      ];

      return {
        success: true,
        predictions: limit ? mockPredictions.slice(0, limit) : mockPredictions,
        total: mockPredictions.length
      };
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return {
        success: false,
        predictions: [],
        total: 0,
        error: 'Failed to fetch predictions'
      };
    }
  }

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
    try {
      // Return both stats and predictions data for the frontend
      const stats = {
        totalPredictions: 1250,
        successfulPredictions: 892,
        successRate: 71.36,
        totalWinnings: 15420,
        averageOdds: 2.15,
        bestStreak: 8,
        currentStreak: 3,
        monthlyStats: {
          predictions: 45,
          successRate: 73.3,
          winnings: 1250
        },
        byLeague: {
          'Premier League': { predictions: 320, successRate: 68.5 },
          'La Liga': { predictions: 280, successRate: 72.1 },
          'Serie A': { predictions: 250, successRate: 69.8 },
          'Bundesliga': { predictions: 220, successRate: 74.2 },
          'Ligue 1': { predictions: 180, successRate: 71.5 }
        }
      };

      // Mock predictions data
      const predictions = [
        {
          id: '1',
          homeTeam: 'Liverpool',
          awayTeam: 'Chelsea',
          prediction: 'HOME_WIN',
          confidence: 0.82,
          odds: 1.85,
          stake: 50,
          potentialWin: 92.5,
          matchTime: '2025-08-01T20:00:00Z',
          league: 'Premier League',
          status: 'pending'
        },
        {
          id: '2',
          homeTeam: 'PSG',
          awayTeam: 'Marseille',
          prediction: 'AWAY_WIN',
          confidence: 0.68,
          odds: 2.4,
          stake: 30,
          potentialWin: 72,
          matchTime: '2025-08-02T21:00:00Z',
          league: 'Ligue 1',
          status: 'pending'
        },
        {
          id: '3',
          homeTeam: 'AC Milan',
          awayTeam: 'Inter Milan',
          prediction: 'DRAW',
          confidence: 0.45,
          odds: 3.2,
          stake: 25,
          potentialWin: 80,
          matchTime: '2025-08-01T18:30:00Z',
          league: 'Serie A',
          status: 'live'
        }
      ];

      return {
        success: true,
        stats,
        predictions,
        total: predictions.length,
        userId: userId || 'all'
      };
    } catch (error) {
      console.error('Error fetching prediction stats:', error);
      return {
        success: false,
        error: 'Failed to fetch prediction stats'
      };
    }
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

  async getRecentPredictions(limit: number = 50) {
    try {
      const predictions = await this.prisma.prediction.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
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
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return predictions;
    } catch (error) {
      throw new ServiceUnavailableException('Failed to fetch recent predictions');
    }
  }

  // Advanced ML Model Integration Methods

  async getAdvancedPrediction(matchId: string, modelType: string = 'ensemble') {
    const cacheKey = `advanced_prediction:${matchId}:${modelType}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/advanced`,
        { 
          match_id: matchId,
          model_type: modelType,
          include_confidence_intervals: true,
          include_feature_importance: true,
        }
      ).toPromise();

      const prediction = response.data;
      await this.redis.set(cacheKey, JSON.stringify(prediction), 1800); // 30 minutes
      
      return prediction;
    } catch (error) {
      throw new ServiceUnavailableException('Advanced ML service unavailable');
    }
  }

  async getEnsemblePrediction(matchId: string) {
    const cacheKey = `ensemble_prediction:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/ensemble`,
        { match_id: matchId }
      ).toPromise();

      const prediction = response.data;
      await this.redis.set(cacheKey, JSON.stringify(prediction), 1800);
      
      return prediction;
    } catch (error) {
      throw new ServiceUnavailableException('Ensemble prediction service unavailable');
    }
  }

  async getModelComparison(matchId: string) {
    const cacheKey = `model_comparison:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/compare-models`,
        { match_id: matchId }
      ).toPromise();

      const comparison = response.data;
      await this.redis.set(cacheKey, JSON.stringify(comparison), 1800);
      
      return comparison;
    } catch (error) {
      throw new ServiceUnavailableException('Model comparison service unavailable');
    }
  }

  async getFeatureImportance(matchId: string) {
    const cacheKey = `feature_importance:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/feature-importance`,
        { match_id: matchId }
      ).toPromise();

      const importance = response.data;
      await this.redis.set(cacheKey, JSON.stringify(importance), 3600); // 1 hour
      
      return importance;
    } catch (error) {
      throw new ServiceUnavailableException('Feature importance service unavailable');
    }
  }

  async getConfidenceIntervals(matchId: string) {
    const cacheKey = `confidence_intervals:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/confidence-intervals`,
        { match_id: matchId }
      ).toPromise();

      const intervals = response.data;
      await this.redis.set(cacheKey, JSON.stringify(intervals), 1800);
      
      return intervals;
    } catch (error) {
      throw new ServiceUnavailableException('Confidence intervals service unavailable');
    }
  }

  async getModelPerformanceMetrics(modelId?: string) {
    const cacheKey = `model_performance:${modelId || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.get(
        `${process.env.ML_SERVICE_URL}/models/performance${modelId ? `/${modelId}` : ''}`
      ).toPromise();

      const metrics = response.data;
      await this.redis.set(cacheKey, JSON.stringify(metrics), 3600);
      
      return metrics;
    } catch (error) {
      throw new ServiceUnavailableException('Model performance service unavailable');
    }
  }

  async retrainModel(modelId: string, dataParams?: any) {
    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/models/retrain/${modelId}`,
        dataParams || {}
      ).toPromise();
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('Model retraining service unavailable');
    }
  }

  async validateModel(modelId: string, validationData?: any) {
    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/models/validate/${modelId}`,
        validationData || {}
      ).toPromise();
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('Model validation service unavailable');
    }
  }

  async getModelDriftAnalysis(modelId: string) {
    const cacheKey = `model_drift:${modelId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.get(
        `${process.env.ML_SERVICE_URL}/models/drift/${modelId}`
      ).toPromise();

      const drift = response.data;
      await this.redis.set(cacheKey, JSON.stringify(drift), 7200); // 2 hours
      
      return drift;
    } catch (error) {
      throw new ServiceUnavailableException('Model drift analysis service unavailable');
    }
  }

  async getPredictionExplanation(matchId: string, modelId?: string) {
    const cacheKey = `prediction_explanation:${matchId}:${modelId || 'default'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/explain`,
        { 
          match_id: matchId,
          model_id: modelId 
        }
      ).toPromise();

      const explanation = response.data;
      await this.redis.set(cacheKey, JSON.stringify(explanation), 1800);
      
      return explanation;
    } catch (error) {
      throw new ServiceUnavailableException('Prediction explanation service unavailable');
    }
  }

  async getHistoricalAccuracy(timePeriod: string = '30d') {
    const cacheKey = `historical_accuracy:${timePeriod}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.get(
        `${process.env.ML_SERVICE_URL}/predictions/historical-accuracy?period=${timePeriod}`
      ).toPromise();

      const accuracy = response.data;
      await this.redis.set(cacheKey, JSON.stringify(accuracy), 3600);
      
      return accuracy;
    } catch (error) {
      throw new ServiceUnavailableException('Historical accuracy service unavailable');
    }
  }

  async getModelRecommendations(matchId: string) {
    const cacheKey = `model_recommendations:${matchId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.httpService.post(
        `${process.env.ML_SERVICE_URL}/predictions/recommendations`,
        { match_id: matchId }
      ).toPromise();

      const recommendations = response.data;
      await this.redis.set(cacheKey, JSON.stringify(recommendations), 1800);
      
      return recommendations;
    } catch (error) {
      throw new ServiceUnavailableException('Model recommendations service unavailable');
    }
  }
} 