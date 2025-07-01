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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { PdfService } from '../pdf/pdf.service';
import {
  CreateMatchDto,
  UpdateMatchDto,
  MatchFilters,
  BulkCreateMatchesDto,
} from '../common/types';
import { MatchStatus } from '@prisma/client';

@ApiTags('matches')
@Controller('api/matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly pdfService: PdfService,
  ) {}

  // ========================================
  // CRUD ENDPOINTS
  // ========================================

  @Post()
  @ApiOperation({ summary: 'Create a new match' })
  @ApiResponse({ status: 201, description: 'Match created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all matches with filtering and pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'competitionId',
    required: false,
    type: String,
    description: 'Filter by competition',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    type: String,
    description: 'Filter by team (home or away)',
  })
  @ApiQuery({
    name: 'season',
    required: false,
    type: String,
    description: 'Filter by season (e.g., 2024/25)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MatchStatus,
    description: 'Filter by match status',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter from date (ISO string)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter to date (ISO string)',
  })
  @ApiQuery({
    name: 'round',
    required: false,
    type: Number,
    description: 'Filter by round number',
  })
  @ApiQuery({
    name: 'matchday',
    required: false,
    type: Number,
    description: 'Filter by matchday',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['date', 'createdAt', 'homeTeam', 'awayTeam'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  findAll(@Query() filters: MatchFilters) {
    return this.matchesService.findAll(filters);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming matches' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of matches to return (default: 10)',
  })
  getUpcoming(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.matchesService.getUpcomingMatches(parsedLimit);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent finished matches' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of matches to return (default: 10)',
  })
  getRecent(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.matchesService.getRecentMatches(parsedLimit);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get matches for a specific team' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of matches to return (default: 20)',
  })
  getMatchesByTeam(
    @Param('teamId') teamId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.matchesService.getMatchesByTeam(teamId, parsedLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific match by ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match found' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a match' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match updated successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a match' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 204, description: 'Match deleted successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create matches (e.g., from PDF extraction)' })
  @ApiResponse({ status: 201, description: 'Bulk operation completed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  bulkCreate(@Body() bulkCreateDto: BulkCreateMatchesDto) {
    return this.matchesService.bulkCreate(bulkCreateDto);
  }

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload PDF file for match extraction' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'PDF processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or processing error' })
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('season') season?: string,
    @Body('autoCreateTeams') autoCreateTeams?: string,
    @Body('autoCreateCompetitions') autoCreateCompetitions?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // PDF feldolgozás opciók
    const options = {
      season: season || '2024/25',
      autoCreateTeams: autoCreateTeams === 'true',
      autoCreateCompetitions: autoCreateCompetitions === 'true',
    };

    try {
      const result = await this.pdfService.processPdfFile(
        file.buffer,
        file.originalname,
        options,
      );

      return {
        success: result.success,
        message: result.message,
        filename: file.originalname,
        size: file.size,
        extractedMatches: result.extractedMatches?.length || 0,
        createdMatches: result.createdMatches || 0,
        errors: result.errors,
      };
    } catch (error) {
      throw new BadRequestException(`PDF processing failed: ${error.message}`);
    }
  }

  @Post('process-pdf-directory')
  @ApiOperation({ summary: 'Process all PDF files in the default directory' })
  @ApiResponse({
    status: 201,
    description: 'PDF directory processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Directory processing error' })
  async processPdfDirectory(
    @Body('directoryPath') directoryPath?: string,
    @Body('season') season?: string,
  ) {
    try {
      const results = await this.pdfService.processAllPdfsInDirectory(
        directoryPath || '/home/bandi/Documents/code/2025/sp3/pdf',
      );

      const summary = {
        totalPdfs: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        totalMatchesCreated: results.reduce(
          (sum, r) => sum + (r.createdMatches || 0),
          0,
        ),
        results: results,
      };

      return {
        success: true,
        message: `Batch PDF processing completed: ${summary.successful}/${summary.totalPdfs} successful`,
        summary,
      };
    } catch (error) {
      throw new BadRequestException(
        `Directory processing failed: ${error.message}`,
      );
    }
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get matches overview statistics' })
  async getOverviewStats() {
    // TODO: Implement comprehensive statistics
    // This could include match counts by status, recent trends, etc.
    return {
      message: 'Statistics endpoint - to be implemented',
      // Example structure:
      // totalMatches: number,
      // upcomingMatches: number,
      // liveMatches: number,
      // finishedMatches: number,
      // byCompetition: {...},
      // byStatus: {...}
    };
  }

  @Get('stats/competition/:competitionId')
  @ApiOperation({ summary: 'Get statistics for a specific competition' })
  @ApiParam({ name: 'competitionId', description: 'Competition ID' })
  async getCompetitionStats(@Param('competitionId') competitionId: string) {
    // TODO: Implement competition-specific statistics
    return {
      message: `Competition ${competitionId} statistics - to be implemented`,
    };
  }
}
