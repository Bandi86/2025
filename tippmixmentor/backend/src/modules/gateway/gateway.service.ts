import { Injectable } from '@nestjs/common';
import { MatchesService } from '../matches/matches.service';
import { DataIngestionService } from '../data-ingestion/data-ingestion.service';

@Injectable()
export class GatewayService {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly dataIngestionService: DataIngestionService,
  ) { }

  async getMatches(limit?: number, offset?: number) {
    return await this.matchesService.getAllMatches(limit, offset);
  }

  async getUpcomingMatches(limit?: number) {
    return await this.matchesService.getUpcomingMatches(limit);
  }

  async getMatchesByDate(date: string, limit?: number) {
    return await this.matchesService.getMatchesByDate(date, limit);
  }

  async getIngestionStats() {
    return await this.dataIngestionService.getIngestionStats();
  }

  async triggerDataIngestion(directoryPath?: string) {
    return await this.dataIngestionService.ingestAllMergedFiles(directoryPath);
  }
}