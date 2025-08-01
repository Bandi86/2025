import { Controller, Get, Query, Logger } from '@nestjs/common';
import { LiveSummaryService, LiveSummaryData } from './live-summary.service';

@Controller('live-summary')
export class LiveSummaryController {
  private readonly logger = new Logger(LiveSummaryController.name);

  constructor(private readonly liveSummaryService: LiveSummaryService) {}

  @Get()
  async getLiveSummary(
    @Query('filter') filter?: string,
    @Query('status') status?: string,
  ): Promise<LiveSummaryData> {
    this.logger.log(`Live summary request received: filter=${filter}, status=${status}`);
    return this.liveSummaryService.getLiveSummary(filter, status);
  }

  @Get('status')
  async getSystemStatus() {
    this.logger.log('System status request received');
    return this.liveSummaryService.getSystemStatus();
  }

  @Get('filters')
  async getAvailableFilters() {
    this.logger.log('Available filters request received');
    return this.liveSummaryService.getAvailableFilters();
  }
} 