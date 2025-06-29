import { Module } from '@nestjs/common';
import { MlProcessorService } from './ml-processor.service';
import { MlProcessorController } from './ml-processor.controller';

@Module({
  controllers: [MlProcessorController],
  providers: [MlProcessorService],
  exports: [MlProcessorService],
})
export class MlProcessorModule {}
