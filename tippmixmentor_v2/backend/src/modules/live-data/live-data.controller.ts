import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LiveDataService } from './live-data.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Live Data')
@Controller('live-data')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LiveDataController {
  constructor(private readonly liveDataService: LiveDataService) {}

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get live match data' })
  @ApiResponse({ status: 200, description: 'Live match data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async getLiveMatchData(@Param('matchId') matchId: string) {
    return this.liveDataService.getLiveMatchData(matchId);
  }

  @Get('matches/live')
  @ApiOperation({ summary: 'Get all live matches' })
  @ApiResponse({ status: 200, description: 'Live matches retrieved successfully' })
  async getLiveMatches() {
    return this.liveDataService.getLiveMatches();
  }

  @Get('matches/upcoming')
  @ApiOperation({ summary: 'Get upcoming matches' })
  @ApiResponse({ status: 200, description: 'Upcoming matches retrieved successfully' })
  async getUpcomingMatches(@Query('limit') limit: number = 10) {
    return this.liveDataService.getUpcomingMatches(limit);
  }

  @Get('stream/:matchId')
  @ApiOperation({ summary: 'Stream live updates for a match' })
  @ApiResponse({ status: 200, description: 'Live stream started successfully' })
  async streamLiveUpdates(@Param('matchId') matchId: string, @Request() req: any) {
    // This endpoint would be used with WebSocket for real-time streaming
    // For now, return a message indicating the stream is available
    return {
      message: 'Live stream available',
      matchId,
      streamUrl: `/live-data/stream/${matchId}`,
      userId: req.user.id,
    };
  }
} 