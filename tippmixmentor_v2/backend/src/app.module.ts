import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';

// Database
import { DatabaseModule } from './common/database/database.module';
import { PrismaService } from './common/database/prisma.service';

// Common modules
import { RedisModule } from './common/redis/redis.module';
import { LoggingModule } from './common/logging/logging.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MatchesModule } from './modules/matches/matches.module';
import { LiveDataModule } from './modules/live-data/live-data.module';
import { SocialModule } from './modules/social_disabled/social.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AgentsModule } from './modules/agents/agents.module';

// Gateway
import { GatewayModule } from './gateway/gateway.module';

// Controllers
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { PerformanceController } from './performance.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // HTTP client
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),

    // Database
    DatabaseModule,

    // Common services
    RedisModule,
    LoggingModule,
    MonitoringModule,

    // JWT
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Feature modules
    AuthModule,
    UsersModule,
    MatchesModule,
    LiveDataModule,
    SocialModule,
    PredictionsModule,
    NotificationsModule,
    AgentsModule,

    // Gateway
    GatewayModule,
  ],
  controllers: [
    HealthController,
    MetricsController,
    PerformanceController,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {} 