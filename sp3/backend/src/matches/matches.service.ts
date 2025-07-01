import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateMatchDto,
  UpdateMatchDto,
  MatchFilters,
  PaginatedResponse,
  MatchResponse,
  BulkCreateMatchesDto,
  PdfMatchData,
} from '../common/types';
import { MatchStatus, DataSource } from '@prisma/client';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  async create(createMatchDto: CreateMatchDto): Promise<MatchResponse> {
    try {
      const match = await this.prisma.match.create({
        data: {
          date: new Date(createMatchDto.date),
          homeTeamId: createMatchDto.homeTeamId,
          awayTeamId: createMatchDto.awayTeamId,
          competitionId: createMatchDto.competitionId,
          round: createMatchDto.round,
          matchday: createMatchDto.matchday,
          season: createMatchDto.season,
          venue: createMatchDto.venue,
          homeScore: createMatchDto.homeScore,
          awayScore: createMatchDto.awayScore,
          status: createMatchDto.status || MatchStatus.SCHEDULED,
          sourceType: createMatchDto.sourceType || DataSource.MANUAL_INPUT,
          sourcePath: createMatchDto.sourcePath,
          extractionConfidence: createMatchDto.extractionConfidence,
          notes: createMatchDto.notes,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          competition: true,
        },
      });

      return this.formatMatchResponse(match);
    } catch (error) {
      throw new BadRequestException(`Failed to create match: ${error.message}`);
    }
  }

  async findAll(
    filters: MatchFilters = {},
  ): Promise<PaginatedResponse<MatchResponse>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
      ...filterOptions
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filterOptions.competitionId) {
      where.competitionId = filterOptions.competitionId;
    }

    if (filterOptions.teamId) {
      where.OR = [
        { homeTeamId: filterOptions.teamId },
        { awayTeamId: filterOptions.teamId },
      ];
    }

    if (filterOptions.season) {
      where.season = filterOptions.season;
    }

    if (filterOptions.status) {
      where.status = filterOptions.status;
    }

    if (filterOptions.dateFrom || filterOptions.dateTo) {
      where.date = {};
      if (filterOptions.dateFrom) {
        where.date.gte = new Date(filterOptions.dateFrom);
      }
      if (filterOptions.dateTo) {
        where.date.lte = new Date(filterOptions.dateTo);
      }
    }

    if (filterOptions.round) {
      where.round = filterOptions.round;
    }

    if (filterOptions.matchday) {
      where.matchday = filterOptions.matchday;
    }

    // Get total count for pagination
    const total = await this.prisma.match.count({ where });

    // Get matches with relations
    const matches = await this.prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: matches.map(this.formatMatchResponse),
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

  async findOne(id: string): Promise<MatchResponse> {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return this.formatMatchResponse(match);
  }

  async update(
    id: string,
    updateMatchDto: UpdateMatchDto,
  ): Promise<MatchResponse> {
    try {
      const updateData: any = { ...updateMatchDto };

      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const match = await this.prisma.match.update({
        where: { id },
        data: updateData,
        include: {
          homeTeam: true,
          awayTeam: true,
          competition: true,
        },
      });

      return this.formatMatchResponse(match);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Match with ID ${id} not found`);
      }
      throw new BadRequestException(`Failed to update match: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.match.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Match with ID ${id} not found`);
      }
      throw new BadRequestException(`Failed to delete match: ${error.message}`);
    }
  }

  // ========================================
  // BULK OPERATIONS (PDF EXTRACTION)
  // ========================================

  async bulkCreate(bulkCreateDto: BulkCreateMatchesDto): Promise<{
    created: number;
    errors: Array<{ match: PdfMatchData; error: string }>;
  }> {
    const {
      matches,
      competitionMapping = {},
      teamMapping = {},
      autoCreateMissingTeams = false,
      autoCreateMissingCompetitions = false,
    } = bulkCreateDto;

    let created = 0;
    const errors: Array<{ match: PdfMatchData; error: string }> = [];

    for (const matchData of matches) {
      try {
        // Find or create teams
        const homeTeam = await this.findOrCreateTeam(
          matchData.homeTeam,
          teamMapping,
          autoCreateMissingTeams,
        );
        const awayTeam = await this.findOrCreateTeam(
          matchData.awayTeam,
          teamMapping,
          autoCreateMissingTeams,
        );

        // Find or create competition
        const competition = await this.findOrCreateCompetition(
          matchData.competition,
          competitionMapping,
          autoCreateMissingCompetitions,
          matchData.season,
        );

        if (!homeTeam || !awayTeam || !competition) {
          errors.push({
            match: matchData,
            error: 'Could not resolve teams or competition',
          });
          continue;
        }

        // Check if match already exists
        const existingMatch = await this.prisma.match.findFirst({
          where: {
            date: new Date(matchData.date),
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            competitionId: competition.id,
          },
        });

        if (existingMatch) {
          // Update existing match
          await this.prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              homeScore: matchData.homeScore,
              awayScore: matchData.awayScore,
              status:
                (matchData.status as MatchStatus) || MatchStatus.SCHEDULED,
              extractionConfidence: matchData.extractionConfidence,
              sourcePath: matchData.sourcePath,
              sourceType: DataSource.PDF_EXTRACTION,
            },
          });
        } else {
          // Create new match
          await this.prisma.match.create({
            data: {
              date: new Date(matchData.date),
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              competitionId: competition.id,
              round: matchData.round,
              matchday: matchData.matchday,
              season: matchData.season,
              venue: matchData.venue,
              homeScore: matchData.homeScore,
              awayScore: matchData.awayScore,
              status:
                (matchData.status as MatchStatus) || MatchStatus.SCHEDULED,
              sourceType: DataSource.PDF_EXTRACTION,
              sourcePath: matchData.sourcePath,
              extractionConfidence: matchData.extractionConfidence,
            },
          });
        }

        created++;
      } catch (error) {
        errors.push({
          match: matchData,
          error: error.message,
        });
      }
    }

    return { created, errors };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private formatMatchResponse(match: any): MatchResponse {
    return {
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
      competition: {
        id: match.competition.id,
        name: match.competition.name,
        shortName: match.competition.shortName,
        country: match.competition.country,
      },
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      round: match.round,
      matchday: match.matchday,
      season: match.season,
      venue: match.venue,
      prediction: match.prediction,
      confidence: match.confidence,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };
  }

  private async findOrCreateTeam(
    teamName: string,
    teamMapping: { [key: string]: string },
    autoCreate: boolean,
  ) {
    // Check if we have a mapping
    if (teamMapping[teamName]) {
      return await this.prisma.team.findUnique({
        where: { id: teamMapping[teamName] },
      });
    }

    // Try to find by name
    let team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { name: { equals: teamName, mode: 'insensitive' } },
          { shortName: { equals: teamName, mode: 'insensitive' } },
          { alternativeNames: { array_contains: [teamName] } },
        ],
      },
    });

    // Create if not found and auto-create is enabled
    if (!team && autoCreate) {
      team = await this.prisma.team.create({
        data: {
          name: teamName,
          country: 'Unknown', // Will need to be updated manually
        },
      });
    }

    return team;
  }

  private async findOrCreateCompetition(
    competitionName: string,
    competitionMapping: { [key: string]: string },
    autoCreate: boolean,
    season: string,
  ) {
    // Check if we have a mapping
    if (competitionMapping[competitionName]) {
      return await this.prisma.competition.findUnique({
        where: { id: competitionMapping[competitionName] },
      });
    }

    // Try to find by name and season
    let competition = await this.prisma.competition.findFirst({
      where: {
        name: { equals: competitionName, mode: 'insensitive' },
        season,
      },
    });

    // Create if not found and auto-create is enabled
    if (!competition && autoCreate) {
      competition = await this.prisma.competition.create({
        data: {
          name: competitionName,
          country: 'Unknown', // Will need to be updated manually
          season,
        },
      });
    }

    return competition;
  }

  // ========================================
  // SPECIAL QUERIES
  // ========================================

  async getUpcomingMatches(limit: number = 10): Promise<MatchResponse[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        date: {
          gte: new Date(),
        },
        status: MatchStatus.SCHEDULED,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: limit,
    });

    return matches.map(this.formatMatchResponse);
  }

  async getRecentMatches(limit: number = 10): Promise<MatchResponse[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return matches.map(this.formatMatchResponse);
  }

  async getMatchesByTeam(
    teamId: string,
    limit: number = 20,
  ): Promise<MatchResponse[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return matches.map(this.formatMatchResponse);
  }
}
