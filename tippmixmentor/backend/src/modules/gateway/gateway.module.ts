import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { MatchesModule } from '../matches/matches.module';
import { DataIngestionModule } from '../data-ingestion/data-ingestion.module';

@Module({
  imports: [MatchesModule, DataIngestionModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule { }