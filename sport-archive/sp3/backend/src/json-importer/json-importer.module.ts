import { Module } from '@nestjs/common';
import { JsonImporterService } from './json-importer.service';
import { JsonImporterController } from './json-importer.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JsonImporterService],
  controllers: [JsonImporterController],
  exports: [JsonImporterService],
})
export class JsonImporterModule {}
