import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpStatus,
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
import { FootballDataService } from './football-data.service';

@ApiTags('football-data')
@Controller('football-data')
export class FootballDataController {
  constructor(private readonly footballDataService: FootballDataService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get Football-Data.org data status' })
  @ApiResponse({
    status: 200,
    description: 'Football data status retrieved successfully',
  })
  async getStatus() {
    return this.footballDataService.getStatus();
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get matches data' })
  @ApiResponse({
    status: 200,
    description: 'Matches data retrieved successfully',
  })
  @ApiQuery({ name: 'competition', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMatches(
    @Query('competition') competition?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.footballDataService.getMatches(competition, status, limit);
  }

  @Get('standings/:competition')
  @ApiOperation({ summary: 'Get standings for a competition' })
  @ApiResponse({
    status: 200,
    description: 'Standings retrieved successfully',
  })
  @ApiParam({ name: 'competition', description: 'Competition code (e.g., PL, CL)' })
  async getStandings(@Param('competition') competition: string) {
    return this.footballDataService.getStandings(competition);
  }

  @Get('scorers/:competition')
  @ApiOperation({ summary: 'Get top scorers for a competition' })
  @ApiResponse({
    status: 200,
    description: 'Scorers data retrieved successfully',
  })
  @ApiParam({ name: 'competition', description: 'Competition code (e.g., PL, CL)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getScorers(
    @Param('competition') competition: string,
    @Query('limit') limit?: number,
  ) {
    return this.footballDataService.getScorers(competition, limit);
  }

  @Get('teams/:competition')
  @ApiOperation({ summary: 'Get teams for a competition' })
  @ApiResponse({
    status: 200,
    description: 'Teams data retrieved successfully',
  })
  @ApiParam({ name: 'competition', description: 'Competition code (e.g., PL, CL)' })
  async getTeams(@Param('competition') competition: string) {
    return this.footballDataService.getTeams(competition);
  }

  @Get('competitions')
  @ApiOperation({ summary: 'Get available competitions' })
  @ApiResponse({
    status: 200,
    description: 'Competitions list retrieved successfully',
  })
  async getCompetitions() {
    return this.footballDataService.getCompetitions();
  }

  @Post('download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download Football-Data.org data' })
  @ApiResponse({
    status: 200,
    description: 'Download started successfully',
  })
  @ApiQuery({ name: 'competitions', required: false, type: [String] })
  @ApiQuery({ name: 'force', required: false, type: Boolean })
  async downloadData(
    @Query('competitions') competitions?: string[],
    @Query('force') force?: boolean,
  ) {
    return this.footballDataService.downloadData(competitions, force);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get download logs' })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
  })
  @ApiQuery({ name: 'lines', required: false, type: Number })
  async getLogs(@Query('lines') lines?: number) {
    return this.footballDataService.getDownloadLogs(lines);
  }

  @Get('info')
  @ApiOperation({ summary: 'Get Football-Data.org information' })
  @ApiResponse({
    status: 200,
    description: 'Information retrieved successfully',
  })
  async getInfo() {
    return this.footballDataService.getInfo();
  }
} 