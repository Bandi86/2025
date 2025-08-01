import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '../../common/redis/redis.service';

export interface FootballDataStatus {
  status: string;
  message: string;
  last_updated: string | null;
  files: Array<{
    name: string;
    size_mb: number;
    modified: string | null;
    exists: boolean;
  }>;
  competitions: Record<string, string>;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: { home: number; away: number };
  };
}

export interface Standing {
  position: number;
  team: { name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface Scorer {
  player: { name: string };
  team: { name: string };
  goals: number;
  assists: number;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

@Injectable()
export class FootballDataService {
  private readonly logger = new Logger(FootballDataService.name);
  private readonly mlServiceUrl: string;
  private readonly cacheTtl = 300; // 5 minutes cache

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://ml-service:8000');
  }

  private async makeRequest<T>(endpoint: string, cacheKey?: string): Promise<T> {
    try {
      const url = `${this.mlServiceUrl}${endpoint}`;
      this.logger.debug(`Making request to ML service: ${url}`);

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
          timeout: 30000,
        })
      );

      // Cache the response
      if (cacheKey && response.data) {
        await this.redisService.set(cacheKey, JSON.stringify(response.data), this.cacheTtl);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error making request to ML service: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch football data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStatus(): Promise<FootballDataStatus> {
    const cacheKey = 'football_data:status';
    return this.makeRequest<FootballDataStatus>('/football-data/status', cacheKey);
  }

  async getMatches(competition?: string, status?: string, limit: number = 100): Promise<any> {
    const params = new URLSearchParams();
    if (competition) params.append('competition', competition);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());

    const cacheKey = `football_data:matches:${competition || 'all'}:${status || 'all'}:${limit}`;
    return this.makeRequest(`/football-data/matches?${params.toString()}`, cacheKey);
  }

  async getStandings(competition: string): Promise<any> {
    const cacheKey = `football_data:standings:${competition}`;
    return this.makeRequest(`/football-data/standings/${competition}`, cacheKey);
  }

  async getScorers(competition: string, limit: number = 10): Promise<any> {
    const cacheKey = `football_data:scorers:${competition}:${limit}`;
    return this.makeRequest(`/football-data/scorers/${competition}?limit=${limit}`, cacheKey);
  }

  async getTeams(competition: string): Promise<any> {
    const cacheKey = `football_data:teams:${competition}`;
    return this.makeRequest(`/football-data/teams/${competition}`, cacheKey);
  }

  async getCompetitions(): Promise<any> {
    const cacheKey = 'football_data:competitions';
    return this.makeRequest('/football-data/competitions', cacheKey);
  }

  async downloadData(competitions?: string[], force: boolean = false): Promise<any> {
    const params = new URLSearchParams();
    if (force) params.append('force', 'true');
    if (competitions && competitions.length > 0) {
      competitions.forEach(comp => params.append('competitions', comp));
    }

    return this.makeRequest(`/football-data/download?${params.toString()}`);
  }

  async getDownloadLogs(lines: number = 50): Promise<any> {
    return this.makeRequest(`/football-data/logs?lines=${lines}`);
  }

  async getInfo(): Promise<any> {
    return this.makeRequest('/football-data/info');
  }
} 