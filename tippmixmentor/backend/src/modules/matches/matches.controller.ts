import { Controller, Get, Param, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
    private readonly logger = new Logger(MatchesController.name);

    constructor(private readonly matchesService: MatchesService) { }

    @Get()
    async getAllMatches(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 50;
            const offsetNum = offset ? parseInt(offset, 10) : 0;

            if (limitNum > 100) {
                throw new HttpException('Limit cannot exceed 100', HttpStatus.BAD_REQUEST);
            }

            const result = await this.matchesService.getAllMatches(limitNum, offsetNum);

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.logger.error(`Failed to get matches: ${error.message}`);
            throw new HttpException(
                `Failed to get matches: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('upcoming')
    async getUpcomingMatches(@Query('limit') limit?: string) {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 20;

            if (limitNum > 50) {
                throw new HttpException('Limit cannot exceed 50', HttpStatus.BAD_REQUEST);
            }

            const matches = await this.matchesService.getUpcomingMatches(limitNum);

            return {
                success: true,
                data: matches,
            };
        } catch (error) {
            this.logger.error(`Failed to get upcoming matches: ${error.message}`);
            throw new HttpException(
                `Failed to get upcoming matches: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('date/:date')
    async getMatchesByDate(
        @Param('date') date: string,
        @Query('limit') limit?: string,
    ) {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 50;

            if (limitNum > 100) {
                throw new HttpException('Limit cannot exceed 100', HttpStatus.BAD_REQUEST);
            }

            // Validate date format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                throw new HttpException('Invalid date format. Use YYYY-MM-DD', HttpStatus.BAD_REQUEST);
            }

            const matches = await this.matchesService.getMatchesByDate(date, limitNum);

            return {
                success: true,
                data: matches,
            };
        } catch (error) {
            this.logger.error(`Failed to get matches for date ${date}: ${error.message}`);
            throw new HttpException(
                `Failed to get matches for date ${date}: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    async getMatchById(@Param('id') id: string) {
        try {
            const match = await this.matchesService.getMatchById(id);

            return {
                success: true,
                data: match,
            };
        } catch (error) {
            this.logger.error(`Failed to get match ${id}: ${error.message}`);

            if (error.message.includes('not found')) {
                throw new HttpException(error.message, HttpStatus.NOT_FOUND);
            }

            throw new HttpException(
                `Failed to get match: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}