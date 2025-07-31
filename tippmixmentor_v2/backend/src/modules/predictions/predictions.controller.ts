import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PredictionsService } from './predictions.service';

@ApiTags('predictions')
@Controller('predictions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('ml/status')
  @ApiOperation({ summary: 'Get ML service status' })
  @ApiResponse({ status: 200, description: 'ML service status retrieved successfully' })
  async getMLServiceStatus() {
    return this.predictionsService.getMLServiceStatus();
  }

  @Get('ml/models/info')
  @ApiOperation({ summary: 'Get ML model information' })
  @ApiResponse({ status: 200, description: 'Model information retrieved successfully' })
  async getModelInfo() {
    return this.predictionsService.getModelInfo();
  }

  @Get('ml/models/status')
  @ApiOperation({ summary: 'Get ML model status' })
  @ApiResponse({ status: 200, description: 'Model status retrieved successfully' })
  async getModelStatus() {
    return this.predictionsService.getModelStatus();
  }

  @Post('ml/train')
  @ApiOperation({ summary: 'Trigger ML model training' })
  @ApiResponse({ status: 200, description: 'Model training initiated successfully' })
  async trainModels() {
    return this.predictionsService.trainModels();
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get prediction for a specific match' })
  @ApiResponse({ status: 200, description: 'Prediction retrieved successfully' })
  async getPrediction(@Param('matchId') matchId: string) {
    return this.predictionsService.getPrediction(matchId);
  }

  @Post('ml/batch-predict')
  @ApiOperation({ summary: 'Get batch predictions for multiple matches' })
  @ApiResponse({ status: 200, description: 'Batch predictions retrieved successfully' })
  async getBatchPredictions(@Body() body: { match_ids: string[] }) {
    return this.predictionsService.getBatchPredictions(body.match_ids);
  }

  @Get('match/:matchId/ai-insights')
  @ApiOperation({ summary: 'Get AI insights for a match' })
  @ApiResponse({ status: 200, description: 'AI insights retrieved successfully' })
  async getAIInsights(@Param('matchId') matchId: string) {
    return this.predictionsService.getAIInsights(matchId);
  }

  // Enhanced prediction endpoints with agent integration
  @Get('match/:matchId/agent-prediction')
  @ApiOperation({ summary: 'Get agent-based prediction for a match' })
  @ApiResponse({ status: 200, description: 'Agent-based prediction retrieved successfully' })
  async getAgentBasedPrediction(
    @Param('matchId') matchId: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.predictionsService.getAgentBasedPrediction(matchId, agentId);
  }

  @Get('match/:matchId/enhanced-insights')
  @ApiOperation({ summary: 'Get enhanced insights for a match using agent system' })
  @ApiResponse({ status: 200, description: 'Enhanced insights retrieved successfully' })
  async getEnhancedInsights(
    @Param('matchId') matchId: string,
    @Query('insightType') insightType: string = 'comprehensive',
  ) {
    return this.predictionsService.getEnhancedInsights(matchId, insightType);
  }

  @Get('match/:matchId/workflow')
  @ApiOperation({ summary: 'Execute prediction workflow for a match' })
  @ApiResponse({ status: 200, description: 'Prediction workflow executed successfully' })
  async getPredictionWorkflow(
    @Param('matchId') matchId: string,
    @Query('workflowType') workflowType: string = 'standard',
  ) {
    return this.predictionsService.getPredictionWorkflow(matchId, workflowType);
  }

  @Get('team/:teamId/analysis')
  @ApiOperation({ summary: 'Get comprehensive team analysis' })
  @ApiResponse({ status: 200, description: 'Team analysis retrieved successfully' })
  async getTeamAnalysis(
    @Param('teamId') teamId: string,
    @Query('analysisType') analysisType: string = 'comprehensive',
  ) {
    return this.predictionsService.getTeamAnalysis(teamId, analysisType);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get prediction trends and patterns' })
  @ApiResponse({ status: 200, description: 'Prediction trends retrieved successfully' })
  async getPredictionTrends(
    @Query('timePeriod') timePeriod: string = '7d',
    @Query('trendType') trendType: string = 'general',
  ) {
    return this.predictionsService.getPredictionTrends(timePeriod, trendType);
  }

  @Get('agents/:agentId/status')
  @ApiOperation({ summary: 'Get agent status' })
  @ApiResponse({ status: 200, description: 'Agent status retrieved successfully' })
  async getAgentStatus(@Param('agentId') agentId: string) {
    return this.predictionsService.getAgentStatus(agentId);
  }

  @Get('agents/:agentId/health')
  @ApiOperation({ summary: 'Get agent health information' })
  @ApiResponse({ status: 200, description: 'Agent health retrieved successfully' })
  async getAgentHealth(@Param('agentId') agentId: string) {
    return this.predictionsService.getAgentHealth(agentId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user predictions' })
  @ApiResponse({ status: 200, description: 'User predictions retrieved successfully' })
  async getUserPredictions(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.predictionsService.getUserPredictions(userId, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get prediction statistics' })
  @ApiResponse({ status: 200, description: 'Prediction statistics retrieved successfully' })
  async getPredictionStats(@Query('userId') userId?: string) {
    return this.predictionsService.getPredictionStats(userId);
  }

  @Post('store')
  @ApiOperation({ summary: 'Store a new prediction' })
  @ApiResponse({ status: 201, description: 'Prediction stored successfully' })
  async storePrediction(@Body() predictionData: any) {
    return this.predictionsService.storePrediction(predictionData);
  }

  @Post('store/batch')
  @ApiOperation({ summary: 'Store multiple predictions' })
  @ApiResponse({ status: 201, description: 'Predictions stored successfully' })
  async storeBatchPredictions(@Body() predictionsData: any[]) {
    return this.predictionsService.storeBatchPredictions(predictionsData);
  }

  @Post(':predictionId/result')
  @ApiOperation({ summary: 'Update prediction result' })
  @ApiResponse({ status: 200, description: 'Prediction result updated successfully' })
  async updatePredictionResult(
    @Param('predictionId') predictionId: string,
    @Body() body: { isCorrect: boolean },
  ) {
    return this.predictionsService.updatePredictionResult(predictionId, body.isCorrect);
  }
} 