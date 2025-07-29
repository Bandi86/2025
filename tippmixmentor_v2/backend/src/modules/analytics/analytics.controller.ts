import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get system overview analytics' })
  @ApiResponse({
    status: 200,
    description: 'System overview retrieved successfully',
  })
  async getSystemOverview() {
    return this.analyticsService.getSystemOverview();
  }

  @Get('user-performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user performance analytics' })
  @ApiResponse({
    status: 200,
    description: 'User performance analytics retrieved successfully',
  })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  async getUserPerformance(
    @Request() req,
    @Query('period') period = 'month',
  ) {
    return this.analyticsService.getUserPerformance(req.user.id, period);
  }

  @Get('league-stats')
  @ApiOperation({ summary: 'Get league statistics' })
  @ApiResponse({
    status: 200,
    description: 'League statistics retrieved successfully',
  })
  @ApiQuery({ name: 'leagueId', required: false, type: String })
  async getLeagueStats(@Query('leagueId') leagueId?: string) {
    return this.analyticsService.getLeagueStats(leagueId);
  }

  @Get('team-stats')
  @ApiOperation({ summary: 'Get team statistics' })
  @ApiResponse({
    status: 200,
    description: 'Team statistics retrieved successfully',
  })
  @ApiQuery({ name: 'teamId', required: false, type: String })
  async getTeamStats(@Query('teamId') teamId?: string) {
    return this.analyticsService.getTeamStats(teamId);
  }

  @Get('prediction-accuracy')
  @ApiOperation({ summary: 'Get prediction accuracy analytics' })
  @ApiResponse({
    status: 200,
    description: 'Prediction accuracy analytics retrieved successfully',
  })
  @ApiQuery({ name: 'modelVersion', required: false, type: String })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  async getPredictionAccuracy(
    @Query('modelVersion') modelVersion?: string,
    @Query('period') period = 'month',
  ) {
    return this.analyticsService.getPredictionAccuracy(modelVersion, period);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get prediction trends' })
  @ApiResponse({
    status: 200,
    description: 'Prediction trends retrieved successfully',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getTrends(@Query('days') days = 30) {
    return this.analyticsService.getTrends(Number(days));
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized insights for user' })
  @ApiResponse({
    status: 200,
    description: 'User insights retrieved successfully',
  })
  async getInsights(@Request() req) {
    return this.analyticsService.getInsights(req.user.id);
  }

  // New Enhanced Analytics Endpoints
  @Get('model-performance')
  @ApiOperation({ summary: 'Get model performance analytics' })
  @ApiResponse({
    status: 200,
    description: 'Model performance analytics retrieved successfully',
  })
  @ApiQuery({ name: 'modelVersion', required: false, type: String })
  async getModelPerformance(@Query('modelVersion') modelVersion?: string) {
    return this.analyticsService.getModelPerformanceAnalytics(modelVersion);
  }

  @Get('system-performance')
  @ApiOperation({ summary: 'Get system performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'System performance metrics retrieved successfully',
  })
  async getSystemPerformance() {
    return this.analyticsService.getSystemPerformanceMetrics();
  }

  @Get('user-engagement')
  @ApiOperation({ summary: 'Get user engagement metrics' })
  @ApiResponse({
    status: 200,
    description: 'User engagement metrics retrieved successfully',
  })
  async getUserEngagement() {
    return this.analyticsService.getUserEngagementMetrics();
  }

  @Get('league-performance')
  @ApiOperation({ summary: 'Get league performance analytics' })
  @ApiResponse({
    status: 200,
    description: 'League performance analytics retrieved successfully',
  })
  async getLeaguePerformance() {
    return this.analyticsService.getLeaguePerformanceAnalytics();
  }

  @Get('prediction-trends')
  @ApiOperation({ summary: 'Get prediction trends over time' })
  @ApiResponse({
    status: 200,
    description: 'Prediction trends retrieved successfully',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getPredictionTrends(@Query('days') days = 30) {
    return this.analyticsService.getPredictionTrends(Number(days));
  }

  @Get('realtime-stats')
  @ApiOperation({ summary: 'Get real-time statistics' })
  @ApiResponse({
    status: 200,
    description: 'Real-time statistics retrieved successfully',
  })
  async getRealtimeStats() {
    return this.analyticsService.getSystemOverview();
  }
} 