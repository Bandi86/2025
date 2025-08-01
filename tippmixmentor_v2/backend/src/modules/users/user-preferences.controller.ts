import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateStrategyDto, UpdatePreferencesDto } from './dto/user-preferences.dto';

@ApiTags('User Preferences')
@Controller('api/user-preferences')
// @UseGuards(JwtAuthGuard)
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get('strategies')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user strategies' })
  @ApiResponse({ status: 200, description: 'User strategies retrieved successfully' })
  async getUserStrategies(@Request() req) {
    return this.userPreferencesService.getUserStrategies(req.user?.id || 'mock-user');
  }

  @Post('strategies')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new strategy' })
  @ApiResponse({ status: 201, description: 'Strategy created successfully' })
  async createStrategy(@Request() req, @Body() createStrategyDto: CreateStrategyDto) {
    return this.userPreferencesService.createStrategy(req.user?.id || 'mock-user', createStrategyDto);
  }

  @Put('strategies/:id')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a strategy' })
  @ApiResponse({ status: 200, description: 'Strategy updated successfully' })
  async updateStrategy(@Request() req, @Body() updateStrategyDto: CreateStrategyDto) {
    return this.userPreferencesService.updateStrategy(req.user?.id || 'mock-user', updateStrategyDto);
  }

  @Get('preferences')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved successfully' })
  async getUserPreferences(@Request() req) {
    return this.userPreferencesService.getUserPreferences(req.user?.id || 'mock-user');
  }

  @Put('preferences')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences updated successfully' })
  async updateUserPreferences(@Request() req, @Body() updatePreferencesDto: UpdatePreferencesDto) {
    return this.userPreferencesService.updateUserPreferences(req.user?.id || 'mock-user', updatePreferencesDto);
  }

  @Get('onboarding-status')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if user has completed onboarding' })
  @ApiResponse({ status: 200, description: 'Onboarding status retrieved successfully' })
  async getOnboardingStatus(@Request() req) {
    return this.userPreferencesService.getOnboardingStatus(req.user?.id || 'mock-user');
  }
} 