import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateStrategyDto, UpdatePreferencesDto } from './dto/user-preferences.dto';

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserStrategies(userId: string) {
    try {
      // For now, return mock data. Later integrate with actual database
      const mockStrategies = [
        {
          id: '1',
          name: 'High Confidence Plays',
          filterType: 'live_value',
          isActive: true,
          hitRate: 78,
          roi: 12.5,
          totalPredictions: 45,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Second Half Momentum',
          filterType: 'second_half_momentum',
          isActive: false,
          hitRate: 65,
          roi: 8.2,
          totalPredictions: 23,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-10'),
        },
      ];

      return mockStrategies;
    } catch (error) {
      this.logger.error('Error fetching user strategies:', error);
      throw error;
    }
  }

  async createStrategy(userId: string, createStrategyDto: CreateStrategyDto) {
    try {
      // For now, return mock response. Later integrate with actual database
      const newStrategy = {
        id: Date.now().toString(),
        name: createStrategyDto.name,
        filterType: createStrategyDto.filterType,
        isActive: createStrategyDto.isActive ?? true,
        hitRate: 0,
        roi: 0,
        totalPredictions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(`Strategy created for user ${userId}: ${createStrategyDto.name}`);
      return newStrategy;
    } catch (error) {
      this.logger.error('Error creating strategy:', error);
      throw error;
    }
  }

  async updateStrategy(userId: string, updateStrategyDto: CreateStrategyDto) {
    try {
      // For now, return mock response. Later integrate with actual database
      const updatedStrategy = {
        id: '1',
        name: updateStrategyDto.name,
        filterType: updateStrategyDto.filterType,
        isActive: updateStrategyDto.isActive ?? true,
        hitRate: 78,
        roi: 12.5,
        totalPredictions: 45,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      this.logger.log(`Strategy updated for user ${userId}: ${updateStrategyDto.name}`);
      return updatedStrategy;
    } catch (error) {
      this.logger.error('Error updating strategy:', error);
      throw error;
    }
  }

  async getUserPreferences(userId: string) {
    try {
      // For now, return mock data. Later integrate with actual database
      const mockPreferences = {
        leagues: ['1', '2', '3'], // Premier League, La Liga, Bundesliga
        markets: ['1', '2', '3'], // Match Winner, Over/Under, Both Teams to Score
        defaultFilter: 'my_feed',
        emailNotifications: true,
        pushNotifications: false,
        onboardingCompleted: true,
      };

      return mockPreferences;
    } catch (error) {
      this.logger.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId: string, updatePreferencesDto: UpdatePreferencesDto) {
    try {
      // For now, return mock response. Later integrate with actual database
      const updatedPreferences = {
        leagues: updatePreferencesDto.leagues,
        markets: updatePreferencesDto.markets,
        defaultFilter: updatePreferencesDto.defaultFilter || 'my_feed',
        emailNotifications: updatePreferencesDto.emailNotifications ?? true,
        pushNotifications: updatePreferencesDto.pushNotifications ?? false,
        onboardingCompleted: true,
      };

      this.logger.log(`Preferences updated for user ${userId}`);
      return updatedPreferences;
    } catch (error) {
      this.logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async getOnboardingStatus(userId: string) {
    try {
      // For now, return mock data. Later integrate with actual database
      const mockStatus = {
        completed: true,
        completedAt: new Date('2024-01-01'),
        steps: {
          leagues: true,
          markets: true,
          notifications: true,
        },
      };

      return mockStatus;
    } catch (error) {
      this.logger.error('Error fetching onboarding status:', error);
      throw error;
    }
  }

  async followMatch(userId: string, matchId: string) {
    try {
      // For now, return mock response. Later integrate with actual database
      this.logger.log(`User ${userId} followed match ${matchId}`);
      return { success: true, message: 'Match followed successfully' };
    } catch (error) {
      this.logger.error('Error following match:', error);
      throw error;
    }
  }

  async unfollowMatch(userId: string, matchId: string) {
    try {
      // For now, return mock response. Later integrate with actual database
      this.logger.log(`User ${userId} unfollowed match ${matchId}`);
      return { success: true, message: 'Match unfollowed successfully' };
    } catch (error) {
      this.logger.error('Error unfollowing match:', error);
      throw error;
    }
  }

  async getFollowedMatches(userId: string) {
    try {
      // For now, return mock data. Later integrate with actual database
      const mockFollowedMatches = [
        {
          id: '1',
          homeTeam: 'Manchester United',
          awayTeam: 'Liverpool',
          status: 'live',
          followedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          homeTeam: 'Barcelona',
          awayTeam: 'Real Madrid',
          status: 'scheduled',
          followedAt: new Date('2024-01-14'),
        },
      ];

      return mockFollowedMatches;
    } catch (error) {
      this.logger.error('Error fetching followed matches:', error);
      throw error;
    }
  }
} 