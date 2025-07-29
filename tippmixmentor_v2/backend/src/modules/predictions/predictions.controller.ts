import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
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
import { PredictionsService } from './predictions.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { PredictionResponseDto } from './dto/prediction-response.dto';

@ApiTags('predictions')
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user predictions' })
  @ApiResponse({
    status: 200,
    description: 'User predictions retrieved successfully',
    type: [PredictionResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'matchId', required: false, type: String })
  async getUserPredictions(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('matchId') matchId?: string,
  ) {
    return this.predictionsService.getUserPredictions(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      matchId,
    });
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get predictions for a specific match' })
  @ApiResponse({
    status: 200,
    description: 'Match predictions retrieved successfully',
    type: [PredictionResponseDto],
  })
  async getMatchPredictions(@Param('matchId') matchId: string) {
    return this.predictionsService.getMatchPredictions(matchId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user prediction statistics' })
  @ApiResponse({
    status: 200,
    description: 'User prediction statistics retrieved successfully',
  })
  async getUserStats(@Request() req) {
    return this.predictionsService.getUserStats(req.user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get prediction leaderboard' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(@Query('limit') limit = 10) {
    return this.predictionsService.getLeaderboard(Number(limit));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new prediction' })
  @ApiResponse({
    status: 201,
    description: 'Prediction created successfully',
    type: PredictionResponseDto,
  })
  async create(@Request() req, @Body() createPredictionDto: CreatePredictionDto) {
    return this.predictionsService.create(req.user.id, createPredictionDto);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple predictions' })
  @ApiResponse({
    status: 201,
    description: 'Batch predictions created successfully',
    type: [PredictionResponseDto],
  })
  async createBatch(
    @Request() req,
    @Body() createPredictionDtos: CreatePredictionDto[],
  ) {
    return this.predictionsService.createBatch(req.user.id, createPredictionDtos);
  }

  @Post('analyze/:matchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze match for prediction insights' })
  @ApiResponse({
    status: 200,
    description: 'Match analysis completed successfully',
  })
  async analyzeMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.analyzeMatch(matchId);
  }

  @Post('update-results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update prediction results' })
  @ApiResponse({
    status: 200,
    description: 'Prediction results updated successfully',
  })
  async updateResults(@Request() req) {
    return this.predictionsService.updateResults(req.user.id);
  }

  // New ML Integration Endpoints
  @Get('ml/status')
  @ApiOperation({ summary: 'Get ML service status' })
  @ApiResponse({
    status: 200,
    description: 'ML service status retrieved successfully',
  })
  async getMLServiceStatus() {
    return this.predictionsService.getMLServiceStatus();
  }

  @Get('ml/models/info')
  @ApiOperation({ summary: 'Get ML model information' })
  @ApiResponse({
    status: 200,
    description: 'Model information retrieved successfully',
  })
  async getModelInfo() {
    return this.predictionsService.getModelInfo();
  }

  @Get('ml/models/status')
  @ApiOperation({ summary: 'Get ML model status' })
  @ApiResponse({
    status: 200,
    description: 'Model status retrieved successfully',
  })
  async getModelStatus() {
    return this.predictionsService.getModelStatus();
  }

  @Post('ml/train')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Train ML models' })
  @ApiResponse({
    status: 200,
    description: 'Model training started successfully',
  })
  async trainModels() {
    return this.predictionsService.trainModels();
  }

  @Post('ml/batch-predict')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform batch predictions' })
  @ApiResponse({
    status: 200,
    description: 'Batch predictions completed successfully',
  })
  async batchPredict(@Body() body: { matchIds: string[] }) {
    return this.predictionsService.batchPredict(body.matchIds);
  }

  @Get('accuracy')
  @ApiOperation({ summary: 'Get prediction accuracy statistics' })
  @ApiResponse({
    status: 200,
    description: 'Accuracy statistics retrieved successfully',
  })
  async getPredictionAccuracy() {
    return this.predictionsService.getPredictionAccuracy();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent predictions' })
  @ApiResponse({
    status: 200,
    description: 'Recent predictions retrieved successfully',
    type: [PredictionResponseDto],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentPredictions(@Query('limit') limit = 10) {
    return this.predictionsService.getRecentPredictions(Number(limit));
  }
} 