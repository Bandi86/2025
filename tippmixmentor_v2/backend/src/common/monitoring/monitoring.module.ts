import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '../logging/logging.module';
import { RedisModule } from '../redis/redis.module';
import { MonitoringService } from './monitoring.service';
import { MetricsService } from './metrics.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { PerformanceCacheService } from '../caching/performance-cache.service';

@Module({
  imports: [ConfigModule, LoggingModule, RedisModule],
  providers: [MonitoringService, MetricsService, PerformanceMonitorService, PerformanceCacheService],
  exports: [MonitoringService, MetricsService, PerformanceMonitorService, PerformanceCacheService],
})
export class MonitoringModule {} 