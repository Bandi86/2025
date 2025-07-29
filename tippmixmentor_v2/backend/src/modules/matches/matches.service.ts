import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    leagueId?: string;
    teamId?: string;
    status?: string;
    date?: string;
  }) {
    const { page = 1, limit = 10, leagueId, teamId, status, date } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (leagueId) {
      where.leagueId = leagueId;
    }

    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.matchDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          venue: true,
        },
        skip,
        take: limit,
        orderBy: { matchDate: 'asc' },
      }),
      this.prisma.match.count({ where }),
    ]);

    return {
      data: matches,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
        matchStats: true,
        keyEvents: {
          orderBy: { minute: 'asc' },
        },
        lineups: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  async getLiveMatches() {
    return this.prisma.match.findMany({
      where: {
        isLive: true,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
        matchStats: true,
      },
      orderBy: { matchDate: 'asc' },
    });
  }

  async getTodayMatches() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.prisma.match.findMany({
      where: {
        matchDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
      },
      orderBy: { matchDate: 'asc' },
    });
  }

  async getMatchStats(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        matchStats: true,
        playerStats: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return {
      matchStats: match.matchStats,
      playerStats: match.playerStats,
    };
  }

  async getMatchEvents(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        keyEvents: {
          orderBy: { minute: 'asc' },
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
            },
          },
        },
        plays: {
          orderBy: { minute: 'asc' },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return {
      keyEvents: match.keyEvents,
      plays: match.plays,
    };
  }

  async create(createMatchDto: CreateMatchDto) {
    return this.prisma.match.create({
      data: {
        homeTeamId: createMatchDto.homeTeamId,
        awayTeamId: createMatchDto.awayTeamId,
        leagueId: createMatchDto.leagueId,
        venueId: createMatchDto.venueId,
        season: createMatchDto.season,
        matchDate: new Date(createMatchDto.matchDate),
        status: createMatchDto.status as any,
        homeScore: createMatchDto.homeScore,
        awayScore: createMatchDto.awayScore,
        homeHalfScore: createMatchDto.homeHalfScore,
        awayHalfScore: createMatchDto.awayHalfScore,
        referee: createMatchDto.referee,
        attendance: createMatchDto.attendance,
        weather: createMatchDto.weather,
        temperature: createMatchDto.temperature,
        humidity: createMatchDto.humidity,
        windSpeed: createMatchDto.windSpeed,
        isLive: createMatchDto.isLive,
        isFinished: createMatchDto.isFinished,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
      },
    });
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const match = await this.prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    const updateData: any = { ...updateMatchDto };
    if (updateMatchDto.matchDate) {
      updateData.matchDate = new Date(updateMatchDto.matchDate);
    }

    return this.prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
      },
    });
  }

  async remove(id: string) {
    const match = await this.findOne(id);
    await this.prisma.match.delete({
      where: { id },
    });
    return { message: 'Match deleted successfully' };
  }

  // Teams methods
  async getTeams(params: { leagueId?: string; search?: string }) {
    const { leagueId, search } = params;
    const where: any = {};

    if (leagueId) {
      where.leagueId = leagueId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.team.findMany({
      where,
      include: {
        league: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTeam(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        league: true,
        players: true,
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async getTeamMatches(teamId: string, season?: string) {
    const where: any = {
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ],
    };

    if (season) {
      where.season = season;
    }

    return this.prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
      },
      orderBy: { matchDate: 'desc' },
    });
  }

  async getTeamStats(teamId: string, season?: string) {
    const where: any = {
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ],
      isFinished: true,
    };

    if (season) {
      where.season = season;
    }

    const matches = await this.prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsScored = 0;
    let goalsConceded = 0;

    matches.forEach(match => {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      if (teamScore && opponentScore) {
        goalsScored += teamScore;
        goalsConceded += opponentScore;

        if (teamScore > opponentScore) {
          wins++;
        } else if (teamScore === opponentScore) {
          draws++;
        } else {
          losses++;
        }
      }
    });

    const total = wins + draws + losses;
    const points = wins * 3 + draws;

    return {
      teamId,
      season,
      total,
      wins,
      draws,
      losses,
      goalsScored,
      goalsConceded,
      goalDifference: goalsScored - goalsConceded,
      points,
      winPercentage: total > 0 ? (wins / total) * 100 : 0,
    };
  }

  // Leagues methods
  async getLeagues(country?: string) {
    const where: any = {};
    if (country) {
      where.country = country;
    }

    return this.prisma.league.findMany({
      where,
      include: {
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getLeague(id: string) {
    const league = await this.prisma.league.findUnique({
      where: { id },
      include: {
        teams: true,
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!league) {
      throw new NotFoundException(`League with ID ${id} not found`);
    }

    return league;
  }

  async getLeagueStandings(leagueId: string, season?: string) {
    const where: any = { leagueId };
    if (season) {
      where.season = season;
    }

    return this.prisma.standing.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: [
        { points: 'desc' },
        { goalDifference: 'desc' },
        { goalsFor: 'desc' },
      ],
    });
  }

  async getLeagueMatches(leagueId: string, season?: string, status?: string) {
    const where: any = { leagueId };
    
    if (season) {
      where.season = season;
    }
    
    if (status) {
      where.status = status;
    }

    return this.prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
      },
      orderBy: { matchDate: 'asc' },
    });
  }

  // Venues methods
  async getVenues() {
    return this.prisma.venue.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getVenue(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    return venue;
  }

  async getVenueMatches(venueId: string) {
    return this.prisma.match.findMany({
      where: { venueId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
      orderBy: { matchDate: 'desc' },
    });
  }

  // Enhanced match methods
  async getMatchPredictions(matchId: string) {
    return this.prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMatchLineups(matchId: string) {
    return this.prisma.lineup.findMany({
      where: { matchId },
      include: {
        team: true,
        player: true,
      },
      orderBy: [
        { teamId: 'asc' },
        { isSubstitute: 'asc' },
        { position: 'asc' },
      ],
    });
  }

  async getMatchPlayerStats(matchId: string) {
    return this.prisma.playerStats.findMany({
      where: { matchId },
      include: {
        player: {
          include: {
            team: true,
          },
        },
      },
      orderBy: [
        { goals: 'desc' },
        { assists: 'desc' },
      ],
    });
  }
} 