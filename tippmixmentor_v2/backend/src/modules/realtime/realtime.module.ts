import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RealtimeDataController } from './realtime-data.controller';
import { RealtimeDataService } from './realtime-data.service';
import { EventsModule } from '../../common/events/events.module';
import { LiveDataModule } from '../live-data/live-data.module';
import { FootballDataModule } from '../football-data/football-data.module';
import { AgentsModule } from '../agents/agents.module';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [
    HttpModule,
    EventsModule, // This provides EventEmitterService
    LiveDataModule,
    // FootballDataModule, // Temporarily disabled due to dependency issues
    FootballDataModule,
    AgentsModule,
    PredictionsModule,
  ],
  controllers: [RealtimeDataController],
  providers: [RealtimeDataService],
  exports: [RealtimeDataService],
})
export class RealtimeModule {} 