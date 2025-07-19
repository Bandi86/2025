import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MergedMatchData {
    metadata: {
        generated_at: string;
        date: string;
        source_files: {
            sofascore?: string;
            tippmix?: string;
        };
    };
    matches: MatchData[];
}

interface MatchData {
    id: string;
    date: string;
    time: string;
    status: string;
    tournament: {
        name_hu: string;
        name_en?: string;
    };
    teams: {
        home: {
            name: string;
        };
        away: {
            name: string;
        };
    };
    betting_markets: BettingMarketData[];
    data_sources: {
        tippmix: {
            found: boolean;
        };
        sofascore: {
            id?: number;
            found: boolean;
        };
    };
    result?: {
        home_score: number | null;
        away_score: number | null;
    };
}

interface BettingMarketData {
    name: string;
    orig_market?: string;
    odds1?: string;
    oddsX?: string;
    odds2?: string;
}

@Injectable()
export class DataIngestionService {
    private readonly logger = new Logger(DataIngestionService.name);

    constructor(private prisma: PrismaService) { }

    async ingestMergedJsonFile(filePath: string): Promise<void> {
        try {
            this.logger.log(`Starting ingestion of file: ${filePath}`);

            const fileContent = await fs.readFile(filePath, 'utf-8');
            const data: MergedMatchData = JSON.parse(fileContent);

            await this.processMergedData(data);

            this.logger.log(`Successfully ingested ${data.matches.length} matches from ${filePath}`);
        } catch (error) {
            this.logger.error(`Failed to ingest file ${filePath}:`, error);
            throw error;
        }
    }

    async ingestAllMergedFiles(directoryPath: string = 'merge_json_data/merged_data'): Promise<void> {
        try {
            const files = await fs.readdir(directoryPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            this.logger.log(`Found ${jsonFiles.length} JSON files to process`);

            for (const file of jsonFiles) {
                const fullPath = path.join(directoryPath, file);
                await this.ingestMergedJsonFile(fullPath);
            }

            this.logger.log('All files processed successfully');
        } catch (error) {
            this.logger.error('Failed to process directory:', error);
            throw error;
        }
    }

    private async processMergedData(data: MergedMatchData): Promise<void> {
        this.logger.debug(`Processing merged data with ${data.matches.length} matches.`);
        // Ensure Soccer sport exists
        const sport = await this.ensureSportExists('Soccer');
        this.logger.debug(`Ensured sport 'Soccer' with ID: ${sport.id}`);

        for (const matchData of data.matches) {
            this.logger.debug(`Processing match: ${matchData.id}`);
            await this.processMatch(matchData, sport.id);
        }
        this.logger.debug('Finished processing all merged data.');
    }

    private async processMatch(matchData: MatchData, sportId: number): Promise<void> {
        try {
            this.logger.debug(`Processing match ID: ${matchData.id}`);
            // Ensure tournament exists
            const tournament = await this.ensureTournamentExists(matchData.tournament, sportId);
            this.logger.debug(`Ensured tournament ${tournament.nameHu} with ID: ${tournament.id}`);

            // Ensure teams exist
            const homeTeam = await this.ensureTeamExists(matchData.teams.home.name);
            this.logger.debug(`Ensured home team ${homeTeam.name} with ID: ${homeTeam.id}`);
            const awayTeam = await this.ensureTeamExists(matchData.teams.away.name);
            this.logger.debug(`Ensured away team ${awayTeam.name} with ID: ${awayTeam.id}`);

            // Create or update match
            const match = await this.upsertMatch(matchData, tournament.id, homeTeam.id, awayTeam.id);
            this.logger.debug(`Upserted match ${match.id}`);

            // Process betting markets
            this.logger.debug(`Processing betting markets for match ${match.id}`);
            await this.processBettingMarkets(matchData.betting_markets, match.id);
            this.logger.debug(`Finished processing betting markets for match ${match.id}`);

            // Process data sources
            this.logger.debug(`Processing data sources for match ${match.id}`);
            await this.processDataSources(matchData.data_sources, match.id);
            this.logger.debug(`Finished processing data sources for match ${match.id}`);

            // Process result if available
            if (matchData.result) {
                this.logger.debug(`Processing result for match ${match.id}`);
                await this.processResult(matchData.result, match.id);
                this.logger.debug(`Finished processing result for match ${match.id}`);
            }

        } catch (error) {
            this.logger.error(`Failed to process match ${matchData.id}:`, error);
            throw error;
        }
    }

    private async ensureSportExists(name: string) {
        return await this.prisma.sport.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    private async ensureTournamentExists(tournamentData: MatchData['tournament'], sportId: number) {
        return await this.prisma.tournament.upsert({
            where: { nameHu: tournamentData.name_hu },
            update: {
                nameEn: tournamentData.name_en,
            },
            create: {
                nameHu: tournamentData.name_hu,
                nameEn: tournamentData.name_en,
                sportId,
            },
        });
    }

    private async ensureTeamExists(name: string) {
        return await this.prisma.team.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    private async upsertMatch(matchData: MatchData, tournamentId: number, homeTeamId: number, awayTeamId: number) {
        const matchDateTime = new Date(`${matchData.date}T${matchData.time}:00.000Z`);

        return await this.prisma.match.upsert({
            where: { id: matchData.id },
            update: {
                date: matchDateTime,
                status: matchData.status,
                tournamentId,
                homeTeamId,
                awayTeamId,
            },
            create: {
                id: matchData.id,
                date: matchDateTime,
                status: matchData.status,
                tournamentId,
                homeTeamId,
                awayTeamId,
            },
        });
    }

    private async processBettingMarkets(bettingMarkets: BettingMarketData[], matchId: string) {
        this.logger.debug(`Starting to process ${bettingMarkets.length} betting markets for match ${matchId}`);
        for (const marketData of bettingMarkets) {
            this.logger.debug(`Upserting betting market: ${marketData.name} for match ${matchId}`);
            const market = await this.prisma.bettingMarket.upsert({
                where: {
                    matchId_name: {
                        matchId,
                        name: marketData.name,
                    },
                },
                update: {
                    origMarket: marketData.orig_market,
                },
                create: {
                    matchId,
                    name: marketData.name,
                    origMarket: marketData.orig_market,
                },
            });
            this.logger.debug(`Upserted betting market ID: ${market.id}`);

            // Create odds if available
            if (marketData.odds1 || marketData.oddsX || marketData.odds2) {
                this.logger.debug(`Upserting odds for betting market ${market.id}`);
                await this.prisma.odds.upsert({
                    where: {
                        bettingMarketId_provider: {
                            bettingMarketId: market.id,
                            provider: 'Tippmix', // Default provider
                        },
                    },
                    update: {
                        odds1: marketData.odds1 ? parseFloat(marketData.odds1) : null,
                        oddsX: marketData.oddsX ? parseFloat(marketData.oddsX) : null,
                        odds2: marketData.odds2 ? parseFloat(marketData.odds2) : null,
                    },
                    create: {
                        bettingMarketId: market.id,
                        provider: 'Tippmix',
                        odds1: marketData.odds1 ? parseFloat(marketData.odds1) : null,
                        oddsX: marketData.oddsX ? parseFloat(marketData.oddsX) : null,
                        odds2: marketData.odds2 ? parseFloat(marketData.odds2) : null,
                    },
                });
                this.logger.debug(`Upserted odds for betting market ${market.id}`);
            }
        }
        this.logger.debug(`Finished processing betting markets for match ${matchId}`);
    }

    private async processDataSources(dataSources: MatchData['data_sources'], matchId: string) {
        this.logger.debug(`Processing data sources for match ${matchId}`);
        await this.prisma.dataSource.upsert({
            where: { matchId },
            update: {
                tippmixFound: dataSources.tippmix.found,
                sofascoreId: dataSources.sofascore.id,
                sofascoreFound: dataSources.sofascore.found,
            },
            create: {
                matchId,
                tippmixFound: dataSources.tippmix.found,
                sofascoreId: dataSources.sofascore.id,
                sofascoreFound: dataSources.sofascore.found,
            },
        });
        this.logger.debug(`Finished processing data sources for match ${matchId}`);
    }

    private async processResult(resultData: MatchData['result'], matchId: string) {
        this.logger.debug(`Attempting to process result for match ${matchId}. resultData: ${JSON.stringify(resultData)}`);
        if (resultData && (resultData.home_score !== null || resultData.away_score !== null)) {
            this.logger.debug(`Upserting result for match ${matchId}. Home score: ${resultData.home_score}, Away score: ${resultData.away_score}`);
            await this.prisma.result.upsert({
                where: { matchId },
                update: {
                    homeScore: resultData.home_score,
                    awayScore: resultData.away_score,
                },
                create: {
                    matchId,
                    homeScore: resultData.home_score,
                    awayScore: resultData.away_score,
                },
            });
            this.logger.debug(`Upserted result for match ${matchId}`);
        }
        this.logger.debug(`Finished processing result for match ${matchId}`);
    }

    async getIngestionStats(): Promise<any> {
        const stats = await this.prisma.$transaction([
            this.prisma.match.count(),
            this.prisma.team.count(),
            this.prisma.tournament.count(),
            this.prisma.bettingMarket.count(),
            this.prisma.odds.count(),
        ]);

        return {
            matches: stats[0],
            teams: stats[1],
            tournaments: stats[2],
            bettingMarkets: stats[3],
            odds: stats[4],
        };
    }
}
