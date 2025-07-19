import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MatchesService {
    private readonly logger = new Logger(MatchesService.name);

    constructor(private prisma: PrismaService) { }

    async getAllMatches(limit: number = 50, offset: number = 0) {
        try {
            const matches = await this.prisma.match.findMany({
                take: limit,
                skip: offset,
                include: {
                    homeTeam: true,
                    awayTeam: true,
                    tournament: {
                        include: {
                            sport: true,
                        },
                    },
                    bettingMarkets: {
                        include: {
                            odds: true,
                        },
                    },
                    result: true,
                    dataSource: true,
                },
                orderBy: {
                    date: 'desc',
                },
            });

            const total = await this.prisma.match.count();

            return {
                matches,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total,
                },
            };
        } catch (error) {
            this.logger.error('Failed to fetch matches:', error);
            throw error;
        }
    }

    async getMatchById(id: string) {
        try {
            const match = await this.prisma.match.findUnique({
                where: { id },
                include: {
                    homeTeam: true,
                    awayTeam: true,
                    tournament: {
                        include: {
                            sport: true,
                        },
                    },
                    bettingMarkets: {
                        include: {
                            odds: true,
                        },
                    },
                    result: true,
                    dataSource: true,
                    events: {
                        include: {
                            player: true,
                        },
                    },
                    lineups: {
                        include: {
                            team: true,
                            player: true,
                        },
                    },
                },
            });

            if (!match) {
                throw new Error(`Match with ID ${id} not found`);
            }

            return match;
        } catch (error) {
            this.logger.error(`Failed to fetch match ${id}:`, error);
            throw error;
        }
    }

    async getMatchesByDate(date: string, limit: number = 50) {
        try {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            const matches = await this.prisma.match.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
                take: limit,
                include: {
                    homeTeam: true,
                    awayTeam: true,
                    tournament: {
                        include: {
                            sport: true,
                        },
                    },
                    bettingMarkets: {
                        include: {
                            odds: true,
                        },
                    },
                    result: true,
                    dataSource: true,
                },
                orderBy: {
                    date: 'asc',
                },
            });

            return matches;
        } catch (error) {
            this.logger.error(`Failed to fetch matches for date ${date}:`, error);
            throw error;
        }
    }

    async getUpcomingMatches(limit: number = 20) {
        try {
            const now = new Date();

            const matches = await this.prisma.match.findMany({
                where: {
                    date: {
                        gte: now,
                    },
                    status: {
                        in: ['scheduled', 'not started'],
                    },
                },
                take: limit,
                include: {
                    homeTeam: true,
                    awayTeam: true,
                    tournament: {
                        include: {
                            sport: true,
                        },
                    },
                    bettingMarkets: {
                        include: {
                            odds: true,
                        },
                    },
                    dataSource: true,
                },
                orderBy: {
                    date: 'asc',
                },
            });

            return matches;
        } catch (error) {
            this.logger.error('Failed to fetch upcoming matches:', error);
            throw error;
        }
    }
}