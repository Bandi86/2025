import { Injectable, Logger } from '@nestjs/common';
import { FootballDataService } from './football-data.service';
import { ApiFootballService } from './api-football.service';
import { ESPNFootballService } from './espn-football.service';
import { PrismaService } from '../../common/database/prisma.service';

export interface UnifiedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  date: string;
  league: string;
  source: 'football-data' | 'api-football' | 'espn' | 'merged';
  confidence: number; // 0-1, how confident we are in this data
  odds?: Array<{
    provider: string;
    details: string;
    overUnder?: number;
    spread?: number;
    homeOdds?: number;
    awayOdds?: number;
    drawOdds?: number;
  }>;
}

export interface UnifiedStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  source: 'football-data' | 'api-football' | 'espn' | 'merged';
  confidence: number;
}

export interface UnifiedScorer {
  player: string;
  team: string;
  goals: number;
  assists: number;
  source: 'football-data' | 'api-football' | 'espn' | 'merged';
  confidence: number;
}

@Injectable()
export class UnifiedFootballService {
  private readonly logger = new Logger(UnifiedFootballService.name);

  constructor(
    private readonly footballDataService: FootballDataService,
    private readonly apiFootballService: ApiFootballService,
    private readonly espnFootballService: ESPNFootballService,
    private readonly prisma: PrismaService,
  ) {}

  async getUnifiedMatches(competition: string, limit: number = 20): Promise<UnifiedMatch[]> {
    try {
      this.logger.log(`Starting unified matches request for competition: ${competition}`);
      
      // Only call ESPN service directly since FootballDataService goes to ML service
      const [apiFootballMatches, espnMatches] = await Promise.allSettled([
        this.getApiFootballMatchesForCompetition(competition, limit),
        this.getESPNMatchesForCompetition(competition, limit),
      ]);

      this.logger.log(`API Football status: ${apiFootballMatches.status}`);
      this.logger.log(`ESPN status: ${espnMatches.status}`);

      const matches: UnifiedMatch[] = [];

      // Process API-Football matches
      if (apiFootballMatches.status === 'fulfilled') {
        const afMatches = apiFootballMatches.value.response || [];
        this.logger.log(`API Football matches found: ${afMatches.length}`);
        for (const match of afMatches) {
          matches.push({
            id: `af_${match.fixture.id}`,
            homeTeam: match.teams.home.name,
            awayTeam: match.teams.away.name,
            homeScore: match.goals.home,
            awayScore: match.goals.away,
            status: this.mapApiFootballStatus(match.fixture.status.short),
            date: match.fixture.date,
            league: competition,
            source: 'api-football',
            confidence: 0.9,
          });
        }
      } else {
        this.logger.error(`API Football failed: ${apiFootballMatches.reason}`);
      }

      // Process ESPN matches - Fixed to handle ESPN data structure
      if (espnMatches.status === 'fulfilled') {
        const espnData = espnMatches.value;
        const events = espnData.events || [];
        this.logger.log(`ESPN events found: ${events.length}`);
        
        for (const event of events) {
          const homeTeam = event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');
          const awayTeam = event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
          
          if (homeTeam && awayTeam) {
            const odds = event.competitions?.[0]?.odds?.[0];
            
            matches.push({
              id: `espn_${event.id}`,
              homeTeam: homeTeam.team?.displayName || homeTeam.team?.name || 'Unknown',
              awayTeam: awayTeam.team?.displayName || awayTeam.team?.name || 'Unknown',
              homeScore: parseInt(homeTeam.score) || 0,
              awayScore: parseInt(awayTeam.score) || 0,
              status: event.status?.type?.state || 'scheduled',
              date: event.date,
              league: competition,
              source: 'espn',
              confidence: 0.85,
              odds: odds ? [{
                provider: odds.provider?.name || 'Unknown',
                details: `${homeTeam.team?.abbreviation} ${homeTeam.score} - ${awayTeam.score} ${awayTeam.team?.abbreviation}`,
                homeOdds: odds.homeOdds,
                awayOdds: odds.awayOdds,
                drawOdds: odds.drawOdds,
                overUnder: odds.overUnder,
              }] : undefined,
            });
          }
        }
      } else {
        this.logger.error(`ESPN failed: ${espnMatches.reason}`);
      }

      // Log the results for debugging
      this.logger.log(`Unified matches for ${competition}: ${matches.length} total matches`);
      this.logger.log(`Sources: ${[...new Set(matches.map(m => m.source))].join(', ')}`);

      // Merge and return matches
      return this.mergeMatches(matches);
    } catch (error) {
      this.logger.error(`Error getting unified matches for ${competition}:`, error);
      return [];
    }
  }

  async getUnifiedStandings(competition: string): Promise<UnifiedStanding[]> {
    try {
      const [footballDataStandings, apiFootballStandings, espnStandings] = await Promise.allSettled([
        this.footballDataService.getStandings(competition),
        this.getApiFootballStandingsForCompetition(competition),
        this.getESPNStandingsForCompetition(competition),
      ]);

      const standings: UnifiedStanding[] = [];

      // Process Football-Data.org standings
      if (footballDataStandings.status === 'fulfilled') {
        const fdStandings = footballDataStandings.value.standings || [];
        for (const standing of fdStandings) {
          standings.push({
            position: standing.position,
            team: standing.team.name,
            played: standing.playedGames,
            won: standing.won,
            drawn: standing.draw,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            points: standing.points,
            source: 'football-data',
            confidence: 0.8,
          });
        }
      }

      // Process API-Football standings
      if (apiFootballStandings.status === 'fulfilled') {
        const afStandings = apiFootballStandings.value.response || [];
        for (const standing of afStandings) {
          standings.push({
            position: standing.rank,
            team: standing.team.name,
            played: standing.all.played,
            won: standing.all.win,
            drawn: standing.all.draw,
            lost: standing.all.lose,
            goalsFor: standing.all.goals.for,
            goalsAgainst: standing.all.goals.against,
            points: standing.points,
            source: 'api-football',
            confidence: 0.9,
          });
        }
      }

      // Process ESPN standings
      if (espnStandings.status === 'fulfilled') {
        const espnGroups = espnStandings.value.groups || [];
        for (const group of espnGroups) {
          for (const standing of group.standings) {
            standings.push({
              position: standing.rank,
              team: standing.team.displayName,
              played: standing.gamesPlayed,
              won: standing.wins,
              drawn: standing.ties || 0,
              lost: standing.losses,
              goalsFor: standing.pointsFor,
              goalsAgainst: standing.pointsAgainst,
              points: standing.wins * 3 + (standing.ties || 0),
              source: 'espn',
              confidence: 0.95, // ESPN has high confidence due to real-time data
            });
          }
        }
      }

      // Merge and deduplicate standings
      return this.mergeStandings(standings);
    } catch (error) {
      this.logger.error(`Error getting unified standings: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUnifiedScorers(competition: string, limit: number = 10): Promise<UnifiedScorer[]> {
    try {
      const [footballDataScorers, apiFootballScorers] = await Promise.allSettled([
        this.footballDataService.getScorers(competition, limit),
        this.getApiFootballScorersForCompetition(competition, limit),
      ]);

      const scorers: UnifiedScorer[] = [];

      // Process Football-Data.org scorers
      if (footballDataScorers.status === 'fulfilled') {
        const fdScorers = footballDataScorers.value.scorers || [];
        for (const scorer of fdScorers) {
          scorers.push({
            player: scorer.player.name,
            team: scorer.team.name,
            goals: scorer.goals,
            assists: scorer.assists,
            source: 'football-data',
            confidence: 0.8,
          });
        }
      }

      // Process API-Football scorers
      if (apiFootballScorers.status === 'fulfilled') {
        const afScorers = apiFootballScorers.value.response || [];
        for (const scorer of afScorers) {
          if (scorer.statistics && scorer.statistics.length > 0) {
            const stats = scorer.statistics[0];
            scorers.push({
              player: scorer.player.name,
              team: stats.team.name,
              goals: stats.goals.total,
              assists: stats.goals.assists,
              source: 'api-football',
              confidence: 0.9,
            });
          }
        }
      }

      // Merge and deduplicate scorers
      return this.mergeScorers(scorers);
    } catch (error) {
      this.logger.error(`Error getting unified scorers: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getApiFootballMatchesForCompetition(competition: string, limit: number) {
    // Map competition codes to API-Football league IDs
    const leagueMap: Record<string, number> = {
      'PL': 39, // Premier League
      'CL': 2,  // Champions League
      'BL1': 78, // Bundesliga
      'SA': 135, // Serie A
      'PD': 140, // La Liga
      'FL1': 61, // Ligue 1
    };

    const leagueId = leagueMap[competition];
    if (!leagueId) {
      throw new Error(`Unknown competition: ${competition}`);
    }

    const currentSeason = new Date().getFullYear();
    return this.apiFootballService.getMatches(leagueId, currentSeason);
  }

  private async getApiFootballStandingsForCompetition(competition: string) {
    const leagueMap: Record<string, number> = {
      'PL': 39,
      'CL': 2,
      'BL1': 78,
      'SA': 135,
      'PD': 140,
      'FL1': 61,
    };

    const leagueId = leagueMap[competition];
    if (!leagueId) {
      throw new Error(`Unknown competition: ${competition}`);
    }

    const currentSeason = new Date().getFullYear();
    return this.apiFootballService.getStandings(leagueId, currentSeason);
  }

  private async getApiFootballScorersForCompetition(competition: string, limit: number) {
    const leagueMap: Record<string, number> = {
      'PL': 39,
      'CL': 2,
      'BL1': 78,
      'SA': 135,
      'PD': 140,
      'FL1': 61,
    };

    const leagueId = leagueMap[competition];
    if (!leagueId) {
      throw new Error(`Unknown competition: ${competition}`);
    }

    const currentSeason = new Date().getFullYear();
    return this.apiFootballService.getScorers(leagueId, currentSeason);
  }

  private async getESPNMatchesForCompetition(competition: string, limit: number) {
    // Map competition codes to ESPN league codes
    const leagueMapping: { [key: string]: string } = {
      'PL': 'eng.1', // Premier League
      'PD': 'esp.1', // La Liga
      'SA': 'ita.1', // Serie A
      'BL1': 'ger.1', // Bundesliga
      'FL1': 'fra.1', // Ligue 1
      'CL': 'uefa.champions', // Champions League
      'EL': 'uefa.europa', // Europa League
      // Direct ESPN codes
      'eng.1': 'eng.1', // Premier League
      'esp.1': 'esp.1', // La Liga
      'ita.1': 'ita.1', // Serie A
      'ger.1': 'ger.1', // Bundesliga
      'fra.1': 'fra.1', // Ligue 1
      'uefa.champions': 'uefa.champions', // Champions League
      'uefa.europa': 'uefa.europa', // Europa League
    };

    const leagueCode = leagueMapping[competition];
    if (!leagueCode) {
      this.logger.warn(`Unsupported competition for ESPN: ${competition}`);
      return { events: [] }; // Return empty result instead of throwing
    }

    try {
      return await this.espnFootballService.getScoreboard(leagueCode);
    } catch (error) {
      this.logger.error(`Error fetching ESPN data for ${leagueCode}:`, error);
      return { events: [] }; // Return empty result on error
    }
  }

  private async getESPNStandingsForCompetition(competition: string) {
    // Map competition codes to ESPN league codes
    const leagueMapping: { [key: string]: string } = {
      'PL': 'eng.1', // Premier League
      'PD': 'esp.1', // La Liga
      'SA': 'ita.1', // Serie A
      'BL1': 'ger.1', // Bundesliga
      'FL1': 'fra.1', // Ligue 1
      'CL': 'uefa.champions', // Champions League
      'EL': 'uefa.europa', // Europa League
    };

    const leagueCode = leagueMapping[competition];
    if (!leagueCode) {
      throw new Error(`Unsupported competition for ESPN: ${competition}`);
    }

    return this.espnFootballService.getStandings(leagueCode);
  }

  private mergeMatches(matches: UnifiedMatch[]): UnifiedMatch[] {
    const matchMap = new Map<string, UnifiedMatch>();

    for (const match of matches) {
      const key = `${match.homeTeam}_${match.awayTeam}_${match.date.split('T')[0]}`;
      
      if (matchMap.has(key)) {
        const existing = matchMap.get(key)!;
        // Merge data, preferring API-Football for higher confidence
        if (match.confidence > existing.confidence) {
          matchMap.set(key, {
            ...match,
            source: 'merged',
            confidence: Math.max(existing.confidence, match.confidence),
          });
        }
      } else {
        matchMap.set(key, match);
      }
    }

    return Array.from(matchMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  private mergeStandings(standings: UnifiedStanding[]): UnifiedStanding[] {
    const standingMap = new Map<string, UnifiedStanding>();

    for (const standing of standings) {
      const key = standing.team.toLowerCase().replace(/\s+/g, '_');
      
      if (standingMap.has(key)) {
        const existing = standingMap.get(key)!;
        // Merge data, preferring API-Football for higher confidence
        if (standing.confidence > existing.confidence) {
          standingMap.set(key, {
            ...standing,
            source: 'merged',
            confidence: Math.max(existing.confidence, standing.confidence),
          });
        }
      } else {
        standingMap.set(key, standing);
      }
    }

    return Array.from(standingMap.values()).sort((a, b) => a.position - b.position);
  }

  private mergeScorers(scorers: UnifiedScorer[]): UnifiedScorer[] {
    const scorerMap = new Map<string, UnifiedScorer>();

    for (const scorer of scorers) {
      const key = scorer.player.toLowerCase().replace(/\s+/g, '_');
      
      if (scorerMap.has(key)) {
        const existing = scorerMap.get(key)!;
        // Merge data, preferring API-Football for higher confidence
        if (scorer.confidence > existing.confidence) {
          scorerMap.set(key, {
            ...scorer,
            source: 'merged',
            confidence: Math.max(existing.confidence, scorer.confidence),
          });
        }
      } else {
        scorerMap.set(key, scorer);
      }
    }

    return Array.from(scorerMap.values()).sort((a, b) => b.goals - a.goals);
  }

  private mapApiFootballStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'TBD': 'SCHEDULED',
      'NS': 'SCHEDULED',
      '1H': 'LIVE',
      'HT': 'LIVE',
      '2H': 'LIVE',
      'ET': 'LIVE',
      'BT': 'LIVE',
      'P': 'LIVE',
      'FT': 'FINISHED',
      'AET': 'FINISHED',
      'PEN': 'FINISHED',
      'SUSP': 'POSTPONED',
      'INT': 'POSTPONED',
      'PST': 'CANCELLED',
      'CANC': 'CANCELLED',
      'ABD': 'CANCELLED',
      'AWD': 'FINISHED',
      'WO': 'FINISHED',
    };

    return statusMap[status] || 'SCHEDULED';
  }

  async getDataQualityReport(): Promise<{
    footballDataStatus: string;
    apiFootballStatus: string;
    espnStatus: string;
    mergedDataQuality: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    let mergedDataQuality = 0;

    try {
      // Test Football-Data.org
      await this.footballDataService.getStatus();
      mergedDataQuality += 0.3;
    } catch (error) {
      recommendations.push('Football-Data.org API is not responding');
    }

    try {
      // Test API-Football
      await this.apiFootballService.getRateLimitStatus();
      mergedDataQuality += 0.3;
    } catch (error) {
      recommendations.push('API-Football API is not responding');
    }

    try {
      // Test ESPN
      const espnHealthy = await this.espnFootballService.healthCheck();
      if (espnHealthy) {
        mergedDataQuality += 0.4; // ESPN gets higher weight due to real-time data
      } else {
        recommendations.push('ESPN API is not responding');
      }
    } catch (error) {
      recommendations.push('ESPN API is not responding');
    }

    if (mergedDataQuality < 0.5) {
      recommendations.push('Consider checking API configurations and network connectivity');
    }

    if (mergedDataQuality >= 0.9) {
      recommendations.push('Excellent data coverage - consider optimizing update frequencies');
    }

    return {
      footballDataStatus: mergedDataQuality >= 0.3 ? 'active' : 'inactive',
      apiFootballStatus: mergedDataQuality >= 0.6 ? 'active' : 'inactive',
      espnStatus: mergedDataQuality >= 0.9 ? 'active' : 'inactive',
      mergedDataQuality,
      recommendations,
    };
  }
} 