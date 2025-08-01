import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ESPNFootballService } from './espn-football.service';
import { ApiFootballService } from './api-football.service';
import { FootballDataService } from './football-data.service';
import { UnifiedFootballService } from './unified-football.service';

@Injectable()
export class FootballDataSyncService {
  private readonly logger = new Logger(FootballDataSyncService.name);

  // Supported leagues for synchronization
  private readonly supportedLeagues = [
    { name: 'Premier League', code: 'PL', espnCode: 'eng.1', apiFootballId: 39 },
    { name: 'La Liga', code: 'PD', espnCode: 'esp.1', apiFootballId: 140 },
    { name: 'Serie A', code: 'SA', espnCode: 'ita.1', apiFootballId: 135 },
    { name: 'Bundesliga', code: 'BL1', espnCode: 'ger.1', apiFootballId: 78 },
    { name: 'Ligue 1', code: 'FL1', espnCode: 'fra.1', apiFootballId: 61 },
    { name: 'Champions League', code: 'CL', espnCode: 'uefa.champions', apiFootballId: 2 },
    { name: 'Europa League', code: 'EL', espnCode: 'uefa.europa', apiFootballId: 3 },
  ];

  constructor(
    private readonly espnFootballService: ESPNFootballService,
    private readonly apiFootballService: ApiFootballService,
    private readonly footballDataService: FootballDataService,
    private readonly unifiedFootballService: UnifiedFootballService,
  ) {}

  /**
   * Sync live match data every 30 seconds during live games
   * This is the highest priority sync for real-time data
   */
  @Cron('*/30 * * * * *') // Every 30 seconds
  async syncLiveMatches() {
    try {
      this.logger.debug('Starting live matches sync...');
      
      // Get live matches from ESPN (most reliable for live data)
      const liveMatches = await this.espnFootballService.getLiveMatches();
      
      if (liveMatches.length > 0) {
        this.logger.log(`Found ${liveMatches.length} live matches`);
        
        // Process each live match
        for (const match of liveMatches) {
          try {
            // Update match data in database
            await this.updateLiveMatchData(match);
          } catch (error) {
            this.logger.error(`Error updating live match ${match.id}: ${error.message}`);
          }
        }
        
        // TODO: Broadcast live matches via WebSocket (moved to gateway)
      }
    } catch (error) {
      this.logger.error(`Error in live matches sync: ${error.message}`);
    }
  }

  /**
   * Sync odds data every 2-5 minutes
   * This includes betting odds from ESPN and other sources
   */
  @Cron('0 */2 * * * *') // Every 2 minutes
  async syncOddsData() {
    try {
      this.logger.debug('Starting odds data sync...');
      
      // Get live matches to update odds
      const liveMatches = await this.espnFootballService.getLiveMatches();
      
      for (const match of liveMatches) {
        try {
          const competition = match.competitions?.[0];
          if (competition?.odds && competition.odds.length > 0) {
            await this.updateMatchOdds(match.id, competition.id, match.competitions[0].id);
          }
        } catch (error) {
          this.logger.error(`Error updating odds for match ${match.id}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in odds data sync: ${error.message}`);
    }
  }

  /**
   * Sync standings data every hour
   * This includes league tables and team positions
   */
  @Cron('0 0 * * * *') // Every hour
  async syncStandingsData() {
    try {
      this.logger.log('Starting standings data sync...');
      
      for (const league of this.supportedLeagues) {
        try {
          // Sync ESPN standings (most reliable)
          await this.espnFootballService.syncLeagueData(league.espnCode);
          
          // Also sync API-Football standings as backup
          await this.apiFootballService.syncLeagueData(league.apiFootballId, new Date().getFullYear());
          
          // TODO: Broadcast standings update via WebSocket (moved to gateway)
          
          this.logger.log(`Synced standings for ${league.name}`);
        } catch (error) {
          this.logger.error(`Error syncing standings for ${league.name}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in standings data sync: ${error.message}`);
    }
  }

  /**
   * Sync team data daily
   * This includes team information, rosters, and basic team data
   */
  @Cron('0 0 0 * * *') // Daily at midnight
  async syncTeamData() {
    try {
      this.logger.log('Starting team data sync...');
      
      for (const league of this.supportedLeagues) {
        try {
          // Sync teams from ESPN
          await this.espnFootballService.getTeams(league.espnCode);
          
          // Sync teams from API-Football
          await this.apiFootballService.getTeams(league.apiFootballId, new Date().getFullYear());
          
          this.logger.log(`Synced team data for ${league.name}`);
        } catch (error) {
          this.logger.error(`Error syncing team data for ${league.name}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in team data sync: ${error.message}`);
    }
  }

  /**
   * Sync league data weekly
   * This includes league information and season data
   */
  @Cron('0 0 0 * * 0') // Weekly on Sunday at midnight
  async syncLeagueData() {
    try {
      this.logger.log('Starting league data sync...');
      
      for (const league of this.supportedLeagues) {
        try {
          // Sync league data from all sources
          await this.espnFootballService.syncLeagueData(league.espnCode);
          await this.apiFootballService.syncLeagueData(league.apiFootballId, new Date().getFullYear());
          
          this.logger.log(`Synced league data for ${league.name}`);
        } catch (error) {
          this.logger.error(`Error syncing league data for ${league.name}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in league data sync: ${error.message}`);
    }
  }

  /**
   * Manual sync for a specific league
   */
  async manualSyncLeague(leagueCode: string) {
    try {
      this.logger.log(`Starting manual sync for league: ${leagueCode}`);
      
      const league = this.supportedLeagues.find(l => l.code === leagueCode);
      if (!league) {
        throw new Error(`Unsupported league: ${leagueCode}`);
      }

      // Sync all data for the league
      await this.espnFootballService.syncLeagueData(league.espnCode);
      await this.apiFootballService.syncLeagueData(league.apiFootballId, new Date().getFullYear());
      
      this.logger.log(`Completed manual sync for ${league.name}`);
      
      return {
        success: true,
        message: `Successfully synced data for ${league.name}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error in manual sync for ${leagueCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sync status for all APIs
   */
  async getSyncStatus() {
    try {
      const [espnHealth, apiFootballHealth, footballDataHealth] = await Promise.allSettled([
        this.espnFootballService.healthCheck(),
        this.apiFootballService.getRateLimitStatus(),
        this.footballDataService.getStatus(),
      ]);

      return {
        espn: {
          status: espnHealth.status === 'fulfilled' && espnHealth.value ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
        },
        apiFootball: {
          status: apiFootballHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
          rateLimit: apiFootballHealth.status === 'fulfilled' ? apiFootballHealth.value : null,
          lastCheck: new Date().toISOString(),
        },
        footballData: {
          status: footballDataHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
        },
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting sync status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update live match data in database
   */
  private async updateLiveMatchData(match: any) {
    // This would update the match data in the database
    // Implementation depends on your database schema
    this.logger.debug(`Updating live match data for: ${match.name}`);
  }

  /**
   * Update match odds in database
   */
  private async updateMatchOdds(eventId: string, competitionId: string, leagueCode: string) {
    // This would update the odds data in the database
    // Implementation depends on your database schema
    this.logger.debug(`Updating odds for match: ${eventId}`);
  }

  /**
   * Get data quality report
   */
  async getDataQualityReport() {
    return this.unifiedFootballService.getDataQualityReport();
  }
} 