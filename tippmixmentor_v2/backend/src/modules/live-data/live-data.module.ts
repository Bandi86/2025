import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LiveDataController } from './live-data.controller';
import { LiveDataService } from './live-data.service';
import { LiveDataGateway } from './live-data.gateway';
import { LiveDataCacheService } from './live-data-cache.service';
import { PrismaService } from '../../common/database/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [LiveDataController],
  providers: [LiveDataService, LiveDataGateway, LiveDataCacheService, PrismaService],
  exports: [LiveDataService, LiveDataGateway, LiveDataCacheService],
})
export class LiveDataModule {} 