import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PrismaModule } from '../database/prisma.module';
import { PdfService } from '../pdf/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesController],
  providers: [MatchesService, PdfService],
  exports: [MatchesService],
})
export class MatchesModule {}
