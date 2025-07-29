import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '../logging/logging.module';
import { MonitoringService } from './monitoring.service';
import { MetricsService } from './metrics.service';

@Module({
  imports: [ConfigModule, LoggingModule],
  providers: [MonitoringService, MetricsService],
  exports: [MonitoringService, MetricsService],
})
export class MonitoringModule {} 