import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PredictionsService } from './predictions.service';

@ApiTags('predictions')
@Controller('predictions')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
// @ApiBearerAuth()
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all predictions' })
  @ApiResponse({ status: 200, description: 'Predictions retrieved successfully' })
  async getPredictions(@Query('limit') limit?: string) {
    return this.predictionsService.getPredictions(limit ? parseInt(limit) : undefined);
  }

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

  // Advanced ML Model Integration Endpoints

  @Get('advanced/:matchId')
  @ApiOperation({ summary: 'Get advanced ML prediction with confidence intervals and feature importance' })
  @ApiResponse({ status: 200, description: 'Advanced prediction retrieved successfully' })
  @ApiQuery({ name: 'modelType', required: false, description: 'Model type (ensemble, neural, etc.)', example: 'ensemble' })
  async getAdvancedPrediction(
    @Param('matchId') matchId: string,
    @Query('modelType') modelType: string = 'ensemble',
  ) {
    return this.predictionsService.getAdvancedPrediction(matchId, modelType);
  }

  @Get('ensemble/:matchId')
  @ApiOperation({ summary: 'Get ensemble prediction combining multiple models' })
  @ApiResponse({ status: 200, description: 'Ensemble prediction retrieved successfully' })
  async getEnsemblePrediction(@Param('matchId') matchId: string) {
    return this.predictionsService.getEnsemblePrediction(matchId);
  }

  @Get('compare-models/:matchId')
  @ApiOperation({ summary: 'Compare predictions from different models' })
  @ApiResponse({ status: 200, description: 'Model comparison retrieved successfully' })
  async getModelComparison(@Param('matchId') matchId: string) {
    return this.predictionsService.getModelComparison(matchId);
  }

  @Get('feature-importance/:matchId')
  @ApiOperation({ summary: 'Get feature importance for a prediction' })
  @ApiResponse({ status: 200, description: 'Feature importance retrieved successfully' })
  async getFeatureImportance(@Param('matchId') matchId: string) {
    return this.predictionsService.getFeatureImportance(matchId);
  }

  @Get('confidence-intervals/:matchId')
  @ApiOperation({ summary: 'Get confidence intervals for a prediction' })
  @ApiResponse({ status: 200, description: 'Confidence intervals retrieved successfully' })
  async getConfidenceIntervals(@Param('matchId') matchId: string) {
    return this.predictionsService.getConfidenceIntervals(matchId);
  }

  @Get('models/performance')
  @ApiOperation({ summary: 'Get ML model performance metrics' })
  @ApiResponse({ status: 200, description: 'Model performance metrics retrieved successfully' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Specific model ID' })
  async getModelPerformanceMetrics(@Query('modelId') modelId?: string) {
    return this.predictionsService.getModelPerformanceMetrics(modelId);
  }

  @Post('models/retrain/:modelId')
  @ApiOperation({ summary: 'Retrain a specific ML model' })
  @ApiResponse({ status: 200, description: 'Model retraining initiated successfully' })
  async retrainModel(
    @Param('modelId') modelId: string,
    @Body() dataParams?: any,
  ) {
    return this.predictionsService.retrainModel(modelId, dataParams);
  }

  @Post('models/validate/:modelId')
  @ApiOperation({ summary: 'Validate a specific ML model' })
  @ApiResponse({ status: 200, description: 'Model validation completed successfully' })
  async validateModel(
    @Param('modelId') modelId: string,
    @Body() validationData?: any,
  ) {
    return this.predictionsService.validateModel(modelId, validationData);
  }

  @Get('models/drift/:modelId')
  @ApiOperation({ summary: 'Get model drift analysis' })
  @ApiResponse({ status: 200, description: 'Model drift analysis retrieved successfully' })
  async getModelDriftAnalysis(@Param('modelId') modelId: string) {
    return this.predictionsService.getModelDriftAnalysis(modelId);
  }

  @Get('explain/:matchId')
  @ApiOperation({ summary: 'Get explanation for a prediction' })
  @ApiResponse({ status: 200, description: 'Prediction explanation retrieved successfully' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Specific model ID' })
  async getPredictionExplanation(
    @Param('matchId') matchId: string,
    @Query('modelId') modelId?: string,
  ) {
    return this.predictionsService.getPredictionExplanation(matchId, modelId);
  }

  @Get('historical-accuracy')
  @ApiOperation({ summary: 'Get historical accuracy data' })
  @ApiResponse({ status: 200, description: 'Historical accuracy retrieved successfully' })
  @ApiQuery({ name: 'timePeriod', required: false, description: 'Time period', example: '30d' })
  async getHistoricalAccuracy(@Query('timePeriod') timePeriod: string = '30d') {
    return this.predictionsService.getHistoricalAccuracy(timePeriod);
  }

  @Get('recommendations/:matchId')
  @ApiOperation({ summary: 'Get model recommendations for a match' })
  @ApiResponse({ status: 200, description: 'Model recommendations retrieved successfully' })
  async getModelRecommendations(@Param('matchId') matchId: string) {
    return this.predictionsService.getModelRecommendations(matchId);
  }
} 