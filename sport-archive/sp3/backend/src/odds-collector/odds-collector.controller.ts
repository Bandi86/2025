import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { OddsCollectorService } from './odds-collector.service';

@Controller('odds-collector')
export class OddsCollectorController {
  private readonly logger = new Logger(OddsCollectorController.name);

  constructor(private readonly oddsCollectorService: OddsCollectorService) {}

  @Get('collect')
  async collectOdds(): Promise<string> {
    this.logger.log('Received request to collect odds.');
    // This method is for the old API-based collection, keeping for reference
    // await this.oddsCollectorService.fetchAndSaveOdds();
    return 'API odds collection is currently disabled. Use /process-pdf endpoint.';
  }

  @Post('process-pdf')
  async processPdfOddsEndpoint(@Body() ocrContent: string): Promise<string> {
    this.logger.log('Received request to process PDF OCR content.');
    try {
      const result = await this.oddsCollectorService.processPdfOdds(ocrContent);
      return result;
    } catch (error) {
      this.logger.error(`Error processing PDF odds: ${error}`);
      throw error; // Re-throw to let NestJS handle the HTTP response
    }
  }
}
