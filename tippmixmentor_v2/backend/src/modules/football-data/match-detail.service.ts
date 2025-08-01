import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

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

@Injectable()
export class MatchDetailService {
  private readonly logger = new Logger(MatchDetailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getMatchDetail(id: string): Promise<MatchDetail> {
    try {
      // Check cache first
      const cached = await this.redis.get(`match_detail_${id}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch fresh data
      const matchDetail = await this.fetchMatchDetail(id);
      
      // Cache for 60 seconds
      await this.redis.setex(`match_detail_${id}`, 60, JSON.stringify(matchDetail));
      
      return matchDetail;
    } catch (error) {
      this.logger.error(`Error fetching match detail for ID ${id}:`, error);
      throw new NotFoundException(`Match with ID ${id} not found`);
    }
  }

  async getMatchAnalytics(id: string): Promise<MatchAnalytics> {
    try {
      // Check cache first
      const cached = await this.redis.get(`match_analytics_${id}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch fresh analytics
      const analytics = await this.fetchMatchAnalytics(id);
      
      // Cache for 30 seconds
      await this.redis.setex(`match_analytics_${id}`, 30, JSON.stringify(analytics));
      
      return analytics;
    } catch (error) {
      this.logger.error(`Error fetching match analytics for ID ${id}:`, error);
      throw new NotFoundException(`Analytics for match ${id} not found`);
    }
  }

  async getMatchPredictions(id: string): Promise<MatchPrediction[]> {
    try {
      // Check cache first
      const cached = await this.redis.get(`match_predictions_${id}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch fresh predictions
      const predictions = await this.fetchMatchPredictions(id);
      
      // Cache for 60 seconds
      await this.redis.setex(`match_predictions_${id}`, 60, JSON.stringify(predictions));
      
      return predictions;
    } catch (error) {
      this.logger.error(`Error fetching match predictions for ID ${id}:`, error);
      throw new NotFoundException(`Predictions for match ${id} not found`);
    }
  }

  private async fetchMatchDetail(id: string): Promise<MatchDetail> {
    // Mock data for now - would integrate with actual data sources
    const mockDetails: Record<string, MatchDetail> = {
      '1': {
        id: '1',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        homeScore: 2,
        awayScore: 1,
        minute: 75,
        status: 'live',
        confidence: 85,
        league: 'Premier League',
        venue: 'Old Trafford',
        referee: 'Michael Oliver',
        attendance: 75000,
        homeTeamStats: {
          possession: 55,
          shots: 12,
          shotsOnTarget: 5,
          corners: 6,
          fouls: 8
        },
        awayTeamStats: {
          possession: 45,
          shots: 8,
          shotsOnTarget: 3,
          corners: 4,
          fouls: 12
        },
        drivers: [
          {
            name: 'xG Differential',
            value: 1.8,
            impact: 'positive',
            description: 'Expected goals favor home team'
          },
          {
            name: 'Shot Conversion',
            value: 16.7,
            impact: 'positive',
            description: 'Above average conversion rate'
          },
          {
            name: 'Possession Control',
            value: 55,
            impact: 'neutral',
            description: 'Standard possession levels'
          }
        ],
        trendData: Array.from({ length: 20 }, () => Math.random() * 100)
      },
      '2': {
        id: '2',
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        homeScore: 0,
        awayScore: 2,
        minute: 60,
        status: 'live',
        confidence: 78,
        league: 'La Liga',
        venue: 'Camp Nou',
        referee: 'Jesus Gil Manzano',
        attendance: 95000,
        homeTeamStats: {
          possession: 65,
          shots: 15,
          shotsOnTarget: 4,
          corners: 8,
          fouls: 6
        },
        awayTeamStats: {
          possession: 35,
          shots: 6,
          shotsOnTarget: 3,
          corners: 2,
          fouls: 15
        },
        drivers: [
          {
            name: 'xG Differential',
            value: -0.5,
            impact: 'negative',
            description: 'Expected goals favor away team'
          },
          {
            name: 'Possession Control',
            value: 65,
            impact: 'neutral',
            description: 'High possession but low conversion'
          }
        ],
        trendData: Array.from({ length: 20 }, () => Math.random() * 100)
      }
    };

    const matchDetail = mockDetails[id];
    if (!matchDetail) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return matchDetail;
  }

  private async fetchMatchAnalytics(id: string): Promise<MatchAnalytics> {
    // Mock analytics data
    return {
      xG: {
        home: 2.1,
        away: 1.3,
      },
      possession: {
        home: 55,
        away: 45,
      },
      shots: {
        home: 12,
        away: 8,
      },
      momentum: {
        home: 0.7,
        away: 0.3,
      },
      pressure: {
        home: 0.8,
        away: 0.4,
      },
    };
  }

  private async fetchMatchPredictions(id: string): Promise<MatchPrediction[]> {
    // Mock predictions data
    return [
      {
        id: '1',
        type: 'Match Winner',
        prediction: 'Home Win',
        confidence: 78,
        odds: 2.1,
        stake: 100,
        potentialWin: 110,
        reasoning: [
          'Home team has 55% possession',
          'xG differential favors home team (2.1 vs 1.3)',
          'Home team has higher shot conversion rate'
        ]
      },
      {
        id: '2',
        type: 'Over/Under',
        prediction: 'Over 2.5 Goals',
        confidence: 65,
        odds: 1.8,
        stake: 100,
        potentialWin: 80,
        reasoning: [
          'Both teams have high xG values',
          'Historical data shows high scoring in this fixture',
          'Current match tempo supports over prediction'
        ]
      }
    ];
  }
} 