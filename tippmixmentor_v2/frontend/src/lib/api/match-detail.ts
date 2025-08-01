import { apiClient } from '../api-client';

export interface MatchDetail {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  status: 'live' | 'finished' | 'scheduled';
  confidence?: number;
  league?: string;
  venue?: string;
  referee?: string;
  attendance?: number;
  homeTeamStats?: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    corners: number;
    fouls: number;
  };
  awayTeamStats?: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    corners: number;
    fouls: number;
  };
  drivers?: Array<{
    name: string;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  trendData?: number[];
}

export interface MatchAnalytics {
  xG: {
    home: number;
    away: number;
  };
  possession: {
    home: number;
    away: number;
  };
  shots: {
    home: number;
    away: number;
  };
  momentum: {
    home: number;
    away: number;
  };
  pressure: {
    home: number;
    away: number;
  };
}

export interface MatchPrediction {
  id: string;
  type: string;
  prediction: string;
  confidence: number;
  odds: number;
  stake: number;
  potentialWin: number;
  reasoning: string[];
}

export class MatchDetailService {
  static async getMatchDetail(id: string): Promise<MatchDetail> {
    const response = await apiClient.get(`/api/matches/${id}`);
    return response as MatchDetail;
  }

  static async getMatchAnalytics(id: string): Promise<MatchAnalytics> {
    const response = await apiClient.get(`/api/matches/${id}/analytics`);
    return response as MatchAnalytics;
  }

  static async getMatchPredictions(id: string): Promise<MatchPrediction[]> {
    const response = await apiClient.get(`/api/matches/${id}/predictions`);
    return response as MatchPrediction[];
  }
} 