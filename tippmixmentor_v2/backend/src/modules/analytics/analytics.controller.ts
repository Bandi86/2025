import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics & Performance')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test analytics endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async test() {
    return { message: 'Analytics module is working!', timestamp: new Date().toISOString() };
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get comprehensive performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for user-specific metrics' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 30d, 90d, 1y)', example: '30d' })
  async getPerformanceMetrics(
    @Query('userId') userId?: string,
    @Query('period') period: string = '30d',
  ) {
    return this.analyticsService.getPerformanceMetrics(userId, period);
  }

  @Get('roi')
  @ApiOperation({ summary: 'Get detailed ROI analysis' })
  @ApiResponse({ status: 200, description: 'ROI analysis retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for user-specific analysis' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period for analysis', example: '90d' })
  async getROIAnalysis(
    @Query('userId') userId?: string,
    @Query('period') period: string = '90d',
  ) {
    return this.analyticsService.getROIAnalysis(userId, period);
  }

  @Get('models/performance')
  @ApiOperation({ summary: 'Get ML model performance analytics' })
  @ApiResponse({ status: 200, description: 'Model performance retrieved successfully' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Specific model ID' })
  async getModelPerformance(@Query('modelId') modelId?: string) {
    return this.analyticsService.getModelPerformance(modelId);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get advanced insights and patterns' })
  @ApiResponse({ status: 200, description: 'Advanced insights retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for user-specific insights' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period for insights', example: '90d' })
  async getAdvancedInsights(
    @Query('userId') userId?: string,
    @Query('period') period: string = '90d',
  ) {
    return this.analyticsService.getAdvancedInsights(userId, period);
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get detailed prediction analytics' })
  @ApiResponse({ status: 200, description: 'Prediction analytics retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for user-specific analytics' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '30d' })
  @ApiQuery({ name: 'league', required: false, description: 'Filter by league' })
  @ApiQuery({ name: 'agentType', required: false, description: 'Filter by agent type' })
  @ApiQuery({ name: 'minConfidence', required: false, description: 'Minimum confidence threshold', type: Number })
  async getPredictionAnalytics(
    @Query('userId') userId?: string,
    @Query('period') period: string = '30d',
    @Query('league') league?: string,
    @Query('agentType') agentType?: string,
    @Query('minConfidence') minConfidence?: number,
  ) {
    const filters = { league, agentType, minConfidence };
    return this.analyticsService.getPredictionAnalytics(userId, period, filters);
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time analytics dashboard data' })
  @ApiResponse({ status: 200, description: 'Real-time analytics retrieved successfully' })
  async getRealTimeAnalytics() {
    return this.analyticsService.getRealTimeAnalytics();
  }

  @Get('performance/:userId')
  @ApiOperation({ summary: 'Get performance metrics for specific user' })
  @ApiResponse({ status: 200, description: 'User performance metrics retrieved successfully' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '30d' })
  async getUserPerformanceMetrics(
    @Param('userId') userId: string,
    @Query('period') period: string = '30d',
  ) {
    return this.analyticsService.getPerformanceMetrics(userId, period);
  }

  @Get('roi/:userId')
  @ApiOperation({ summary: 'Get ROI analysis for specific user' })
  @ApiResponse({ status: 200, description: 'User ROI analysis retrieved successfully' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '90d' })
  async getUserROIAnalysis(
    @Param('userId') userId: string,
    @Query('period') period: string = '90d',
  ) {
    return this.analyticsService.getROIAnalysis(userId, period);
  }

  @Get('insights/:userId')
  @ApiOperation({ summary: 'Get advanced insights for specific user' })
  @ApiResponse({ status: 200, description: 'User insights retrieved successfully' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '90d' })
  async getUserAdvancedInsights(
    @Param('userId') userId: string,
    @Query('period') period: string = '90d',
  ) {
    return this.analyticsService.getAdvancedInsights(userId, period);
  }

  @Get('predictions/:userId')
  @ApiOperation({ summary: 'Get prediction analytics for specific user' })
  @ApiResponse({ status: 200, description: 'User prediction analytics retrieved successfully' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '30d' })
  @ApiQuery({ name: 'league', required: false, description: 'Filter by league' })
  @ApiQuery({ name: 'agentType', required: false, description: 'Filter by agent type' })
  @ApiQuery({ name: 'minConfidence', required: false, description: 'Minimum confidence threshold', type: Number })
  async getUserPredictionAnalytics(
    @Param('userId') userId: string,
    @Query('period') period: string = '30d',
    @Query('league') league?: string,
    @Query('agentType') agentType?: string,
    @Query('minConfidence') minConfidence?: number,
  ) {
    const filters = { league, agentType, minConfidence };
    return this.analyticsService.getPredictionAnalytics(userId, period, filters);
  }

  @Get('league/:leagueCode')
  @ApiOperation({ summary: 'Get analytics for specific league' })
  @ApiResponse({ status: 200, description: 'League analytics retrieved successfully' })
  @ApiParam({ name: 'leagueCode', description: 'League code (e.g., PL, PD, SA)' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '30d' })
  async getLeagueAnalytics(
    @Param('leagueCode') leagueCode: string,
    @Query('period') period: string = '30d',
  ) {
    const filters = { league: leagueCode };
    return this.analyticsService.getPredictionAnalytics(undefined, period, filters);
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Get analytics for specific agent' })
  @ApiResponse({ status: 200, description: 'Agent analytics retrieved successfully' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '30d' })
  async getAgentAnalytics(
    @Param('agentId') agentId: string,
    @Query('period') period: string = '30d',
  ) {
    const filters = { agentType: agentId };
    return this.analyticsService.getPredictionAnalytics(undefined, period, filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get comprehensive analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for user-specific summary' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period', example: '30d' })
  async getAnalyticsSummary(
    @Query('userId') userId?: string,
    @Query('period') period: string = '30d',
  ) {
    const [performanceMetrics, roiAnalysis, advancedInsights, realTimeAnalytics] = await Promise.all([
      this.analyticsService.getPerformanceMetrics(userId, period),
      this.analyticsService.getROIAnalysis(userId, period),
      this.analyticsService.getAdvancedInsights(userId, period),
      this.analyticsService.getRealTimeAnalytics(),
    ]);

    return {
      performanceMetrics,
      roiAnalysis,
      advancedInsights,
      realTimeAnalytics,
      summary: {
        totalPredictions: performanceMetrics.totalPredictions,
        accuracy: performanceMetrics.accuracy,
        profit: performanceMetrics.profit,
        roi: performanceMetrics.roi,
        activeAgents: realTimeAnalytics.activeAgents,
        systemHealth: realTimeAnalytics.systemHealth,
      },
    };
  }
} 