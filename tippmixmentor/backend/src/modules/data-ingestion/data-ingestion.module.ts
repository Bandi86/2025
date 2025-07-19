import { Module } from '@nestjs/common';
import { DataIngestionService } from './data-ingestion.service';
import { DataIngestionController } from './data-ingestion.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DataIngestionService],
  controllers: [DataIngestionController],
  exports: [DataIngestionService],
})
export class DataIngestionModule { }
