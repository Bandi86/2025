import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';

@Injectable()
export class MatchStatsService {
  private readonly logger = new Logger(MatchStatsService.name);

  constructor(
    @InjectRepository(Match) private matchRepository: Repository<Match>,
  ) {}

  async updateMatchMetadata(matchId: number, metadata: any): Promise<Match> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found.`);
    }

    // Merge existing metadata with new metadata
    match.metadata = { ...match.metadata, ...metadata };

    await this.matchRepository.save(match);
    this.logger.log(`Updated metadata for match ID: ${matchId}`);
    return match;
  }
}
