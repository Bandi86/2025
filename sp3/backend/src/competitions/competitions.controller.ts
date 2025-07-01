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
import { CompetitionsService } from './competitions.service';
import {
  CreateCompetitionDto,
  UpdateCompetitionDto,
  CompetitionFilters,
  PaginatedResponse,
  CompetitionResponse,
} from '../common/types';

@Controller('api/competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createCompetitionDto: CreateCompetitionDto,
  ): Promise<CompetitionResponse> {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Get()
  findAll(
    @Query() filters: CompetitionFilters,
  ): Promise<PaginatedResponse<CompetitionResponse>> {
    return this.competitionsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CompetitionResponse> {
    return this.competitionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompetitionDto: UpdateCompetitionDto,
  ): Promise<CompetitionResponse> {
    return this.competitionsService.update(id, updateCompetitionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.competitionsService.remove(id);
  }

  @Get(':id/table')
  getLeagueTable(
    @Param('id') id: string,
    @Query('matchday') matchday?: string,
  ) {
    const matchdayNumber = matchday ? parseInt(matchday, 10) : undefined;
    return this.competitionsService.getLeagueTable(id, matchdayNumber);
  }

  @Get(':id/matches')
  getMatches(@Param('id') id: string, @Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    return this.competitionsService.getMatches(id, limitNumber);
  }
}
