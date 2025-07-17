import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  TeamFilters,
  PaginatedResponse,
  TeamResponse,
} from '../common/types';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto): Promise<TeamResponse> {
    try {
      const team = await this.prisma.team.create({
        data: {
          name: createTeamDto.name,
          fullName: createTeamDto.fullName || createTeamDto.name,
          shortName: createTeamDto.shortName,
          alternativeNames: createTeamDto.alternativeNames || [],
          city: createTeamDto.city,
          country: createTeamDto.country,
          founded: createTeamDto.founded,
          stadium: createTeamDto.stadium,
        },
      });

      return this.formatTeamResponse(team);
    } catch (error) {
      throw new BadRequestException(`Failed to create team: ${error.message}`);
    }
  }

  async findAll(
    filters: TeamFilters = {},
  ): Promise<PaginatedResponse<TeamResponse>> {
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

    if (filterOptions.isActive !== undefined) {
      where.isActive = filterOptions.isActive;
    }

    if (filterOptions.search) {
      where.OR = [
        { name: { contains: filterOptions.search, mode: 'insensitive' } },
        { shortName: { contains: filterOptions.search, mode: 'insensitive' } },
        { city: { contains: filterOptions.search, mode: 'insensitive' } },
      ];
    }

    if (filterOptions.competitionId) {
      where.competitions = {
        some: {
          competitionId: filterOptions.competitionId,
          season: filterOptions.season,
          isActive: true,
        },
      };
    }

    const total = await this.prisma.team.count({ where });

    const teams = await this.prisma.team.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: teams.map(this.formatTeamResponse),
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

  async findOne(id: string): Promise<TeamResponse> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        competitions: {
          include: {
            competition: true,
          },
        },
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return {
      ...this.formatTeamResponse(team),
      competitions: team.competitions.map((ct) => ({
        id: ct.competition.id,
        name: ct.competition.name,
        season: ct.season,
        isActive: ct.isActive,
      })),
      matchesCount: {
        home: team._count.homeMatches,
        away: team._count.awayMatches,
        total: team._count.homeMatches + team._count.awayMatches,
      },
    };
  }

  async update(
    id: string,
    updateTeamDto: UpdateTeamDto,
  ): Promise<TeamResponse> {
    try {
      const team = await this.prisma.team.update({
        where: { id },
        data: updateTeamDto,
      });

      return this.formatTeamResponse(team);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team with ID ${id} not found`);
      }
      throw new BadRequestException(`Failed to update team: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.team.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Team with ID ${id} not found`);
      }
      throw new BadRequestException(`Failed to delete team: ${error.message}`);
    }
  }

  // Helper method
  private formatTeamResponse(team: any): TeamResponse {
    return {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      alternativeNames: team.alternativeNames,
      city: team.city,
      country: team.country,
      founded: team.founded,
      stadium: team.stadium,
      isActive: team.isActive,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  // Additional methods for team statistics
  async getTeamForm(teamId: string, limit: number = 5) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'FINISHED',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return matches.map((match) => {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      let result: 'W' | 'D' | 'L';
      if (teamScore !== null && opponentScore !== null) {
        if (teamScore > opponentScore) result = 'W';
        else if (teamScore === opponentScore) result = 'D';
        else result = 'L';
      } else {
        result = 'D'; // Default for null scores
      }

      return {
        matchId: match.id,
        date: match.date.toISOString(),
        opponent: isHome ? match.awayTeam : match.homeTeam,
        isHome,
        teamScore,
        opponentScore,
        result,
      };
    });
  }
}
