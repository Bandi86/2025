import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../database/entities/match.entity';
import { MatchStatsService } from './match-stats.service';
import { MatchStatsController } from './match-stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Match])],
  providers: [MatchStatsService],
  controllers: [MatchStatsController],
  exports: [MatchStatsService],
})
export class MatchStatsModule {}
