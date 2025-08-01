import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { validationSchema } from './config/validation.schema';

// Database
import { DatabaseModule } from './common/database/database.module';
import { PrismaService } from './common/database/prisma.service';

// Common modules
import { RedisModule } from './common/redis/redis.module';
import { LoggingModule } from './common/logging/logging.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';
import { EventsModule } from './common/events/events.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MatchesModule } from './modules/matches/matches.module';
import { LiveDataModule } from './modules/live-data/live-data.module';
import { SocialModule } from './modules/social_disabled/social.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AgentsModule } from './modules/agents/agents.module';
import { FootballDataModule } from './modules/football-data/football-data.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Gateway
import { GatewayModule } from './gateway/gateway.module';

// Controllers
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { PerformanceController } from './performance.controller';

// New controllers for enhanced features
import { LiveSummaryController } from './modules/football-data/live-summary.controller';
import { MatchDetailController } from './modules/football-data/match-detail.controller';
import { UserPreferencesController } from './modules/users/user-preferences.controller';

// New services for enhanced features
import { LiveSummaryService } from './modules/football-data/live-summary.service';
import { MatchDetailService } from './modules/football-data/match-detail.service';
import { UserPreferencesService } from './modules/users/user-preferences.service';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // HTTP client
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Database
    DatabaseModule,

    // Common services
    RedisModule,
    LoggingModule,
    MonitoringModule,
    EventsModule,

    // JWT - Fixed security issue: Use async configuration with required secret
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        
        return {
          secret: jwtSecret,
          signOptions: { 
            expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
            issuer: 'tippmixmentor-api',
            audience: 'tippmixmentor-client',
          },
          verifyOptions: {
            issuer: 'tippmixmentor-api',
            audience: 'tippmixmentor-client',
            clockTolerance: 30, // 30 seconds clock skew tolerance
          },
        };
      },
      inject: [ConfigService],
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
    FootballDataModule,
    RealtimeModule,
    AnalyticsModule,

    // Gateway
    GatewayModule,
  ],
  controllers: [
    HealthController,
    MetricsController,
    PerformanceController,
    // New controllers for enhanced features
    LiveSummaryController,
    MatchDetailController,
    UserPreferencesController,
  ],
  providers: [
    PrismaService,
    // New services for enhanced features
    LiveSummaryService,
    MatchDetailService,
    UserPreferencesService,
  ],
  exports: [PrismaService],
})
export class AppModule {} 