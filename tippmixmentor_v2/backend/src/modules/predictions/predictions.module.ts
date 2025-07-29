import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisModule } from '../../common/redis/redis.module';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [RedisModule],
  controllers: [PredictionsController],
  providers: [PredictionsService, PrismaService],
  exports: [PredictionsService],
})
export class PredictionsModule {} 