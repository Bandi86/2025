import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { FootballDataController } from './football-data.controller';
import { FootballDataService } from './football-data.service';
import { ApiFootballController } from './api-football.controller';
import { ApiFootballService } from './api-football.service';
import { ESPNFootballController } from './espn-football.controller';
import { ESPNFootballService } from './espn-football.service';
import { UnifiedFootballController } from './unified-football.controller';
import { UnifiedFootballService } from './unified-football.service';
import { FootballDataSyncController } from './football-data-sync.controller';
import { FootballDataSyncService } from './football-data-sync.service';
// import { FootballDataWebSocketGateway } from './football-data-websocket.gateway';
import { OddsAnalysisController } from './odds-analysis.controller';
import { OddsAnalysisService } from './odds-analysis.service';
import { RedisModule } from '../../common/redis/redis.module';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 seconds timeout for data operations
      maxRedirects: 5,
    }),
    ConfigModule,
    ScheduleModule.forRoot(),
    RedisModule,
    DatabaseModule,
  ],
  controllers: [
    FootballDataController, 
    ApiFootballController, 
    ESPNFootballController, 
    UnifiedFootballController,
    FootballDataSyncController,
    OddsAnalysisController,
  ],
  providers: [
    FootballDataService, 
    ApiFootballService, 
    ESPNFootballService, 
    UnifiedFootballService,
    FootballDataSyncService,
    OddsAnalysisService,
  ],
  exports: [
    FootballDataService, 
    ApiFootballService, 
    ESPNFootballService, 
    UnifiedFootballService,
    FootballDataSyncService,
    OddsAnalysisService,
  ],
})
export class FootballDataModule {} 