import { ESPNApiClient, LEAGUES, Logger } from './index.js';

/**
 * Integration Example for TippMixMentor Project
 * 
 * This example shows how to integrate the ESPN API module with the main
 * football prediction system to fetch live data for predictions and analysis.
 */

class TippMixMentorESPNIntegration {
  private espnClient: ESPNApiClient;
  private logger: Logger;

  constructor() {
    this.espnClient = new ESPNApiClient({
      rateLimit: {
        requestsPerSecond: 1, // Conservative for production
        requestsPerMinute: 60,
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
      },
    });

    this.logger = Logger.getInstance();
    this.logger.setLevel('info');
  }

  /**
   * Fetch live match data for prediction analysis
   */
  async getLiveMatchData() {
    this.logger.info('Fetching live match data for predictions...');

    const soccerLeagues = [
      LEAGUES.SOCCER.PREMIER_LEAGUE,
      LEAGUES.SOCCER.LA_LIGA,
      LEAGUES.SOCCER.SERIE_A,
      LEAGUES.SOCCER.BUNDESLIGA,
    ];

    const matchData = [];

    for (const league of soccerLeagues) {
      try {
        const scoreboard = await this.espnClient.getScoreboard('soccer', league.code);
        const events = scoreboard.data?.events || [];

        for (const event of events) {
          const competition = event.competitions?.[0];
          if (!competition) continue;

          const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')?.team;
          const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')?.team;
          const odds = competition.odds || [];

          if (homeTeam && awayTeam) {
            matchData.push({
              league: league.name,
              leagueCode: league.code,
              eventId: event.id,
              match: `${homeTeam.displayName} vs ${awayTeam.displayName}`,
              homeTeam: {
                id: homeTeam.id,
                name: homeTeam.displayName,
                abbreviation: homeTeam.abbreviation,
              },
              awayTeam: {
                id: awayTeam.id,
                name: awayTeam.displayName,
                abbreviation: awayTeam.abbreviation,
              },
              status: event.status?.type?.description || 'unknown',
              date: event.date,
              odds: odds.map((odd: any) => ({
                provider: odd.provider?.name,
                details: odd.details,
                overUnder: odd.overUnder,
                moneyLine: odd.moneyLine,
              })),
              competitionId: competition.id,
            });
          }
        }
      } catch (error: any) {
        this.logger.error(`Error fetching data for ${league.name}:`, error.message);
      }
    }

    return matchData;
  }

  /**
   * Fetch team statistics for analysis
   */
  async getTeamStatistics(teamId: string, leagueCode: string) {
    try {
      const stats = await this.espnClient.getTeamStats('soccer', leagueCode, teamId);
      return stats.data;
    } catch (error: any) {
      this.logger.error(`Error fetching team stats for ${teamId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch odds data for betting analysis
   */
  async getOddsData(eventId: string, competitionId: string, leagueCode: string) {
    try {
      const odds = await this.espnClient.getOdds('soccer', leagueCode, eventId, competitionId);
      return odds.data;
    } catch (error: any) {
      this.logger.error(`Error fetching odds for event ${eventId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch standings for league analysis
   */
  async getLeagueStandings(leagueCode: string) {
    try {
      const standings = await this.espnClient.getStandings('soccer', leagueCode);
      return standings.data;
    } catch (error: any) {
      this.logger.error(`Error fetching standings for ${leagueCode}:`, error.message);
      return null;
    }
  }

  /**
   * Get prediction data for a specific match
   */
  async getMatchPrediction(eventId: string, competitionId: string, leagueCode: string) {
    try {
      const predictor = await this.espnClient.getPredictor('soccer', leagueCode, eventId, competitionId);
      return predictor.data;
    } catch (error: any) {
      this.logger.error(`Error fetching prediction for event ${eventId}:`, error.message);
      return null;
    }
  }

  /**
   * Comprehensive data collection for prediction model
   */
  async collectPredictionData() {
    this.logger.info('Starting comprehensive data collection for prediction model...');

    const predictionData: any = {
      matches: [],
      standings: {},
      teamStats: {},
      odds: {},
      predictions: {},
      timestamp: new Date().toISOString(),
    };

    // 1. Get live match data
    const matches = await this.getLiveMatchData();
    predictionData.matches = matches;

    // 2. Get standings for each league
    const leagues = [...new Set(matches.map((m: any) => m.leagueCode))];
    for (const leagueCode of leagues) {
      const standings = await this.getLeagueStandings(leagueCode);
      if (standings) {
        predictionData.standings[leagueCode] = standings;
      }
    }

    // 3. Get team statistics for teams in matches
    const teamIds = new Set<string>();
    matches.forEach((match: any) => {
      teamIds.add(match.homeTeam.id);
      teamIds.add(match.awayTeam.id);
    });

    for (const teamId of teamIds) {
      // Find the league for this team
      const match = matches.find((m: any) => 
        m.homeTeam.id === teamId || m.awayTeam.id === teamId
      );
      
      if (match) {
        const stats = await this.getTeamStatistics(teamId, match.leagueCode);
        if (stats) {
          predictionData.teamStats[teamId] = stats;
        }
      }
    }

    // 4. Get odds data for matches
    for (const match of matches) {
      const odds = await this.getOddsData(match.eventId, match.competitionId, match.leagueCode);
      if (odds) {
        predictionData.odds[match.eventId] = odds;
      }
    }

    // 5. Get predictions for matches
    for (const match of matches) {
      const prediction = await this.getMatchPrediction(match.eventId, match.competitionId, match.leagueCode);
      if (prediction) {
        predictionData.predictions[match.eventId] = prediction;
      }
    }

    this.logger.info(`Data collection completed. Collected data for ${matches.length} matches.`);
    return predictionData;
  }

  /**
   * Health check for the integration
   */
  async healthCheck() {
    try {
      const isHealthy = await this.espnClient.healthCheck();
      const cacheStats = this.espnClient.getCacheStats();
      
      return {
        healthy: isHealthy,
        cacheSize: cacheStats.size,
        cacheKeys: cacheStats.keys.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error('Health check failed:', error.message);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.espnClient.getCacheStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.espnClient.clearCache();
    this.logger.info('Cache cleared');
  }
}

// Example usage
async function runIntegrationExample() {
  console.log('🏈 TippMixMentor ESPN Integration Example\n');

  const integration = new TippMixMentorESPNIntegration();

  try {
    // Health check
    console.log('1. 🔍 Health Check');
    const health = await integration.healthCheck();
    console.log(`   Status: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   Cache: ${health.cacheSize} entries\n`);

    if (!health.healthy) {
      console.log('❌ Integration is not healthy, stopping example');
      return;
    }

    // Get live match data
    console.log('2. ⚽ Live Match Data');
    const matches = await integration.getLiveMatchData();
    console.log(`   Found ${matches.length} matches across leagues\n`);

    // Show sample match data
    if (matches.length > 0) {
      const sampleMatch = matches[0];
      console.log('   Sample Match:');
      console.log(`     ${sampleMatch.match}`);
      console.log(`     League: ${sampleMatch.league}`);
      console.log(`     Status: ${sampleMatch.status}`);
      console.log(`     Odds: ${sampleMatch.odds.length} providers\n`);
    }

    // Get comprehensive prediction data
    console.log('3. 📊 Comprehensive Prediction Data');
    const predictionData = await integration.collectPredictionData();
    
    console.log(`   Matches: ${predictionData.matches.length}`);
    console.log(`   Standings: ${Object.keys(predictionData.standings).length} leagues`);
    console.log(`   Team Stats: ${Object.keys(predictionData.teamStats).length} teams`);
    console.log(`   Odds Data: ${Object.keys(predictionData.odds).length} matches`);
    console.log(`   Predictions: ${Object.keys(predictionData.predictions).length} matches\n`);

    // Cache statistics
    console.log('4. 💾 Cache Statistics');
    const cacheStats = integration.getCacheStats();
    console.log(`   Cache size: ${cacheStats.size} entries`);
    console.log(`   Cache keys: ${cacheStats.keys.length}\n`);

    console.log('✅ Integration example completed successfully!');
    console.log('📈 Ready for production use with TippMixMentor prediction system.');

  } catch (error: any) {
    console.error('❌ Integration example failed:', error.message);
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationExample();
}

export { TippMixMentorESPNIntegration, runIntegrationExample }; 