import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RealtimeDataService } from './realtime-data.service';

@ApiTags('Real-time Data')
@Controller('realtime-data')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RealtimeDataController {
  constructor(private readonly realtimeDataService: RealtimeDataService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start real-time data service' })
  @ApiResponse({ status: 200, description: 'Real-time data service started successfully' })
  async startService() {
    this.realtimeDataService.start();
    return {
      message: 'Real-time data service started successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('stop')
  @ApiOperation({ summary: 'Stop real-time data service' })
  @ApiResponse({ status: 200, description: 'Real-time data service stopped successfully' })
  async stopService() {
    this.realtimeDataService.stop();
    return {
      message: 'Real-time data service stopped successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get real-time data service status' })
  @ApiResponse({ status: 200, description: 'Service status retrieved successfully' })
  async getServiceStatus() {
    const isRunning = this.realtimeDataService.isServiceRunning();
    return {
      isRunning,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('update/live-matches')
  @ApiOperation({ summary: 'Trigger manual live match update' })
  @ApiResponse({ status: 200, description: 'Live match update triggered successfully' })
  async triggerLiveMatchUpdate() {
    await this.realtimeDataService.manualLiveMatchUpdate();
    return {
      message: 'Live match update triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('update/league-standings')
  @ApiOperation({ summary: 'Trigger manual league standings update' })
  @ApiResponse({ status: 200, description: 'League standings update triggered successfully' })
  async triggerLeagueStandingsUpdate() {
    await this.realtimeDataService.manualLeagueStandingsUpdate();
    return {
      message: 'League standings update triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('update/predictions')
  @ApiOperation({ summary: 'Trigger manual prediction update' })
  @ApiResponse({ status: 200, description: 'Prediction update triggered successfully' })
  async triggerPredictionUpdate() {
    await this.realtimeDataService.manualPredictionUpdate();
    return {
      message: 'Prediction update triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('update/agent-performance')
  @ApiOperation({ summary: 'Trigger manual agent performance update' })
  @ApiResponse({ status: 200, description: 'Agent performance update triggered successfully' })
  async triggerAgentPerformanceUpdate() {
    await this.realtimeDataService.manualAgentPerformanceUpdate();
    return {
      message: 'Agent performance update triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('update/all')
  @ApiOperation({ summary: 'Trigger all real-time updates' })
  @ApiResponse({ status: 200, description: 'All updates triggered successfully' })
  async triggerAllUpdates() {
    await Promise.all([
      this.realtimeDataService.manualLiveMatchUpdate(),
      this.realtimeDataService.manualLeagueStandingsUpdate(),
      this.realtimeDataService.manualPredictionUpdate(),
      this.realtimeDataService.manualAgentPerformanceUpdate(),
    ]);

    return {
      message: 'All real-time updates triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }
} 