import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { MatchesModule } from './matches/matches.module';
import { TeamsModule } from './teams/teams.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { JsonImporterModule } from './json-importer/json-importer.module';
import { AutoStartupService } from './common/auto-startup.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    MatchesModule,
    TeamsModule,
    CompetitionsModule,
    JsonImporterModule,
  ],
  controllers: [AppController],
  providers: [AppService, AutoStartupService],
})
export class AppModule {}
