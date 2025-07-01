import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateCompetitionDto,
  UpdateCompetitionDto,
  CompetitionFilters,
  PaginatedResponse,
  CompetitionResponse,
} from '../common/types';

@Injectable()
export class CompetitionsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCompetitionDto: CreateCompetitionDto,
  ): Promise<CompetitionResponse> {
    try {
      const competition = await this.prisma.competition.create({
        data: createCompetitionDto,
      });

      return this.formatCompetitionResponse(competition);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create competition: ${error.message}`,
      );
    }
  }

  async findAll(
    filters: CompetitionFilters = {},
  ): Promise<PaginatedResponse<CompetitionResponse>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      ...filterOptions
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (filterOptions.country) {
      where.country = { equals: filterOptions.country, mode: 'insensitive' };
    }

    if (filterOptions.type) {
      where.type = filterOptions.type;
    }

    if (filterOptions.season) {
      where.season = filterOptions.season;
    }

    if (filterOptions.tier) {
      where.tier = filterOptions.tier;
    }

    if (filterOptions.isActive !== undefined) {
      where.isActive = filterOptions.isActive;
    }

    const total = await this.prisma.competition.count({ where });

    const competitions = await this.prisma.competition.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: competitions.map(this.formatCompetitionResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<CompetitionResponse> {
    const competition = await this.prisma.competition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            matches: true,
            teams: true,
          },
        },
      },
    });

    if (!competition) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }

    return {
      ...this.formatCompetitionResponse(competition),
      stats: {
        matchesCount: competition._count.matches,
        teamsCount: competition._count.teams,
      },
    };
  }

  async update(
    id: string,
    updateCompetitionDto: UpdateCompetitionDto,
  ): Promise<CompetitionResponse> {
    try {
      const competition = await this.prisma.competition.update({
        where: { id },
        data: updateCompetitionDto,
      });

      return this.formatCompetitionResponse(competition);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Competition with ID ${id} not found`);
      }
      throw new BadRequestException(
        `Failed to update competition: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.competition.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Competition with ID ${id} not found`);
      }
      throw new BadRequestException(
        `Failed to delete competition: ${error.message}`,
      );
    }
  }

  // Helper method
  private formatCompetitionResponse(competition: any): CompetitionResponse {
    return {
      id: competition.id,
      name: competition.name,
      shortName: competition.shortName,
      country: competition.country,
      type: competition.type,
      tier: competition.tier,
      season: competition.season,
      isActive: competition.isActive,
      createdAt: competition.createdAt.toISOString(),
      updatedAt: competition.updatedAt.toISOString(),
    };
  }

  // Get current league table for a competition
  async getLeagueTable(competitionId: string, matchday?: number) {
    const where: any = { competitionId };

    if (matchday) {
      where.matchday = matchday;
    } else {
      // Get the latest matchday
      const latestMatchday = await this.prisma.leagueTable.findFirst({
        where: { competitionId },
        orderBy: { matchday: 'desc' },
        select: { matchday: true },
      });

      if (latestMatchday) {
        where.matchday = latestMatchday.matchday;
      }
    }

    const table = await this.prisma.leagueTable.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return table.map((entry) => ({
      position: entry.position,
      team: {
        id: entry.team.id,
        name: entry.team.name,
        shortName: entry.team.shortName,
      },
      points: entry.points,
      played: entry.played,
      won: entry.won,
      drawn: entry.drawn,
      lost: entry.lost,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      goalDifference: entry.goalDifference,
      form: entry.form,
      matchday: entry.matchday,
    }));
  }

  // Get matches for a competition
  async getMatches(competitionId: string, limit: number = 20) {
    const matches = await this.prisma.match.findMany({
      where: { competitionId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return matches.map((match) => ({
      id: match.id,
      date: match.date.toISOString(),
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortName: match.homeTeam.shortName,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.shortName,
      },
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      round: match.round,
      matchday: match.matchday,
    }));
  }
}
