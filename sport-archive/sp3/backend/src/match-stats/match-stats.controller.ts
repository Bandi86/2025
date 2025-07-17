import { Controller, Put, Param, Body, ParseIntPipe, Logger } from '@nestjs/common';
import { MatchStatsService } from './match-stats.service';

@Controller('match-stats')
export class MatchStatsController {
  private readonly logger = new Logger(MatchStatsController.name);

  constructor(private readonly matchStatsService: MatchStatsService) {}

  @Put(':id/metadata')
  async updateMatchMetadata(
    @Param('id', ParseIntPipe) matchId: number,
    @Body() metadata: any,
  ) {
    this.logger.log(`Received request to update metadata for match ID: ${matchId}`);
    return this.matchStatsService.updateMatchMetadata(matchId, metadata);
  }
}
