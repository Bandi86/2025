import { apiClient } from '../api-client';

export interface Strategy {
  id: string;
  name: string;
  filterType: string;
  isActive: boolean;
  hitRate: number;
  roi: number;
  totalPredictions: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  leagues: string[];
  markets: string[];
  defaultFilter?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  onboardingCompleted: boolean;
}

export interface CreateStrategyDto {
  name: string;
  filterType: string;
  isActive?: boolean;
}

export interface UpdatePreferencesDto {
  leagues: string[];
  markets: string[];
  defaultFilter?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export class UserPreferencesService {
  static async getUserStrategies(): Promise<Strategy[]> {
    const response = await apiClient.get('/api/user-preferences/strategies');
    return response as Strategy[];
  }

  static async createStrategy(createStrategyDto: CreateStrategyDto): Promise<Strategy> {
    const response = await apiClient.post('/api/user-preferences/strategies', createStrategyDto);
    return response as Strategy;
  }

  static async updateStrategy(id: string, updateStrategyDto: CreateStrategyDto): Promise<Strategy> {
    const response = await apiClient.put(`/api/user-preferences/strategies/${id}`, updateStrategyDto);
    return response as Strategy;
  }

  static async getUserPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get('/api/user-preferences/preferences');
    return response as UserPreferences;
  }

  static async updateUserPreferences(updatePreferencesDto: UpdatePreferencesDto): Promise<UserPreferences> {
    const response = await apiClient.put('/api/user-preferences/preferences', updatePreferencesDto);
    return response as UserPreferences;
  }

  static async getOnboardingStatus(): Promise<any> {
    const response = await apiClient.get('/api/user-preferences/onboarding-status');
    return response as any;
  }

  static async followMatch(matchId: string) {
    const response = await apiClient.post(`/api/user-preferences/follow-match/${matchId}`, {});
    return response as any;
  }

  static async unfollowMatch(matchId: string) {
    const response = await apiClient.delete(`/api/user-preferences/follow-match/${matchId}`);
    return response as any;
  }

  static async getFollowedMatches() {
    const response = await apiClient.get('/api/user-preferences/followed-matches');
    return response as any;
  }

  static async deleteStrategy(strategyId: string): Promise<void> {
    await apiClient.delete(`/api/user-preferences/strategies/${strategyId}`);
  }
}