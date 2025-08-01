import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiFootballService } from './api-football.service';

@ApiTags('api-football')
@Controller('api-football')
export class ApiFootballController {
  constructor(private readonly apiFootballService: ApiFootballService) {}

  @Get('leagues')
  @ApiOperation({ summary: 'Get available leagues from API-Football' })
  @ApiResponse({
    status: 200,
    description: 'Leagues retrieved successfully',
  })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'season', required: false, type: Number })
  async getLeagues(
    @Query('country') country?: string,
    @Query('season') season?: number,
  ) {
    return this.apiFootballService.getLeagues(country, season);
  }

  @Get('leagues/:id')
  @ApiOperation({ summary: 'Get specific league by ID' })
  @ApiResponse({
    status: 200,
    description: 'League retrieved successfully',
  })
  @ApiParam({ name: 'id', description: 'League ID' })
  @ApiQuery({ name: 'season', required: false, type: Number })
  async getLeagueById(
    @Param('id', ParseIntPipe) id: number,
    @Query('season') season?: number,
  ) {
    return this.apiFootballService.getLeagueById(id, season);
  }

  @Get('teams')
  @ApiOperation({ summary: 'Get teams for a league' })
  @ApiResponse({
    status: 200,
    description: 'Teams retrieved successfully',
  })
  @ApiQuery({ name: 'league', required: true, type: Number })
  @ApiQuery({ name: 'season', required: true, type: Number })
  async getTeams(
    @Query('league', ParseIntPipe) league: number,
    @Query('season', ParseIntPipe) season: number,
  ) {
    return this.apiFootballService.getTeams(league, season);
  }

  @Get('teams/:id')
  @ApiOperation({ summary: 'Get specific team by ID' })
  @ApiResponse({
    status: 200,
    description: 'Team retrieved successfully',
  })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiQuery({ name: 'season', required: false, type: Number })
  async getTeamById(
    @Param('id', ParseIntPipe) id: number,
    @Query('season') season?: number,
  ) {
    return this.apiFootballService.getTeamById(id, season);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get matches for a league' })
  @ApiResponse({
    status: 200,
    description: 'Matches retrieved successfully',
  })
  @ApiQuery({ name: 'league', required: true, type: Number })
  @ApiQuery({ name: 'season', required: true, type: Number })
  @ApiQuery({ name: 'round', required: false, type: String })
  async getMatches(
    @Query('league', ParseIntPipe) league: number,
    @Query('season', ParseIntPipe) season: number,
    @Query('round') round?: string,
  ) {
    return this.apiFootballService.getMatches(league, season, round);
  }

  @Get('matches/live')
  @ApiOperation({ summary: 'Get live matches' })
  @ApiResponse({
    status: 200,
    description: 'Live matches retrieved successfully',
  })
  async getLiveMatches() {
    return this.apiFootballService.getLiveMatches();
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Get specific match by ID' })
  @ApiResponse({
    status: 200,
    description: 'Match retrieved successfully',
  })
  @ApiParam({ name: 'id', description: 'Fixture ID' })
  async getMatchById(@Param('id', ParseIntPipe) id: number) {
    return this.apiFootballService.getMatchById(id);
  }

  @Get('standings')
  @ApiOperation({ summary: 'Get standings for a league' })
  @ApiResponse({
    status: 200,
    description: 'Standings retrieved successfully',
  })
  @ApiQuery({ name: 'league', required: true, type: Number })
  @ApiQuery({ name: 'season', required: true, type: Number })
  async getStandings(
    @Query('league', ParseIntPipe) league: number,
    @Query('season', ParseIntPipe) season: number,
  ) {
    return this.apiFootballService.getStandings(league, season);
  }

  @Get('scorers')
  @ApiOperation({ summary: 'Get top scorers for a league' })
  @ApiResponse({
    status: 200,
    description: 'Scorers retrieved successfully',
  })
  @ApiQuery({ name: 'league', required: true, type: Number })
  @ApiQuery({ name: 'season', required: true, type: Number })
  async getScorers(
    @Query('league', ParseIntPipe) league: number,
    @Query('season', ParseIntPipe) season: number,
  ) {
    return this.apiFootballService.getScorers(league, season);
  }

  @Post('sync/:leagueId/:season')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync league data to database' })
  @ApiResponse({
    status: 200,
    description: 'League data synced successfully',
  })
  @ApiParam({ name: 'leagueId', description: 'League ID' })
  @ApiParam({ name: 'season', description: 'Season year' })
  async syncLeagueData(
    @Param('leagueId', ParseIntPipe) leagueId: number,
    @Param('season', ParseIntPipe) season: number,
  ) {
    await this.apiFootballService.syncLeagueData(leagueId, season);
    return {
      message: `Successfully synced league ${leagueId} for season ${season}`,
      leagueId,
      season,
    };
  }

  @Get('rate-limit')
  @ApiOperation({ summary: 'Get API rate limit status' })
  @ApiResponse({
    status: 200,
    description: 'Rate limit status retrieved successfully',
  })
  async getRateLimitStatus() {
    return this.apiFootballService.getRateLimitStatus();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get API-Football service status' })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully',
  })
  async getStatus() {
    const rateLimit = await this.apiFootballService.getRateLimitStatus();
    return {
      service: 'API-Football',
      status: 'active',
      rateLimit,
      timestamp: new Date().toISOString(),
    };
  }
} 