import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, TeamFilters } from '../common/types';

@ApiTags('teams')
@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'competitionId', required: false, type: String })
  @ApiQuery({ name: 'season', required: false, type: String })
  findAll(@Query() filters: TeamFilters) {
    // Convert string query params to proper types
    const processedFilters: TeamFilters = {
      ...filters,
      page: filters.page ? parseInt(filters.page as any, 10) : 1,
      limit: filters.limit ? parseInt(filters.limit as any, 10) : 20,
    };
    return this.teamsService.findAll(processedFilters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Get(':id/form')
  @ApiOperation({ summary: 'Get team form (recent results)' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getForm(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.teamsService.getTeamForm(id, parsedLimit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
