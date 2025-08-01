import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { Role } from '../../common/enums/role.enum';
import { UnifiedFootballService } from './unified-football.service';

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
  availableForRoles: Role[];
}

@Injectable()
export class LiveSummaryService {
  private readonly logger = new Logger(LiveSummaryService.name);

  constructor(
    private readonly unifiedFootballService: UnifiedFootballService,
  ) {}

  async getLiveSummary(filter?: string, status?: string): Promise<LiveSummaryData> {
    try {
      this.logger.log('Fetching live summary data...');
      
      // Fetch real data from multiple leagues to get more matches
      const leagues = ['eng.1', 'esp.1', 'usa.1', 'ger.1', 'fra.1'];
      const allMatches: any[] = [];
      
      for (const league of leagues) {
        try {
          const leagueMatches = await this.unifiedFootballService.getUnifiedMatches(league, 5);
          this.logger.log(`Fetched ${leagueMatches.length} matches from ${league}`);
          allMatches.push(...leagueMatches);
        } catch (error) {
          this.logger.warn(`Failed to fetch matches from ${league}:`, error);
        }
      }
      
      this.logger.log(`Total matches fetched: ${allMatches.length}`);
      
      // Transform the data to match the expected format
      const transformedMatches = allMatches.map((match, index) => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        minute: match.status === 'live' ? 75 : undefined, // Mock minute for live matches
        status: match.status === 'LIVE' ? 'live' : 
               match.status === 'FINISHED' ? 'finished' : 'scheduled',
        confidence: Math.floor(Math.random() * 30) + 70, // Mock confidence for now
        league: match.league || 'Unknown League',
        drivers: [
          { 
            name: 'xG Differential', 
            value: Math.random() * 2 - 1, 
            impact: Math.random() > 0.5 ? 'positive' as const : 'negative' as const, 
            description: 'Expected goals analysis' 
          },
          { 
            name: 'Shot Conversion', 
            value: Math.random() * 20 + 10, 
            impact: 'neutral' as const, 
            description: 'Shot conversion rate' 
          },
        ],
        trendData: Array.from({ length: 10 }, () => Math.random() * 100),
      }));

      const systemStatus = await this.getSystemStatus();

      const result = {
        liveMatches: transformedMatches,
        lastUpdatedAt: Date.now(),
        totalMatches: transformedMatches.length,
        liveCount: transformedMatches.filter(m => m.status === 'live').length,
        systemStatus,
      };

      this.logger.log(`Live summary data prepared: ${result.totalMatches} total matches, ${result.liveCount} live matches`);
      
      return result;
    } catch (error) {
      this.logger.error('Error fetching live summary data:', error);
      throw error;
    }
  }

  async getSystemStatus() {
    try {
      const providers = [
        { name: 'ESPN API', status: 'online' as const, delay: 0 },
        { name: 'Live Data', status: 'online' as const, delay: 0 },
        { name: 'Predictions', status: 'online' as const, delay: 0 },
      ];

      // Check actual provider status (simplified for now)
      const hasOffline = providers.some(p => p.status === 'offline' as any);
      const hasDegraded = providers.some(p => p.status === 'degraded' as any);
      
      const overallStatus = hasOffline ? 'offline' : hasDegraded ? 'degraded' : 'online';

      return {
        status: overallStatus as 'online' | 'offline' | 'degraded',
        providers,
        lastUpdatedAt: Date.now(),
      };
    } catch (error) {
      this.logger.error('Error getting system status:', error);
      return {
        status: 'offline' as const,
        providers: [],
        lastUpdatedAt: Date.now(),
      };
    }
  }

  async getAvailableFilters(): Promise<QuickFilter[]> {
    const filters: QuickFilter[] = [
      {
        id: 'my_feed',
        label: 'My Feed',
        description: 'Personalized matches based on your preferences',
        proOnly: false,
        availableForRoles: [Role.MEMBER, Role.ANALYST, Role.ADMIN],
      },
      {
        id: 'live_value',
        label: 'Live Value (O/U)',
        description: 'Over/Under opportunities with high confidence',
        proOnly: true,
        availableForRoles: [Role.ANALYST, Role.ADMIN],
      },
      {
        id: 'second_half_momentum',
        label: '2nd Half Momentum',
        description: 'Teams gaining momentum in second half',
        proOnly: true,
        availableForRoles: [Role.ANALYST, Role.ADMIN],
      },
      {
        id: 'favorites_underperforming',
        label: 'Favorites Struggling',
        description: 'Top teams underperforming expectations',
        proOnly: true,
        availableForRoles: [Role.ANALYST, Role.ADMIN],
      },
      {
        id: 'comeback_potential',
        label: 'Comeback Potential',
        description: 'Matches with high comeback probability',
        proOnly: true,
        availableForRoles: [Role.ANALYST, Role.ADMIN],
      },
      {
        id: 'my_leagues',
        label: 'My Leagues',
        description: 'Matches from your followed leagues',
        proOnly: false,
        availableForRoles: [Role.MEMBER, Role.ANALYST, Role.ADMIN],
      },
    ];

    return filters;
  }

  private async fetchLiveData(): Promise<LiveSummaryData> {
    // Mock data for now - would integrate with actual data sources
    const mockMatches = [
      {
        id: '1',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        homeScore: 2,
        awayScore: 1,
        minute: 75,
        status: 'live',
        confidence: 85,
        league: 'Premier League',
        drivers: [
          { name: 'xG Differential', value: 1.8, impact: 'positive' as const, description: 'Expected goals favor home team' },
          { name: 'Shot Conversion', value: 16.7, impact: 'positive' as const, description: 'Above average conversion rate' },
        ],
        trendData: Array.from({ length: 10 }, () => Math.random() * 100),
      },
      {
        id: '2',
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        homeScore: 0,
        awayScore: 2,
        minute: 60,
        status: 'live',
        confidence: 78,
        league: 'La Liga',
        drivers: [
          { name: 'xG Differential', value: -0.5, impact: 'negative' as const, description: 'Expected goals favor away team' },
          { name: 'Possession Control', value: 45, impact: 'neutral' as const, description: 'Standard possession levels' },
        ],
        trendData: Array.from({ length: 10 }, () => Math.random() * 100),
      },
      {
        id: '3',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        homeScore: 1,
        awayScore: 1,
        minute: 30,
        status: 'live',
        confidence: 65,
        league: 'Bundesliga',
        drivers: [
          { name: 'xG Differential', value: 0.2, impact: 'positive' as const, description: 'Slight advantage to home team' },
          { name: 'Shot Conversion', value: 12.5, impact: 'neutral' as const, description: 'Average conversion rate' },
        ],
        trendData: Array.from({ length: 10 }, () => Math.random() * 100),
      },
    ];

    const systemStatus = await this.getSystemStatus();

    return {
      liveMatches: mockMatches,
      lastUpdatedAt: Date.now(),
      totalMatches: mockMatches.length,
      liveCount: mockMatches.filter(m => m.status === 'live').length,
      systemStatus,
    };
  }

  private applyFilters(data: LiveSummaryData, filter?: string, status?: string): LiveSummaryData {
    let filteredMatches = [...data.liveMatches];

    // Apply status filter
    if (status && status !== 'all') {
      filteredMatches = filteredMatches.filter(match => match.status === status);
    }

    // Apply quick filter
    if (filter) {
      switch (filter) {
        case 'live_value':
          filteredMatches = filteredMatches.filter(match => match.confidence && match.confidence > 75);
          break;
        case 'second_half_momentum':
          filteredMatches = filteredMatches.filter(match => 
            match.status === 'live' && match.minute && match.minute > 45
          );
          break;
        case 'favorites_underperforming':
          filteredMatches = filteredMatches.filter(match => 
            match.homeScore !== undefined && match.awayScore !== undefined && 
            match.homeScore < match.awayScore
          );
          break;
        case 'comeback_potential':
          filteredMatches = filteredMatches.filter(match => 
            match.status === 'live' && match.minute && match.minute > 45 &&
            match.homeScore !== undefined && match.awayScore !== undefined &&
            Math.abs(match.homeScore - match.awayScore) <= 1
          );
          break;
        case 'my_feed':
        case 'my_leagues':
          // For now, show all matches. Later filter by user preferences
          break;
      }
    }

    return {
      ...data,
      liveMatches: filteredMatches,
      totalMatches: filteredMatches.length,
      liveCount: filteredMatches.filter(m => m.status === 'live').length,
    };
  }
} 