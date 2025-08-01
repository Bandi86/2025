import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/database/prisma.service';

// ESPN API Types based on the analysis
export interface ESPNLeague {
  id: string;
  name: string;
  code: string;
  sport: string;
  season?: number;
}

export interface ESPNTeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  location: string;
  nickname: string;
  color: string;
  logo: string;
  record?: {
    wins: number;
    losses: number;
    ties?: number;
    winPercentage: number;
    gamesPlayed: number;
  };
}

export interface ESPNMatch {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      description: string;
      state: string;
      completed: boolean;
    };
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      homeAway: 'home' | 'away';
      team: ESPNTeam;
      score?: string;
    }>;
    odds?: Array<{
      provider: {
        name: string;
      };
      details: string;
      overUnder?: number;
      spread?: number;
      homeOdds?: number;
      awayOdds?: number;
      drawOdds?: number;
    }>;
    venue?: {
      fullName: string;
      address: {
        city: string;
        state: string;
        country: string;
      };
    };
  }>;
}

export interface ESPNStanding {
  rank: number;
  team: ESPNTeam;
  wins: number;
  losses: number;
  ties?: number;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
  winPercentage: number;
  streak: string;
}

export interface ESPNOdds {
  provider: string;
  details: string;
  overUnder?: number;
  spread?: number;
  homeOdds?: number;
  awayOdds?: number;
  drawOdds?: number;
  isLive: boolean;
  lastUpdated: string;
}

@Injectable()
export class ESPNFootballService {
  private readonly logger = new Logger(ESPNFootballService.name);
  private readonly cacheTtl = 300; // 5 minutes cache
  private readonly rateLimitPerMinute = 60; // Conservative rate limit
  private readonly rateLimitPerSecond = 2;

  // ESPN League Codes for major championships
  private readonly supportedLeagues = {
    PREMIER_LEAGUE: { name: 'Premier League', code: 'eng.1', country: 'England' },
    LA_LIGA: { name: 'La Liga', code: 'esp.1', country: 'Spain' },
    SERIE_A: { name: 'Serie A', code: 'ita.1', country: 'Italy' },
    BUNDESLIGA: { name: 'Bundesliga', code: 'ger.1', country: 'Germany' },
    LIGUE_1: { name: 'Ligue 1', code: 'fra.1', country: 'France' },
    CHAMPIONS_LEAGUE: { name: 'UEFA Champions League', code: 'uefa.champions', country: 'Europe' },
    EUROPA_LEAGUE: { name: 'UEFA Europa League', code: 'uefa.europa', country: 'Europe' },
    MLS: { name: 'Major League Soccer', code: 'usa.1', country: 'USA' },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get supported leagues
   */
  getSupportedLeagues(): ESPNLeague[] {
    return Object.values(this.supportedLeagues).map(league => ({
      id: league.code,
      name: league.name,
      code: league.code,
      sport: 'soccer',
      country: league.country,
    }));
  }

  /**
   * Get scoreboard (matches) for a specific league
   */
  async getScoreboard(leagueCode: string, cacheKey?: string): Promise<{ events: ESPNMatch[] }> {
    try {
      const cacheKeyFinal = cacheKey || `espn_scoreboard_${leagueCode}`;
      
      // Check cache first
      const cached = await this.redisService.get(cacheKeyFinal);
      if (cached) {
        this.logger.debug(`Returning cached scoreboard for: ${leagueCode}`);
        return JSON.parse(cached);
      }

      // Make request to ESPN API
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard`;
      this.logger.debug(`Fetching ESPN scoreboard: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TippMixMentor-ESPN-API/2.0.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new HttpException(
          `ESPN API error: ${response.status} ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      
      // Cache the response
      await this.redisService.set(cacheKeyFinal, JSON.stringify(data), this.cacheTtl);
      
      return data;
    } catch (error) {
      this.logger.error(`Error fetching ESPN scoreboard for ${leagueCode}: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch ESPN scoreboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get standings for a specific league
   */
  async getStandings(leagueCode: string, cacheKey?: string): Promise<{ groups: Array<{ name: string; standings: ESPNStanding[] }> }> {
    try {
      const cacheKeyFinal = cacheKey || `espn_standings_${leagueCode}`;
      
      // Check cache first
      const cached = await this.redisService.get(cacheKeyFinal);
      if (cached) {
        this.logger.debug(`Returning cached standings for: ${leagueCode}`);
        return JSON.parse(cached);
      }

      // Make request to ESPN API
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/standings`;
      this.logger.debug(`Fetching ESPN standings: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TippMixMentor-ESPN-API/2.0.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new HttpException(
          `ESPN API error: ${response.status} ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      
      // Cache the response
      await this.redisService.set(cacheKeyFinal, JSON.stringify(data), this.cacheTtl);
      
      return data;
    } catch (error) {
      this.logger.error(`Error fetching ESPN standings for ${leagueCode}: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch ESPN standings: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get teams for a specific league
   */
  async getTeams(leagueCode: string, cacheKey?: string): Promise<{ sports: Array<{ leagues: Array<{ teams: ESPNTeam[] }> }> }> {
    try {
      const cacheKeyFinal = cacheKey || `espn_teams_${leagueCode}`;
      
      // Check cache first
      const cached = await this.redisService.get(cacheKeyFinal);
      if (cached) {
        this.logger.debug(`Returning cached teams for: ${leagueCode}`);
        return JSON.parse(cached);
      }

      // Make request to ESPN API
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/teams`;
      this.logger.debug(`Fetching ESPN teams: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TippMixMentor-ESPN-API/2.0.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new HttpException(
          `ESPN API error: ${response.status} ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      
      // Cache the response
      await this.redisService.set(cacheKeyFinal, JSON.stringify(data), this.cacheTtl);
      
      return data;
    } catch (error) {
      this.logger.error(`Error fetching ESPN teams for ${leagueCode}: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch ESPN teams: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get live matches across all supported leagues
   */
  async getLiveMatches(): Promise<ESPNMatch[]> {
    try {
      const liveMatches: ESPNMatch[] = [];
      
      // Check each supported league for live matches
      for (const league of Object.values(this.supportedLeagues)) {
        try {
          const scoreboard = await this.getScoreboard(league.code);
          const events = scoreboard.events || [];
          
          for (const event of events) {
            const status = event.status?.type?.description?.toLowerCase() || '';
            if (status.includes('live') || status.includes('in progress')) {
              liveMatches.push(event);
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch live matches for ${league.name}: ${error.message}`);
        }
      }
      
      return liveMatches;
    } catch (error) {
      this.logger.error(`Error fetching live matches: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch live matches: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get odds for a specific match
   */
  async getMatchOdds(eventId: string, competitionId: string, leagueCode: string): Promise<ESPNOdds[]> {
    try {
      const cacheKey = `espn_odds_${eventId}_${competitionId}`;
      
      // Check cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Returning cached odds for: ${eventId}`);
        return JSON.parse(cached);
      }

      // Get scoreboard to find odds for the specific match
      const scoreboard = await this.getScoreboard(leagueCode);
      const events = scoreboard.events || [];
      
      const targetEvent = events.find(event => event.id === eventId);
      if (!targetEvent) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
      }

      const competition = targetEvent.competitions?.find(comp => comp.id === competitionId);
      if (!competition) {
        throw new HttpException('Competition not found', HttpStatus.NOT_FOUND);
      }

      const odds: ESPNOdds[] = (competition.odds || []).map(odd => ({
        provider: odd.provider.name,
        details: odd.details,
        overUnder: odd.overUnder,
        spread: odd.spread,
        homeOdds: odd.homeOdds,
        awayOdds: odd.awayOdds,
        drawOdds: odd.drawOdds,
        isLive: true,
        lastUpdated: new Date().toISOString(),
      }));

      // Cache the response (shorter TTL for odds)
      await this.redisService.set(cacheKey, JSON.stringify(odds), 60); // 1 minute for odds
      
      return odds;
    } catch (error) {
      this.logger.error(`Error fetching odds for match ${eventId}: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch match odds: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sync ESPN data to database
   */
  async syncLeagueData(leagueCode: string): Promise<void> {
    try {
      this.logger.log(`Starting ESPN data sync for league: ${leagueCode}`);
      
      // Get league info
      const leagueInfo = Object.values(this.supportedLeagues).find(l => l.code === leagueCode);
      if (!leagueInfo) {
        throw new Error(`Unsupported league: ${leagueCode}`);
      }

      // Sync or create league
      let league = await this.prisma.league.findUnique({
        where: { code: leagueCode },
      });

      if (!league) {
        league = await this.prisma.league.create({
          data: {
            name: leagueInfo.name,
            code: leagueCode,
            country: leagueInfo.country,
            season: new Date().getFullYear().toString(),
            isActive: true,
          },
        });
        this.logger.log(`Created new league: ${leagueInfo.name}`);
      }

      // Sync teams
      const teamsData = await this.getTeams(leagueCode);
      const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
      
      for (const teamData of teams) {
        await this.prisma.team.upsert({
          where: { code: teamData.abbreviation },
          update: {
            name: teamData.displayName,
            shortName: teamData.name,
            logo: teamData.logo,
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            name: teamData.displayName,
            shortName: teamData.name,
            code: teamData.abbreviation,
            country: leagueInfo.country,
            logo: teamData.logo,
            leagueId: league.id,
            isActive: true,
          },
        });
      }

      // Sync standings
      const standingsData = await this.getStandings(leagueCode);
      const standingsGroups = standingsData.groups || [];
      
      for (const group of standingsGroups) {
        for (const standing of group.standings) {
          const team = await this.prisma.team.findUnique({
            where: { code: standing.team.abbreviation },
          });

          if (team) {
            await this.prisma.standing.upsert({
              where: {
                leagueId_teamId_season: {
                  leagueId: league.id,
                  teamId: team.id,
                  season: new Date().getFullYear().toString(),
                },
              },
              update: {
                position: standing.rank,
                played: standing.gamesPlayed,
                won: standing.wins,
                drawn: standing.ties || 0,
                lost: standing.losses,
                goalsFor: standing.pointsFor,
                goalsAgainst: standing.pointsAgainst,
                goalDifference: standing.pointsFor - standing.pointsAgainst,
                points: standing.wins * 3 + (standing.ties || 0),
                updatedAt: new Date(),
              },
              create: {
                leagueId: league.id,
                teamId: team.id,
                position: standing.rank,
                played: standing.gamesPlayed,
                won: standing.wins,
                drawn: standing.ties || 0,
                lost: standing.losses,
                goalsFor: standing.pointsFor,
                goalsAgainst: standing.pointsAgainst,
                goalDifference: standing.pointsFor - standing.pointsAgainst,
                points: standing.wins * 3 + (standing.ties || 0),
                season: new Date().getFullYear().toString(),
              },
            });
          }
        }
      }

      this.logger.log(`Completed ESPN data sync for league: ${leagueCode}`);
    } catch (error) {
      this.logger.error(`Error syncing ESPN data for ${leagueCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{
    requestsPerMinute: number;
    requestsPerSecond: number;
    currentMinute: number;
    currentSecond: number;
  }> {
    // ESPN API doesn't provide rate limit headers, so we track our own usage
    const currentMinute = await this.redisService.get('espn_rate_limit_minute') || 0;
    const currentSecond = await this.redisService.get('espn_rate_limit_second') || 0;
    
    return {
      requestsPerMinute: this.rateLimitPerMinute,
      requestsPerSecond: this.rateLimitPerSecond,
      currentMinute: parseInt(currentMinute.toString()),
      currentSecond: parseInt(currentSecond.toString()),
    };
  }

  /**
   * Health check for ESPN API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with Premier League scoreboard
      await this.getScoreboard('eng.1');
      return true;
    } catch (error) {
      this.logger.error(`ESPN API health check failed: ${error.message}`);
      return false;
    }
  }
} 