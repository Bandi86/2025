import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../common/redis/redis.module';
import { LoggingModule } from '../common/logging/logging.module';
import { MonitoringModule } from '../common/monitoring/monitoring.module';
import { EventsModule } from '../common/events/events.module';
import { JwtModule } from '@nestjs/jwt';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { WebsocketGateway } from './websocket.gateway';
import { AgentsModule } from '../modules/agents/agents.module';
import { FootballDataModule } from '../modules/football-data/football-data.module';


@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule,
    LoggingModule,
    MonitoringModule,
    EventsModule,
    AgentsModule,
    // FootballDataModule, // Temporarily disabled due to dependency issues
    FootballDataModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [GatewayController],
  providers: [GatewayService, WebsocketGateway],
  exports: [GatewayService, WebsocketGateway],
})
export class GatewayModule {} 