import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingService } from './logging.service';

@Module({
  imports: [ConfigModule],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {} 