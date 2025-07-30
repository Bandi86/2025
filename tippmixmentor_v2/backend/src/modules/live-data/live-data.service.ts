import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import { LiveDataCacheService } from './live-data-cache.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LiveDataService {
  private readonly logger = new Logger(LiveDataService.name);
  private readonly espnApiKey: string;
  private readonly espnBaseUrl: string;
  private readonly weatherApiKey: string;
  private readonly newsApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cacheService: LiveDataCacheService,
  ) {
    this.espnApiKey = this.configService.get<string>('ESPN_API_KEY', '');
    this.espnBaseUrl = this.configService.get<string>('ESPN_API_BASE_URL', 'https://site.api.espn.com/apis/site/v2/sports/soccer');
    this.weatherApiKey = this.configService.get<string>('WEATHER_API_KEY', '');
    this.newsApiKey = this.configService.get<string>('NEWS_API_KEY', '');
  }

  async getLiveMatchData(matchId: string) {
    try {
      // Check cache first
      const cachedData = await this.cacheService.getMatchData(matchId);
      if (cachedData) {
        this.logger.debug(`Returning cached data for match ${matchId}`);
        return cachedData;
      }

      // Get match details from database
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
          venue: true,
          league: true,
        },
      });

      if (!match) {
        throw new Error(`Match with ID ${matchId} not found`);
      }

      // Get live data from ESPN API
      const liveData = await this.getESPNLiveData(match);
      
      // Get weather data if venue is available
      let weatherData = null;
      if (match.venue?.city) {
        weatherData = await this.getWeatherData(match.venue.city, match.matchDate);
      }

      // Get team news
      const homeTeamNews = await this.getTeamNews(match.homeTeam.name);
      const awayTeamNews = await this.getTeamNews(match.awayTeam.name);

      // Get injury updates
      const injuryUpdates = await this.getInjuryUpdates(match.homeTeam.name, match.awayTeam.name);

      // Get lineup announcements
      const lineupData = await this.getLineupAnnouncements(matchId);

      const result = {
        match_id: matchId,
        match_info: {
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          league: match.league.name,
          venue: match.venue?.name,
          match_date: match.matchDate,
          status: match.status,
        },
        live_data: liveData,
        weather: weatherData,
        team_news: {
          home_team: homeTeamNews,
          away_team: awayTeamNews,
        },
        injury_updates: injuryUpdates,
        lineup_announcements: lineupData,
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      await this.cacheService.setMatchData(matchId, result, 60); // Cache for 1 minute

      return result;
    } catch (error) {
      this.logger.error(`Failed to get live match data for ${matchId}:`, error.message);
      throw error;
    }
  }

  private async getESPNLiveData(match: any) {
    try {
      // ESPN API endpoint for live match data
      const response = await firstValueFrom(
        this.httpService.get(`${this.espnBaseUrl}/scoreboard`, {
          params: {
            league: 'soc',
            dates: this.formatDate(match.matchDate),
          },
          headers: {
            'Authorization': `Bearer ${this.espnApiKey}`,
          },
        })
      );

      // Find the specific match in the response
      const events = response.data?.events || [];
      const matchEvent = events.find((event: any) => 
        event.name?.toLowerCase().includes(match.homeTeam.name.toLowerCase()) &&
        event.name?.toLowerCase().includes(match.awayTeam.name.toLowerCase())
      );

      if (matchEvent) {
        return {
          status: matchEvent.status?.type?.name || 'scheduled',
          score: {
            home: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.score || 0,
            away: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.score || 0,
          },
          time: matchEvent.status?.type?.description || null,
          possession: {
            home: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.statistics?.[0]?.value || 50,
            away: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.statistics?.[0]?.value || 50,
          },
          shots: {
            home: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.statistics?.[1]?.value || 0,
            away: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.statistics?.[1]?.value || 0,
          },
          corners: {
            home: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.statistics?.[2]?.value || 0,
            away: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.statistics?.[2]?.value || 0,
          },
          cards: {
            home: {
              yellow: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.statistics?.[3]?.value || 0,
              red: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.statistics?.[4]?.value || 0,
            },
            away: {
              yellow: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.statistics?.[3]?.value || 0,
              red: matchEvent.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.statistics?.[4]?.value || 0,
            },
          },
        };
      }

      return {
        status: 'scheduled',
        score: { home: 0, away: 0 },
        time: null,
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        cards: { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } },
      };
    } catch (error) {
      this.logger.error('Failed to get ESPN live data:', error.message);
      return {
        status: 'error',
        error: 'Failed to fetch live data',
      };
    }
  }

  private async getWeatherData(city: string, matchDate: Date) {
    try {
      if (!this.weatherApiKey) {
        return { error: 'Weather API key not configured' };
      }

      // OpenWeatherMap API for weather data
      const response = await firstValueFrom(
        this.httpService.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            q: city,
            appid: this.weatherApiKey,
            units: 'metric',
          },
        })
      );

      const weather = response.data;
      return {
        temperature: weather.main?.temp,
        humidity: weather.main?.humidity,
        wind_speed: weather.wind?.speed,
        description: weather.weather?.[0]?.description,
        icon: weather.weather?.[0]?.icon,
        city: city,
      };
    } catch (error) {
      this.logger.error('Failed to get weather data:', error.message);
      return { error: 'Failed to fetch weather data' };
    }
  }

  private async getTeamNews(teamName: string) {
    try {
      if (!this.newsApiKey) {
        return { error: 'News API key not configured' };
      }

      // News API for team news
      const response = await firstValueFrom(
        this.httpService.get('https://newsapi.org/v2/everything', {
          params: {
            q: `${teamName} football`,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 5,
            apiKey: this.newsApiKey,
          },
        })
      );

      return response.data?.articles?.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source?.name,
      })) || [];
    } catch (error) {
      this.logger.error('Failed to get team news:', error.message);
      return [];
    }
  }

  private async getInjuryUpdates(homeTeam: string, awayTeam: string) {
    try {
      // Simulate injury updates (in real implementation, this would come from a sports API)
      const injuries = [];
      
      // Check for recent injury news
      const homeTeamNews = await this.getTeamNews(`${homeTeam} injury`);
      const awayTeamNews = await this.getTeamNews(`${awayTeam} injury`);

      homeTeamNews.forEach((news: any) => {
        if (news.title.toLowerCase().includes('injury') || news.title.toLowerCase().includes('out')) {
          injuries.push({
            team: homeTeam,
            player: 'Unknown', // Would be extracted from news content
            type: 'injury',
            source: news.source,
            publishedAt: news.publishedAt,
          });
        }
      });

      awayTeamNews.forEach((news: any) => {
        if (news.title.toLowerCase().includes('injury') || news.title.toLowerCase().includes('out')) {
          injuries.push({
            team: awayTeam,
            player: 'Unknown', // Would be extracted from news content
            type: 'injury',
            source: news.source,
            publishedAt: news.publishedAt,
          });
        }
      });

      return injuries;
    } catch (error) {
      this.logger.error('Failed to get injury updates:', error.message);
      return [];
    }
  }

  private async getLineupAnnouncements(matchId: string) {
    try {
      // Get lineup data from database
      const lineups = await this.prisma.lineup.findMany({
        where: { matchId },
        include: {
          team: true,
          player: true,
        },
      });

      if (lineups.length === 0) {
        return { status: 'not_announced', message: 'Lineups not yet announced' };
      }

      // Group by team
      const teamLineups = lineups.reduce((acc, lineup) => {
        const teamName = lineup.team.name;
        if (!acc[teamName]) {
          acc[teamName] = {
            team: teamName,
            starting_xi: [],
            substitutes: [],
            formation: '4-4-2', // Default formation
          };
        }

        if (lineup.isSubstitute) {
          acc[teamName].substitutes.push({
            player: lineup.player.name,
            position: lineup.position,
          });
        } else {
          acc[teamName].starting_xi.push({
            player: lineup.player.name,
            position: lineup.position,
            isCaptain: lineup.isCaptain,
          });
        }

        return acc;
      }, {});

      return {
        status: 'announced',
        lineups: Object.values(teamLineups),
        announced_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get lineup announcements:', error.message);
      return { status: 'error', message: 'Failed to fetch lineup data' };
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async streamLiveUpdates(matchId: string, callback: (data: any) => void) {
    this.logger.log(`Starting live updates stream for match ${matchId}`);
    
    // Initial data
    const initialData = await this.getLiveMatchData(matchId);
    callback(initialData);

    // Set up interval for real-time updates
    const interval = setInterval(async () => {
      try {
        const liveData = await this.getLiveMatchData(matchId);
        callback(liveData);
      } catch (error) {
        this.logger.error(`Error in live update stream for match ${matchId}:`, error.message);
        callback({
          match_id: matchId,
          error: 'Failed to fetch live data',
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000); // Update every 30 seconds

    // Return cleanup function
    return () => {
      clearInterval(interval);
      this.logger.log(`Stopped live updates stream for match ${matchId}`);
    };
  }

  async getLiveMatches() {
    try {
      const liveMatches = await this.prisma.match.findMany({
        where: {
          isLive: true,
          isFinished: false,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
        orderBy: { matchDate: 'asc' },
      });

      const liveData = await Promise.all(
        liveMatches.map(async (match) => {
          try {
            const liveData = await this.getLiveMatchData(match.id);
            return liveData;
          } catch (error) {
            this.logger.error(`Failed to get live data for match ${match.id}:`, error.message);
            return {
              match_id: match.id,
              error: 'Failed to fetch live data',
              timestamp: new Date().toISOString(),
            };
          }
        })
      );

      return liveData;
    } catch (error) {
      this.logger.error('Failed to get live matches:', error.message);
      throw error;
    }
  }

  async getUpcomingMatches(limit: number = 10) {
    try {
      const upcomingMatches = await this.prisma.match.findMany({
        where: {
          matchDate: {
            gt: new Date(),
          },
          isFinished: false,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          venue: true,
        },
        orderBy: { matchDate: 'asc' },
        take: limit,
      });

      return upcomingMatches.map(match => ({
        match_id: match.id,
        match_info: {
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          league: match.league.name,
          venue: match.venue?.name,
          match_date: match.matchDate,
          status: match.status,
        },
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      this.logger.error('Failed to get upcoming matches:', error.message);
      throw error;
    }
  }
} 