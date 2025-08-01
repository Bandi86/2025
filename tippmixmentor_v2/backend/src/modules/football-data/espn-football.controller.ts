import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ESPNFootballService } from './espn-football.service';

@ApiTags('ESPN Football Data')
@Controller('espn-football')
export class ESPNFootballController {
  constructor(private readonly espnFootballService: ESPNFootballService) {}

  @Get('leagues')
  @ApiOperation({ summary: 'Get supported ESPN leagues' })
  @ApiResponse({ status: 200, description: 'List of supported leagues' })
  async getSupportedLeagues() {
    try {
      return {
        success: true,
        data: this.espnFootballService.getSupportedLeagues(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get supported leagues: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scoreboard/:leagueCode')
  @ApiOperation({ summary: 'Get scoreboard for a specific league' })
  @ApiParam({ name: 'leagueCode', description: 'ESPN league code (e.g., eng.1, esp.1)' })
  @ApiResponse({ status: 200, description: 'League scoreboard with matches' })
  async getScoreboard(@Param('leagueCode') leagueCode: string) {
    try {
      const data = await this.espnFootballService.getScoreboard(leagueCode);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get scoreboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('standings/:leagueCode')
  @ApiOperation({ summary: 'Get standings for a specific league' })
  @ApiParam({ name: 'leagueCode', description: 'ESPN league code (e.g., eng.1, esp.1)' })
  @ApiResponse({ status: 200, description: 'League standings' })
  async getStandings(@Param('leagueCode') leagueCode: string) {
    try {
      const data = await this.espnFootballService.getStandings(leagueCode);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get standings: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('teams/:leagueCode')
  @ApiOperation({ summary: 'Get teams for a specific league' })
  @ApiParam({ name: 'leagueCode', description: 'ESPN league code (e.g., eng.1, esp.1)' })
  @ApiResponse({ status: 200, description: 'League teams' })
  async getTeams(@Param('leagueCode') leagueCode: string) {
    try {
      const data = await this.espnFootballService.getTeams(leagueCode);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get teams: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('live-matches')
  @ApiOperation({ summary: 'Get all live matches across supported leagues' })
  @ApiResponse({ status: 200, description: 'Live matches data' })
  async getLiveMatches() {
    try {
      const data = await this.espnFootballService.getLiveMatches();
      return {
        success: true,
        data: {
          matches: data,
          count: data.length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get live matches: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('odds/:eventId/:competitionId')
  @ApiOperation({ summary: 'Get odds for a specific match' })
  @ApiParam({ name: 'eventId', description: 'ESPN event ID' })
  @ApiParam({ name: 'competitionId', description: 'ESPN competition ID' })
  @ApiQuery({ name: 'leagueCode', description: 'ESPN league code', required: true })
  @ApiResponse({ status: 200, description: 'Match odds data' })
  async getMatchOdds(
    @Param('eventId') eventId: string,
    @Param('competitionId') competitionId: string,
    @Query('leagueCode') leagueCode: string,
  ) {
    try {
      const data = await this.espnFootballService.getMatchOdds(eventId, competitionId, leagueCode);
      return {
        success: true,
        data: {
          odds: data,
          count: data.length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get match odds: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sync/:leagueCode')
  @ApiOperation({ summary: 'Sync ESPN data to database for a specific league' })
  @ApiParam({ name: 'leagueCode', description: 'ESPN league code (e.g., eng.1, esp.1)' })
  @ApiResponse({ status: 200, description: 'Sync operation result' })
  async syncLeagueData(@Param('leagueCode') leagueCode: string) {
    try {
      await this.espnFootballService.syncLeagueData(leagueCode);
      return {
        success: true,
        message: `Successfully synced data for league: ${leagueCode}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to sync league data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rate-limit')
  @ApiOperation({ summary: 'Get ESPN API rate limit status' })
  @ApiResponse({ status: 200, description: 'Rate limit information' })
  async getRateLimitStatus() {
    try {
      const data = await this.espnFootballService.getRateLimitStatus();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get rate limit status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check ESPN API health' })
  @ApiResponse({ status: 200, description: 'Health check result' })
  async healthCheck() {
    try {
      const isHealthy = await this.espnFootballService.healthCheck();
      return {
        success: true,
        data: {
          healthy: isHealthy,
          service: 'ESPN Football API',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: {
          healthy: false,
          service: 'ESPN Football API',
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
} 