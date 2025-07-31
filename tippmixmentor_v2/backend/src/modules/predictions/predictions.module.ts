import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [HttpModule, RedisModule],
  providers: [PredictionsService, PrismaService],
  controllers: [PredictionsController],
  exports: [PredictionsService],
})
export class PredictionsModule {} 