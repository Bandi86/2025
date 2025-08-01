import { apiClient } from '../api-client';

export interface LiveSummaryData {
  liveMatches: any[];
  lastUpdatedAt: number;
  totalMatches: number;
  liveCount: number;
  systemStatus: {
    status: 'online' | 'offline' | 'degraded';
    providers: {
      name: string;
      status: 'online' | 'offline' | 'degraded';
      delay?: number;
    }[];
  };
}

export interface QuickFilter {
  id: string;
  label: string;
  description: string;
  proOnly: boolean;
  availableForRoles: string[];
}

export class LiveSummaryService {
  static async getLiveSummary(filter?: string, status?: string): Promise<LiveSummaryData> {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (status) params.append('status', status);

    const response = await apiClient.get(`/live-summary?${params.toString()}`);
    return response as LiveSummaryData;
  }

  static async getSystemStatus() {
    const response = await apiClient.get('/live-summary/status');
    return response as any;
  }

  static async getAvailableFilters(): Promise<QuickFilter[]> {
    const response = await apiClient.get('/live-summary/filters');
    return response as QuickFilter[];
  }
} 