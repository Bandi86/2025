import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MatchesModule } from './modules/matches/matches.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Common modules
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { LoggingModule } from './common/logging/logging.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';

// Gateway
import { GatewayModule } from './gateway/gateway.module';

// Controllers
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Queue management
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Database and Redis
    DatabaseModule,
    RedisModule,

    // Logging and Monitoring
    LoggingModule,
    MonitoringModule,

    // Gateway
    GatewayModule,

    // Feature modules
    AuthModule,
    UsersModule,
    MatchesModule,
    PredictionsModule,
    AnalyticsModule,
    NotificationsModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [],
})
export class AppModule {} 