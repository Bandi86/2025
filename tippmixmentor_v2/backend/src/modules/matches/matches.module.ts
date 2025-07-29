import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  controllers: [MatchesController],
  providers: [MatchesService, PrismaService],
  exports: [MatchesService],
})
export class MatchesModule {} 