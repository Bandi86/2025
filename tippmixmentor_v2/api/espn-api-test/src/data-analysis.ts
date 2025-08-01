import { ESPNApiClient, LEAGUES, Logger } from './index.js';
import fs from 'fs';

/**
 * ESPN API Football Data Analysis
 * 
 * This script analyzes the structure of football data from ESPN API
 * and identifies what data can be saved to the TippMixMentor database.
 */

class ESPNFootballDataAnalyzer {
  private espnClient: ESPNApiClient;
  private logger: Logger;
  private analysisResults: any = {};

  constructor() {
    this.espnClient = new ESPNApiClient({
      rateLimit: {
        requestsPerSecond: 1,
        requestsPerMinute: 60,
      },
      cache: {
        enabled: true,
        ttl: 300000,
      },
    });

    this.logger = Logger.getInstance();
    this.logger.setLevel('info');
  }

  /**
   * Analyze scoreboard data structure
   */
  async analyzeScoreboardData() {
    console.log('\n🔍 Analyzing Scoreboard Data Structure...\n');

    const leagues = [
      LEAGUES.SOCCER.PREMIER_LEAGUE,
      LEAGUES.SOCCER.LA_LIGA,
      LEAGUES.SOCCER.SERIE_A,
      LEAGUES.SOCCER.BUNDESLIGA,
      LEAGUES.SOCCER.CHAMPIONS_LEAGUE,
    ];

    for (const league of leagues) {
      try {
        console.log(`📊 Analyzing ${league.name} (${league.code})...`);
        
        const scoreboard = await this.espnClient.getScoreboard('soccer', league.code);
        const events = scoreboard.data?.events || [];
        
        if (events.length > 0) {
          const sampleEvent = events[0];
          const competition = sampleEvent.competitions?.[0];
          
          console.log(`   ✅ Found ${events.length} events`);
          console.log(`   📅 Sample Event: ${sampleEvent.name}`);
          console.log(`   🏟️  Status: ${sampleEvent.status?.type?.description}`);
          console.log(`   📍 Date: ${sampleEvent.date}`);
          
          if (competition) {
            const competitors = competition.competitors || [];
            console.log(`   👥 Competitors: ${competitors.length}`);
            
            for (const comp of competitors) {
              console.log(`      ${comp.homeAway}: ${comp.team?.displayName} (ID: ${comp.team?.id})`);
              if (comp.score) {
                console.log(`         Score: ${comp.score}`);
              }
            }
            
            // Analyze odds data
            const odds = competition.odds || [];
            console.log(`   🎲 Odds Providers: ${odds.length}`);
            for (const odd of odds) {
              console.log(`      ${odd.provider?.name}: ${odd.details}`);
              if (odd.overUnder) {
                console.log(`         Over/Under: ${odd.overUnder}`);
              }
            }
          }
          
          // Save sample data for detailed analysis
          this.analysisResults[league.code] = {
            league: league.name,
            eventsCount: events.length,
            sampleEvent: sampleEvent,
            dataStructure: this.analyzeDataStructure(sampleEvent),
          };
        } else {
          console.log(`   ⚠️  No events found for ${league.name}`);
        }
        
        console.log('');
        
      } catch (error: any) {
        console.log(`   ❌ Error analyzing ${league.name}: ${error.message}`);
      }
    }
  }

  /**
   * Analyze standings data structure
   */
  async analyzeStandingsData() {
    console.log('\n📈 Analyzing Standings Data Structure...\n');

    const leagues = [
      LEAGUES.SOCCER.PREMIER_LEAGUE,
      LEAGUES.SOCCER.LA_LIGA,
    ];

    for (const league of leagues) {
      try {
        console.log(`🏆 Analyzing ${league.name} Standings...`);
        
        const standings = await this.espnClient.getStandings('soccer', league.code);
        const groups = standings.data?.groups || [];
        
        console.log(`   📊 Groups: ${groups.length}`);
        
        for (const group of groups) {
          console.log(`   📋 ${group.name}: ${group.standings?.length || 0} teams`);
          
          if (group.standings && group.standings.length > 0) {
            const sampleTeam = group.standings[0];
            console.log(`   🏅 Sample Team: ${sampleTeam.team?.displayName}`);
            console.log(`      Rank: ${sampleTeam.rank}`);
            console.log(`      Record: ${sampleTeam.wins}W ${sampleTeam.losses}L ${sampleTeam.ties || 0}D`);
            console.log(`      Points: ${sampleTeam.pointsFor || 'N/A'}`);
            console.log(`      Games Played: ${sampleTeam.gamesPlayed}`);
            console.log(`      Win %: ${sampleTeam.winPercentage}`);
          }
        }
        
        this.analysisResults[`${league.code}_standings`] = {
          league: league.name,
          groups: groups,
          dataStructure: this.analyzeDataStructure(standings.data),
        };
        
        console.log('');
        
      } catch (error: any) {
        console.log(`   ❌ Error analyzing ${league.name} standings: ${error.message}`);
      }
    }
  }

  /**
   * Analyze team data structure
   */
  async analyzeTeamData() {
    console.log('\n🏆 Analyzing Team Data Structure...\n');

    try {
      console.log('📋 Analyzing La Liga Teams...');
      
      const teams = await this.espnClient.getTeams('soccer', LEAGUES.SOCCER.LA_LIGA.code);
      const teamList = teams.data?.sports?.[0]?.leagues?.[0]?.teams || [];
      
      console.log(`   👥 Total Teams: ${teamList.length}`);
      
      if (teamList.length > 0) {
        const sampleTeam = teamList[0];
        console.log(`   🏅 Sample Team: ${sampleTeam.team?.displayName}`);
        console.log(`      ID: ${sampleTeam.team?.id}`);
        console.log(`      Abbreviation: ${sampleTeam.team?.abbreviation}`);
        console.log(`      Location: ${sampleTeam.team?.location}`);
        console.log(`      Nickname: ${sampleTeam.team?.nickname}`);
        console.log(`      Color: ${sampleTeam.team?.color}`);
        console.log(`      Logo: ${sampleTeam.team?.logo}`);
        
        if (sampleTeam.team?.record) {
          console.log(`      Record: ${sampleTeam.team.record.wins}W ${sampleTeam.team.record.losses}L ${sampleTeam.team.record.ties || 0}D`);
        }
      }
      
      this.analysisResults['teams'] = {
        totalTeams: teamList.length,
        sampleTeam: teamList[0],
        dataStructure: this.analyzeDataStructure(teams.data),
      };
      
      console.log('');
      
    } catch (error: any) {
      console.log(`   ❌ Error analyzing teams: ${error.message}`);
    }
  }

  /**
   * Analyze live match data
   */
  async analyzeLiveMatchData() {
    console.log('\n⚽ Analyzing Live Match Data...\n');

    try {
      // Get events from multiple leagues to find live matches
      const leagues = [
        LEAGUES.SOCCER.PREMIER_LEAGUE,
        LEAGUES.SOCCER.LA_LIGA,
        LEAGUES.SOCCER.SERIE_A,
        LEAGUES.SOCCER.BUNDESLIGA,
      ];

      let liveMatches = [];
      let scheduledMatches = [];
      let completedMatches = [];

      for (const league of leagues) {
        const scoreboard = await this.espnClient.getScoreboard('soccer', league.code);
        const events = scoreboard.data?.events || [];
        
        for (const event of events) {
          const status = event.status?.type?.description?.toLowerCase() || '';
          
          if (status.includes('live') || status.includes('in progress')) {
            liveMatches.push({ league: league.name, event });
          } else if (status.includes('scheduled') || status.includes('upcoming')) {
            scheduledMatches.push({ league: league.name, event });
          } else if (status.includes('final') || status.includes('full time')) {
            completedMatches.push({ league: league.name, event });
          }
        }
      }

      console.log(`🟢 Live Matches: ${liveMatches.length}`);
      console.log(`⏰ Scheduled Matches: ${scheduledMatches.length}`);
      console.log(`✅ Completed Matches: ${completedMatches.length}`);

      if (liveMatches.length > 0) {
        console.log('\n🟢 Sample Live Match:');
        const liveMatch = liveMatches[0];
        console.log(`   League: ${liveMatch.league}`);
        console.log(`   Match: ${liveMatch.event.name}`);
        console.log(`   Status: ${liveMatch.event.status?.type?.description}`);
        console.log(`   Date: ${liveMatch.event.date}`);
        
        const competition = liveMatch.event.competitions?.[0];
        if (competition) {
          const competitors = competition.competitors || [];
          for (const comp of competitors) {
            console.log(`   ${comp.homeAway}: ${comp.team?.displayName} - ${comp.score || '0'}`);
          }
        }
      }

      this.analysisResults['liveData'] = {
        liveMatches: liveMatches.length,
        scheduledMatches: scheduledMatches.length,
        completedMatches: completedMatches.length,
        sampleLiveMatch: liveMatches[0],
        sampleScheduledMatch: scheduledMatches[0],
        sampleCompletedMatch: completedMatches[0],
      };
      
      console.log('');
      
    } catch (error: any) {
      console.log(`   ❌ Error analyzing live data: ${error.message}`);
    }
  }

  /**
   * Analyze odds and betting data
   */
  async analyzeOddsData() {
    console.log('\n🎲 Analyzing Odds and Betting Data...\n');

    try {
      // Get events with odds
      const scoreboard = await this.espnClient.getScoreboard('soccer', LEAGUES.SOCCER.PREMIER_LEAGUE.code);
      const events = scoreboard.data?.events || [];
      
      let eventsWithOdds = [];
      
      for (const event of events) {
        const competition = event.competitions?.[0];
        if (competition?.odds && competition.odds.length > 0) {
          eventsWithOdds.push(event);
        }
      }

      console.log(`📊 Events with Odds: ${eventsWithOdds.length}/${events.length}`);

      if (eventsWithOdds.length > 0) {
        const sampleEvent = eventsWithOdds[0];
        console.log('\n🎯 Sample Event with Odds:');
        console.log(`   Match: ${sampleEvent.name}`);
        
        const competition = sampleEvent.competitions?.[0];
        if (competition) {
          const odds = competition.odds || [];
          console.log(`   Odds Providers: ${odds.length}`);
          
          for (const odd of odds) {
            console.log(`   📈 ${odd.provider?.name}:`);
            console.log(`      Details: ${odd.details}`);
            console.log(`      Over/Under: ${odd.overUnder || 'N/A'}`);
            console.log(`      Money Line: ${odd.moneyLine || 'N/A'}`);
            console.log(`      Spread: ${odd.spread || 'N/A'}`);
          }
        }
      }

      this.analysisResults['oddsData'] = {
        eventsWithOdds: eventsWithOdds.length,
        totalEvents: events.length,
        sampleEventWithOdds: eventsWithOdds[0],
      };
      
      console.log('');
      
    } catch (error: any) {
      console.log(`   ❌ Error analyzing odds data: ${error.message}`);
    }
  }

  /**
   * Analyze data structure recursively
   */
  private analyzeDataStructure(obj: any, depth: number = 0): any {
    if (depth > 3) return '...'; // Limit depth to avoid infinite recursion
    
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return {
        type: 'array',
        length: obj.length,
        sample: this.analyzeDataStructure(obj[0], depth + 1),
      };
    }
    
    if (typeof obj === 'object') {
      const structure: any = { type: 'object' };
      for (const [key, value] of Object.entries(obj)) {
        structure[key] = {
          type: typeof value,
          value: typeof value === 'object' ? this.analyzeDataStructure(value, depth + 1) : value,
        };
      }
      return structure;
    }
    
    return {
      type: typeof obj,
      value: obj,
    };
  }

  /**
   * Generate database schema recommendations
   */
  generateDatabaseSchema() {
    console.log('\n🗄️ Database Schema Recommendations\n');
    console.log('Based on the ESPN API data analysis, here are the recommended database tables:\n');

    console.log('1. 📊 LEAGUES Table');
    console.log('   - id (UUID, Primary Key)');
    console.log('   - espn_id (String, ESPN League Code)');
    console.log('   - name (String, League Name)');
    console.log('   - country (String, Country)');
    console.log('   - sport (String, "soccer")');
    console.log('   - season (Integer, Current Season)');
    console.log('   - is_active (Boolean)');
    console.log('   - created_at (Timestamp)');
    console.log('   - updated_at (Timestamp)');

    console.log('\n2. 🏆 TEAMS Table');
    console.log('   - id (UUID, Primary Key)');
    console.log('   - espn_id (String, ESPN Team ID)');
    console.log('   - league_id (UUID, Foreign Key to LEAGUES)');
    console.log('   - name (String, Team Name)');
    console.log('   - display_name (String, Display Name)');
    console.log('   - abbreviation (String, Team Abbreviation)');
    console.log('   - location (String, City/Location)');
    console.log('   - nickname (String, Team Nickname)');
    console.log('   - color (String, Primary Color)');
    console.log('   - logo_url (String, Logo URL)');
    console.log('   - is_active (Boolean)');
    console.log('   - created_at (Timestamp)');
    console.log('   - updated_at (Timestamp)');

    console.log('\n3. ⚽ MATCHES Table');
    console.log('   - id (UUID, Primary Key)');
    console.log('   - espn_id (String, ESPN Event ID)');
    console.log('   - league_id (UUID, Foreign Key to LEAGUES)');
    console.log('   - home_team_id (UUID, Foreign Key to TEAMS)');
    console.log('   - away_team_id (UUID, Foreign Key to TEAMS)');
    console.log('   - match_date (Timestamp)');
    console.log('   - status (String, "scheduled", "live", "completed")');
    console.log('   - home_score (Integer)');
    console.log('   - away_score (Integer)');
    console.log('   - competition_id (String, ESPN Competition ID)');
    console.log('   - venue (String, Stadium/Venue)');
    console.log('   - created_at (Timestamp)');
    console.log('   - updated_at (Timestamp)');

    console.log('\n4. 📈 STANDINGS Table');
    console.log('   - id (UUID, Primary Key)');
    console.log('   - league_id (UUID, Foreign Key to LEAGUES)');
    console.log('   - team_id (UUID, Foreign Key to TEAMS)');
    console.log('   - season (Integer)');
    console.log('   - rank (Integer)');
    console.log('   - wins (Integer)');
    console.log('   - losses (Integer)');
    console.log('   - ties (Integer)');
    console.log('   - points_for (Integer)');
    console.log('   - points_against (Integer)');
    console.log('   - games_played (Integer)');
    console.log('   - win_percentage (Decimal)');
    console.log('   - streak (String)');
    console.log('   - created_at (Timestamp)');
    console.log('   - updated_at (Timestamp)');

    console.log('\n5. 🎲 ODDS Table');
    console.log('   - id (UUID, Primary Key)');
    console.log('   - match_id (UUID, Foreign Key to MATCHES)');
    console.log('   - provider (String, "ESPN BET", "Bet 365", etc.)');
    console.log('   - odds_type (String, "money_line", "spread", "over_under")');
    console.log('   - home_odds (Decimal)');
    console.log('   - away_odds (Decimal)');
    console.log('   - draw_odds (Decimal, if applicable)');
    console.log('   - spread (Decimal)');
    console.log('   - over_under (Decimal)');
    console.log('   - details (String, Raw odds details)');
    console.log('   - is_live (Boolean)');
    console.log('   - created_at (Timestamp)');
    console.log('   - updated_at (Timestamp)');

    console.log('\n6. 📊 TEAM_STATISTICS Table');
    console.log('   - id (UUID, Primary Key)');
    console.log('   - team_id (UUID, Foreign Key to TEAMS)');
    console.log('   - league_id (UUID, Foreign Key to LEAGUES)');
    console.log('   - season (Integer)');
    console.log('   - stat_type (String, "goals", "assists", "clean_sheets", etc.)');
    console.log('   - stat_value (Decimal)');
    console.log('   - stat_display_value (String)');
    console.log('   - created_at (Timestamp)');
    console.log('   - updated_at (Timestamp)');
  }

  /**
   * Generate integration recommendations
   */
  generateIntegrationRecommendations() {
    console.log('\n🔗 Integration Recommendations\n');

    console.log('1. 📡 Data Synchronization Strategy');
    console.log('   - Use the ESPN API module for real-time data fetching');
    console.log('   - Implement scheduled jobs for regular data updates');
    console.log('   - Cache frequently accessed data to reduce API calls');
    console.log('   - Use WebSocket connections for live match updates');

    console.log('\n2. 🕐 Update Frequencies');
    console.log('   - Live Matches: Every 30 seconds during live games');
    console.log('   - Odds Data: Every 2-5 minutes');
    console.log('   - Standings: Every hour');
    console.log('   - Team Data: Daily');
    console.log('   - League Data: Weekly');

    console.log('\n3. 🎯 Available Championships');
    console.log('   ✅ Premier League (eng.1) - England');
    console.log('   ✅ La Liga (esp.1) - Spain');
    console.log('   ✅ Serie A (ita.1) - Italy');
    console.log('   ✅ Bundesliga (ger.1) - Germany');
    console.log('   ✅ Ligue 1 (fra.1) - France');
    console.log('   ✅ UEFA Champions League (uefa.champions) - Europe');
    console.log('   ✅ UEFA Europa League (uefa.europa) - Europe');
    console.log('   ✅ Major League Soccer (usa.1) - USA');

    console.log('\n4. ⚡ Live Data Availability');
    console.log('   ✅ Live Match Scores');
    console.log('   ✅ Live Match Statistics');
    console.log('   ✅ Live Odds Updates');
    console.log('   ✅ Match Status Changes');
    console.log('   ✅ Team Lineups');
    console.log('   ✅ Match Events (goals, cards, etc.)');

    console.log('\n5. 🎲 Betting Data Available');
    console.log('   ✅ Money Line Odds');
    console.log('   ✅ Point Spread');
    console.log('   ✅ Over/Under Totals');
    console.log('   ✅ Multiple Providers (ESPN BET, Bet 365)');
    console.log('   ✅ Live Odds Movement');
    console.log('   ✅ Historical Odds Data');
  }

  /**
   * Save analysis results to file
   */
  saveAnalysisResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `espn_football_analysis_${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(this.analysisResults, null, 2));
    console.log(`\n💾 Analysis results saved to: ${filename}`);
  }

  /**
   * Run complete analysis
   */
  async runCompleteAnalysis() {
    console.log('🏈 ESPN Football Data Analysis\n');
    console.log('This analysis examines the structure of football data from ESPN API');
    console.log('and provides recommendations for database integration.\n');

    await this.analyzeScoreboardData();
    await this.analyzeStandingsData();
    await this.analyzeTeamData();
    await this.analyzeLiveMatchData();
    await this.analyzeOddsData();

    this.generateDatabaseSchema();
    this.generateIntegrationRecommendations();
    this.saveAnalysisResults();

    console.log('\n✅ Analysis completed successfully!');
    console.log('📋 Check the generated JSON file for detailed data structures.');
  }
}

// Run the analysis
async function runAnalysis() {
  const analyzer = new ESPNFootballDataAnalyzer();
  await analyzer.runCompleteAnalysis();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalysis();
}

export { ESPNFootballDataAnalyzer, runAnalysis }; 