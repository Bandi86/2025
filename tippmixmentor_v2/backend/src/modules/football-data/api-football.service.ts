import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/database/prisma.service';

export interface ApiFootballLeague {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
    country: {
      name: string;
      code: string;
      flag: string;
    };
    flag: string;
    season: number;
    round: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
    coverage: {
      fixtures: {
        events: boolean;
        lineups: boolean;
        statistics_fixtures: boolean;
        statistics_players: boolean;
      };
      standings: boolean;
      players: boolean;
      top_scorers: boolean;
      top_assists: boolean;
      top_cards: boolean;
      injuries: boolean;
      predictions: boolean;
      odds: boolean;
    };
  }>;
}

export interface ApiFootballTeam {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

export interface ApiFootballMatch {
  fixture: {
    id: number;
    referee: string;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number;
      second: number;
    };
    venue: {
      id: number;
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: {
      home: number;
      away: number;
    };
    fulltime: {
      home: number;
      away: number;
    };
    extratime: {
      home: number;
      away: number;
    };
    penalty: {
      home: number;
      away: number;
    };
  };
}

export interface ApiFootballStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

export interface ApiFootballScorer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    height: string;
    weight: string;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      lineups: number;
      minutes: number;
      number: number;
      position: string;
      rating: string;
      captain: boolean;
    };
    substitutes: {
      in: number;
      out: number;
      bench: number;
    };
    shots: {
      total: number;
      on: number;
    };
    goals: {
      total: number;
      conceded: number;
      assists: number;
      saves: number;
    };
    passes: {
      total: number;
      key: number;
      accuracy: number;
    };
    tackles: {
      total: number;
      blocks: number;
      interceptions: number;
    };
    duels: {
      total: number;
      won: number;
    };
    dribbles: {
      attempts: number;
      success: number;
      past: number;
    };
    fouls: {
      drawn: number;
      committed: number;
    };
    cards: {
      yellow: number;
      yellowred: number;
      red: number;
    };
    penalty: {
      won: number;
      commited: number;
      scored: number;
      missed: number;
      saved: number;
    };
  }>;
}

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly apiKey: string;
  private readonly cacheTtl = 300; // 5 minutes cache
  private readonly rateLimitPerMinute = 30;
  private readonly rateLimitPerMonth = 100;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('API_FOOTBALL_KEY');
    if (!this.apiKey) {
      this.logger.warn('API_FOOTBALL_KEY not configured');
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const minuteKey = `api_football:rate_limit:minute:${Math.floor(now / 60000)}`;
    const monthKey = `api_football:rate_limit:month:${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

    const [minuteCount, monthCount] = await Promise.all([
      this.redisService.get(minuteKey),
      this.redisService.get(monthKey),
    ]);

    const currentMinuteCount = parseInt(minuteCount || '0');
    const currentMonthCount = parseInt(monthCount || '0');

    if (currentMinuteCount >= this.rateLimitPerMinute) {
      throw new HttpException(
        'Rate limit exceeded: too many requests per minute',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (currentMonthCount >= this.rateLimitPerMonth) {
      throw new HttpException(
        'Rate limit exceeded: too many requests per month',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Update rate limit counters
    await Promise.all([
      this.redisService.set(minuteKey, (currentMinuteCount + 1).toString(), 60),
      this.redisService.set(monthKey, (currentMonthCount + 1).toString(), 2592000), // 30 days
    ]);
  }

  private async makeRequest<T>(endpoint: string, cacheKey?: string): Promise<T> {
    try {
      await this.checkRateLimit();

      const url = `${this.baseUrl}${endpoint}`;
      this.logger.debug(`Making request to API-Football: ${url}`);

      // Check cache first
      if (cacheKey) {
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
          this.logger.debug(`Returning cached data for: ${cacheKey}`);
          return JSON.parse(cached);
        }
      }

      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': this.apiKey,
          },
          timeout: 30000,
        })
      );

      // Cache the response
      if (cacheKey && response.data) {
        await this.redisService.set(cacheKey, JSON.stringify(response.data), this.cacheTtl);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error making request to API-Football: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch API-Football data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLeagues(country?: string, season?: number): Promise<{ response: ApiFootballLeague[] }> {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (season) params.append('season', season.toString());

    const cacheKey = `api_football:leagues:${country || 'all'}:${season || 'all'}`;
    return this.makeRequest<{ response: ApiFootballLeague[] }>(`/leagues?${params.toString()}`, cacheKey);
  }

  async getTeams(league: number, season: number): Promise<{ response: ApiFootballTeam[] }> {
    const params = new URLSearchParams();
    params.append('league', league.toString());
    params.append('season', season.toString());

    const cacheKey = `api_football:teams:${league}:${season}`;
    return this.makeRequest<{ response: ApiFootballTeam[] }>(`/teams?${params.toString()}`, cacheKey);
  }

  async getMatches(league: number, season: number, round?: string): Promise<{ response: ApiFootballMatch[] }> {
    const params = new URLSearchParams();
    params.append('league', league.toString());
    params.append('season', season.toString());
    if (round) params.append('round', round);

    const cacheKey = `api_football:matches:${league}:${season}:${round || 'all'}`;
    return this.makeRequest<{ response: ApiFootballMatch[] }>(`/fixtures?${params.toString()}`, cacheKey);
  }

  async getStandings(league: number, season: number): Promise<{ response: ApiFootballStanding[] }> {
    const params = new URLSearchParams();
    params.append('league', league.toString());
    params.append('season', season.toString());

    const cacheKey = `api_football:standings:${league}:${season}`;
    return this.makeRequest<{ response: ApiFootballStanding[] }>(`/standings?${params.toString()}`, cacheKey);
  }

  async getScorers(league: number, season: number): Promise<{ response: ApiFootballScorer[] }> {
    const params = new URLSearchParams();
    params.append('league', league.toString());
    params.append('season', season.toString());

    const cacheKey = `api_football:scorers:${league}:${season}`;
    return this.makeRequest<{ response: ApiFootballScorer[] }>(`/players/topscorers?${params.toString()}`, cacheKey);
  }

  async getLiveMatches(): Promise<{ response: ApiFootballMatch[] }> {
    const cacheKey = 'api_football:live_matches';
    return this.makeRequest<{ response: ApiFootballMatch[] }>('/fixtures?live=all', cacheKey);
  }

  async getMatchById(fixtureId: number): Promise<{ response: ApiFootballMatch[] }> {
    const cacheKey = `api_football:match:${fixtureId}`;
    return this.makeRequest<{ response: ApiFootballMatch[] }>(`/fixtures?id=${fixtureId}`, cacheKey);
  }

  async getTeamById(teamId: number, season?: number): Promise<{ response: ApiFootballTeam[] }> {
    const params = new URLSearchParams();
    params.append('id', teamId.toString());
    if (season) params.append('season', season.toString());

    const cacheKey = `api_football:team:${teamId}:${season || 'all'}`;
    return this.makeRequest<{ response: ApiFootballTeam[] }>(`/teams?${params.toString()}`, cacheKey);
  }

  async getLeagueById(leagueId: number, season?: number): Promise<{ response: ApiFootballLeague[] }> {
    const params = new URLSearchParams();
    params.append('id', leagueId.toString());
    if (season) params.append('season', season.toString());

    const cacheKey = `api_football:league:${leagueId}:${season || 'all'}`;
    return this.makeRequest<{ response: ApiFootballLeague[] }>(`/leagues?${params.toString()}`, cacheKey);
  }

  // Smart data merging and database integration
  async syncLeagueData(leagueId: number, season: number): Promise<void> {
    try {
      this.logger.log(`Starting sync for league ${leagueId}, season ${season}`);

      // Get league info
      const leagueResponse = await this.getLeagueById(leagueId, season);
      const leagueData = leagueResponse.response[0];

      // Create or update league
      const league = await this.prisma.league.upsert({
        where: { code: leagueId.toString() },
        update: {
          name: leagueData.league.name,
          country: leagueData.country.name,
          flag: leagueData.country.flag,
          logo: leagueData.league.logo,
          season: season.toString(),
          updatedAt: new Date(),
        },
        create: {
          code: leagueId.toString(),
          name: leagueData.league.name,
          country: leagueData.country.name,
          flag: leagueData.country.flag,
          logo: leagueData.league.logo,
          season: season.toString(),
        },
      });

      // Get teams
      const teamsResponse = await this.getTeams(leagueId, season);
      for (const teamData of teamsResponse.response) {
        await this.prisma.team.upsert({
          where: { code: teamData.team.id.toString() },
          update: {
            name: teamData.team.name,
            shortName: teamData.team.code,
            country: teamData.team.country,
            logo: teamData.team.logo,
            leagueId: league.id,
            updatedAt: new Date(),
          },
          create: {
            code: teamData.team.id.toString(),
            name: teamData.team.name,
            shortName: teamData.team.code,
            country: teamData.team.country,
            logo: teamData.team.logo,
            leagueId: league.id,
          },
        });
      }

      // Get matches
      const matchesResponse = await this.getMatches(leagueId, season);
      for (const matchData of matchesResponse.response) {
        const homeTeam = await this.prisma.team.findUnique({
          where: { code: matchData.teams.home.id.toString() },
        });
        const awayTeam = await this.prisma.team.findUnique({
          where: { code: matchData.teams.away.id.toString() },
        });

        if (homeTeam && awayTeam) {
          // Use a simple approach since there's no unique constraint
          const existingMatch = await this.prisma.match.findFirst({
            where: {
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              leagueId: league.id,
              season: season.toString(),
            },
          });

          if (existingMatch) {
            await this.prisma.match.update({
              where: { id: existingMatch.id },
              data: {
                matchDate: new Date(matchData.fixture.date),
                status: this.mapMatchStatus(matchData.fixture.status.short) as any,
                homeScore: matchData.goals.home,
                awayScore: matchData.goals.away,
                homeHalfScore: matchData.score.halftime.home,
                awayHalfScore: matchData.score.halftime.away,
                referee: matchData.fixture.referee,
                isLive: matchData.fixture.status.short === 'LIVE',
                isFinished: matchData.fixture.status.short === 'FT',
                updatedAt: new Date(),
              },
            });
          } else {
            await this.prisma.match.create({
              data: {
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                leagueId: league.id,
                season: season.toString(),
                matchDate: new Date(matchData.fixture.date),
                status: this.mapMatchStatus(matchData.fixture.status.short) as any,
                homeScore: matchData.goals.home,
                awayScore: matchData.goals.away,
                homeHalfScore: matchData.score.halftime.home,
                awayHalfScore: matchData.score.halftime.away,
                referee: matchData.fixture.referee,
                isLive: matchData.fixture.status.short === 'LIVE',
                isFinished: matchData.fixture.status.short === 'FT',
              },
            });
          }
        }
      }

      // Get standings
      const standingsResponse = await this.getStandings(leagueId, season);
      for (const standingData of standingsResponse.response) {
        const team = await this.prisma.team.findUnique({
          where: { code: standingData.team.id.toString() },
        });

        if (team) {
          await this.prisma.standing.upsert({
            where: {
              leagueId_teamId_season: {
                leagueId: league.id,
                teamId: team.id,
                season: season.toString(),
              }
            },
            update: {
              position: standingData.rank,
              played: standingData.all.played,
              won: standingData.all.win,
              drawn: standingData.all.draw,
              lost: standingData.all.lose,
              goalsFor: standingData.all.goals.for,
              goalsAgainst: standingData.all.goals.against,
              goalDifference: standingData.goalsDiff,
              points: standingData.points,
              updatedAt: new Date(),
            },
            create: {
              leagueId: league.id,
              teamId: team.id,
              season: season.toString(),
              position: standingData.rank,
              played: standingData.all.played,
              won: standingData.all.win,
              drawn: standingData.all.draw,
              lost: standingData.all.lose,
              goalsFor: standingData.all.goals.for,
              goalsAgainst: standingData.all.goals.against,
              goalDifference: standingData.goalsDiff,
              points: standingData.points,
            },
          });
        }
      }

      this.logger.log(`Successfully synced league ${leagueId}, season ${season}`);
    } catch (error) {
      this.logger.error(`Error syncing league ${leagueId}, season ${season}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapMatchStatus(apiStatus: string): string {
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
      'LIVE': 'LIVE',
    };

    return statusMap[apiStatus] || 'SCHEDULED';
  }

  async getRateLimitStatus(): Promise<{
    minuteRemaining: number;
    monthRemaining: number;
    minuteReset: number;
    monthReset: number;
  }> {
    const now = Date.now();
    const minuteKey = `api_football:rate_limit:minute:${Math.floor(now / 60000)}`;
    const monthKey = `api_football:rate_limit:month:${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

    const [minuteCount, monthCount] = await Promise.all([
      this.redisService.get(minuteKey),
      this.redisService.get(monthKey),
    ]);

    const currentMinuteCount = parseInt(minuteCount || '0');
    const currentMonthCount = parseInt(monthCount || '0');

    return {
      minuteRemaining: Math.max(0, this.rateLimitPerMinute - currentMinuteCount),
      monthRemaining: Math.max(0, this.rateLimitPerMonth - currentMonthCount),
      minuteReset: Math.floor(now / 60000) * 60000 + 60000,
      monthReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime(),
    };
  }
} 