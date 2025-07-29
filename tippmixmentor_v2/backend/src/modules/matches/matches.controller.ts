import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all matches with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of matches retrieved successfully',
    type: [MatchResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'leagueId', required: false, type: String })
  @ApiQuery({ name: 'teamId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'LIVE', 'FINISHED'] })
  @ApiQuery({ name: 'date', required: false, type: String })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('leagueId') leagueId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.matchesService.findAll({
      page: Number(page),
      limit: Number(limit),
      leagueId,
      teamId,
      status,
      date,
    });
  }

  @Get('live')
  @ApiOperation({ summary: 'Get all live matches' })
  @ApiResponse({
    status: 200,
    description: 'Live matches retrieved successfully',
    type: [MatchResponseDto],
  })
  async getLiveMatches() {
    return this.matchesService.getLiveMatches();
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s matches' })
  @ApiResponse({
    status: 200,
    description: 'Today\'s matches retrieved successfully',
    type: [MatchResponseDto],
  })
  async getTodayMatches() {
    return this.matchesService.getTodayMatches();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiResponse({
    status: 200,
    description: 'Match retrieved successfully',
    type: MatchResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get match statistics' })
  @ApiResponse({
    status: 200,
    description: 'Match statistics retrieved successfully',
  })
  async getMatchStats(@Param('id') id: string) {
    return this.matchesService.getMatchStats(id);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get match events' })
  @ApiResponse({
    status: 200,
    description: 'Match events retrieved successfully',
  })
  async getMatchEvents(@Param('id') id: string) {
    return this.matchesService.getMatchEvents(id);
  }

  @Get(':id/predictions')
  @ApiOperation({ summary: 'Get predictions for a match' })
  @ApiResponse({
    status: 200,
    description: 'Match predictions retrieved successfully',
  })
  async getMatchPredictions(@Param('id') id: string) {
    return this.matchesService.getMatchPredictions(id);
  }

  @Get(':id/lineups')
  @ApiOperation({ summary: 'Get match lineups' })
  @ApiResponse({
    status: 200,
    description: 'Match lineups retrieved successfully',
  })
  async getMatchLineups(@Param('id') id: string) {
    return this.matchesService.getMatchLineups(id);
  }

  @Get(':id/player-stats')
  @ApiOperation({ summary: 'Get player statistics for a match' })
  @ApiResponse({
    status: 200,
    description: 'Player statistics retrieved successfully',
  })
  async getMatchPlayerStats(@Param('id') id: string) {
    return this.matchesService.getMatchPlayerStats(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new match' })
  @ApiResponse({
    status: 201,
    description: 'Match created successfully',
    type: MatchResponseDto,
  })
  async create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a match' })
  @ApiResponse({
    status: 200,
    description: 'Match updated successfully',
    type: MatchResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a match' })
  @ApiResponse({
    status: 200,
    description: 'Match deleted successfully',
  })
  async remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }

  // Teams endpoints
  @Get('teams')
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({
    status: 200,
    description: 'Teams retrieved successfully',
  })
  @ApiQuery({ name: 'leagueId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getTeams(
    @Query('leagueId') leagueId?: string,
    @Query('search') search?: string,
  ) {
    return this.matchesService.getTeams({ leagueId, search });
  }

  @Get('teams/:id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiResponse({
    status: 200,
    description: 'Team retrieved successfully',
  })
  async getTeam(@Param('id') id: string) {
    return this.matchesService.getTeam(id);
  }

  @Get('teams/:id/matches')
  @ApiOperation({ summary: 'Get team matches' })
  @ApiResponse({
    status: 200,
    description: 'Team matches retrieved successfully',
  })
  @ApiQuery({ name: 'season', required: false, type: String })
  async getTeamMatches(
    @Param('id') id: string,
    @Query('season') season?: string,
  ) {
    return this.matchesService.getTeamMatches(id, season);
  }

  @Get('teams/:id/stats')
  @ApiOperation({ summary: 'Get team statistics' })
  @ApiResponse({
    status: 200,
    description: 'Team statistics retrieved successfully',
  })
  @ApiQuery({ name: 'season', required: false, type: String })
  async getTeamStats(
    @Param('id') id: string,
    @Query('season') season?: string,
  ) {
    return this.matchesService.getTeamStats(id, season);
  }

  // Leagues endpoints
  @Get('leagues')
  @ApiOperation({ summary: 'Get all leagues' })
  @ApiResponse({
    status: 200,
    description: 'Leagues retrieved successfully',
  })
  @ApiQuery({ name: 'country', required: false, type: String })
  async getLeagues(@Query('country') country?: string) {
    return this.matchesService.getLeagues(country);
  }

  @Get('leagues/:id')
  @ApiOperation({ summary: 'Get league by ID' })
  @ApiResponse({
    status: 200,
    description: 'League retrieved successfully',
  })
  async getLeague(@Param('id') id: string) {
    return this.matchesService.getLeague(id);
  }

  @Get('leagues/:id/standings')
  @ApiOperation({ summary: 'Get league standings' })
  @ApiResponse({
    status: 200,
    description: 'League standings retrieved successfully',
  })
  @ApiQuery({ name: 'season', required: false, type: String })
  async getLeagueStandings(
    @Param('id') id: string,
    @Query('season') season?: string,
  ) {
    return this.matchesService.getLeagueStandings(id, season);
  }

  @Get('leagues/:id/matches')
  @ApiOperation({ summary: 'Get league matches' })
  @ApiResponse({
    status: 200,
    description: 'League matches retrieved successfully',
  })
  @ApiQuery({ name: 'season', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'LIVE', 'FINISHED'] })
  async getLeagueMatches(
    @Param('id') id: string,
    @Query('season') season?: string,
    @Query('status') status?: string,
  ) {
    return this.matchesService.getLeagueMatches(id, season, status);
  }

  // Venues endpoints
  @Get('venues')
  @ApiOperation({ summary: 'Get all venues' })
  @ApiResponse({
    status: 200,
    description: 'Venues retrieved successfully',
  })
  async getVenues() {
    return this.matchesService.getVenues();
  }

  @Get('venues/:id')
  @ApiOperation({ summary: 'Get venue by ID' })
  @ApiResponse({
    status: 200,
    description: 'Venue retrieved successfully',
  })
  async getVenue(@Param('id') id: string) {
    return this.matchesService.getVenue(id);
  }

  @Get('venues/:id/matches')
  @ApiOperation({ summary: 'Get venue matches' })
  @ApiResponse({
    status: 200,
    description: 'Venue matches retrieved successfully',
  })
  async getVenueMatches(@Param('id') id: string) {
    return this.matchesService.getVenueMatches(id);
  }
} 