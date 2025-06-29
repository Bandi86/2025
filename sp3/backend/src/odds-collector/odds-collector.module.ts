import { Module } from '@nestjs/common';
import { OddsCollectorService } from './odds-collector.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { League } from '../database/entities/league.entity';
import { Team } from '../database/entities/team.entity';
import { Match } from '../database/entities/match.entity';
import { Odd } from '../database/entities/odd.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([League, Team, Match, Odd]),
  ],
  controllers: [OddsCollectorController],
  providers: [OddsCollectorService],
  exports: [OddsCollectorService], // Export if other modules need to use it
})
export class OddsCollectorModule {}
