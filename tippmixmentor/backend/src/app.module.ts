import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { DataIngestionModule } from './modules/data-ingestion/data-ingestion.module';
import { MatchesModule } from './modules/matches/matches.module';
import { DbDebuggerModule } from './modules/db-debugger/db-debugger.module';

@Module({
  imports: [PrismaModule, GatewayModule, DataIngestionModule, MatchesModule, DbDebuggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
