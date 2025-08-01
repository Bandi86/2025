import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  Logger,
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
import { UnifiedFootballService } from './unified-football.service';

@ApiTags('unified-football')
@Controller('unified-football')
export class UnifiedFootballController {
  private readonly logger = new Logger(UnifiedFootballController.name);

  constructor(private readonly unifiedFootballService: UnifiedFootballService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint for unified football controller' })
  @ApiResponse({
    status: 200,
    description: 'Test response',
  })
  async test() {
    this.logger.log('Unified football test endpoint called');
    return {
      message: 'Unified football controller is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get unified matches from both APIs' })
  @ApiResponse({
    status: 200,
    description: 'Unified matches retrieved successfully',
  })
  @ApiQuery({ name: 'competition', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUnifiedMatches(
    @Query('competition') competition: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`Unified matches request received for competition: ${competition}, limit: ${limit}`);
    
    try {
      const matches = await this.unifiedFootballService.getUnifiedMatches(competition, limit);
      this.logger.log(`Unified matches service returned ${matches.length} matches`);
      
      return {
        matches,
        count: matches.length,
        competition,
        sources: [...new Set(matches.map(m => m.source))],
      };
    } catch (error) {
      this.logger.error(`Error in unified matches controller: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('standings')
  @ApiOperation({ summary: 'Get unified standings from both APIs' })
  @ApiResponse({
    status: 200,
    description: 'Unified standings retrieved successfully',
  })
  @ApiQuery({ name: 'competition', required: true, type: String })
  async getUnifiedStandings(@Query('competition') competition: string) {
    const standings = await this.unifiedFootballService.getUnifiedStandings(competition);
    return {
      standings,
      count: standings.length,
      competition,
      sources: [...new Set(standings.map(s => s.source))],
    };
  }

  @Get('scorers')
  @ApiOperation({ summary: 'Get unified scorers from both APIs' })
  @ApiResponse({
    status: 200,
    description: 'Unified scorers retrieved successfully',
  })
  @ApiQuery({ name: 'competition', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUnifiedScorers(
    @Query('competition') competition: string,
    @Query('limit') limit?: number,
  ) {
    const scorers = await this.unifiedFootballService.getUnifiedScorers(competition, limit);
    return {
      scorers,
      count: scorers.length,
      competition,
      sources: [...new Set(scorers.map(s => s.source))],
    };
  }

  @Get('quality-report')
  @ApiOperation({ summary: 'Get data quality report for both APIs' })
  @ApiResponse({
    status: 200,
    description: 'Data quality report retrieved successfully',
  })
  async getDataQualityReport() {
    return this.unifiedFootballService.getDataQualityReport();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get unified football service status' })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully',
  })
  async getStatus() {
    const qualityReport = await this.unifiedFootballService.getDataQualityReport();
    return {
      service: 'Unified Football Data',
      status: qualityReport.mergedDataQuality > 0.5 ? 'active' : 'degraded',
      qualityReport,
      timestamp: new Date().toISOString(),
    };
  }
} 