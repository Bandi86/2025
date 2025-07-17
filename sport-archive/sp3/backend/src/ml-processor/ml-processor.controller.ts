import { Controller, Post, Body, Logger } from '@nestjs/common';
import { MlProcessorService } from './ml-processor.service';

@Controller('ml-processor')
export class MlProcessorController {
  private readonly logger = new Logger(MlProcessorController.name);

  constructor(private readonly mlProcessorService: MlProcessorService) {}

  @Post('predict')
  async predict(@Body() matchData: any): Promise<any> {
    this.logger.log('Received prediction request.');
    try {
      const prediction = await this.mlProcessorService.predictMatch(matchData);
      return prediction;
    } catch (error) {
      this.logger.error(`Prediction error: ${error}`);
      throw error; // Re-throw to let NestJS handle the HTTP response
    }
  }
}
