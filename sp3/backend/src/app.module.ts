import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MlProcessorModule } from './ml-processor/ml-processor.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OddsCollectorModule }'./odds-collector/odds-collector.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { MatchStatsModule } from './match-stats/match-stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [__dirname + '/database/entities/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        // synchronize: true should only be used in development!
        // It automatically updates the schema. For production, use migrations.
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    OddsCollectorModule,
    MlProcessorModule,
    PortfolioModule,
    NotificationsModule,
    MatchStatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
