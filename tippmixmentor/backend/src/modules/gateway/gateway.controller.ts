import { Controller, Get, Post, Query, Param, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Controller('api')
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly gatewayService: GatewayService) { }

  @Get('matches')
  async getMatches(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const result = await this.gatewayService.getMatches(limitNum, offsetNum);

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

  @Get('matches/upcoming')
  async getUpcomingMatches(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const matches = await this.gatewayService.getUpcomingMatches(limitNum);

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

  @Get('matches/date/:date')
  async getMatchesByDate(
    @Param('date') date: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        throw new HttpException('Invalid date format. Use YYYY-MM-DD', HttpStatus.BAD_REQUEST);
      }

      const matches = await this.gatewayService.getMatchesByDate(date, limitNum);

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

  @Get('stats')
  async getIngestionStats() {
    try {
      const stats = await this.gatewayService.getIngestionStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get ingestion stats: ${error.message}`);
      throw new HttpException(
        `Failed to get ingestion stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ingest')
  async triggerDataIngestion(@Body('directoryPath') directoryPath?: string) {
    try {
      this.logger.log('Triggering data ingestion via gateway');
      await this.gatewayService.triggerDataIngestion(directoryPath);

      return {
        success: true,
        message: 'Data ingestion completed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to trigger data ingestion: ${error.message}`);
      throw new HttpException(
        `Failed to trigger data ingestion: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}