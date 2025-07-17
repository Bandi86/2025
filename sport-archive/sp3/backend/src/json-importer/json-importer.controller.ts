import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { JsonImporterService, ImportResult } from './json-importer.service';

@Controller('json-importer')
export class JsonImporterController {
  private readonly logger = new Logger(JsonImporterController.name);

  constructor(private readonly jsonImporterService: JsonImporterService) {}

  /**
   * Automatikus JSON figyelő indítása
   */
  @Post('start-watching')
  async startWatching(): Promise<{ message: string }> {
    try {
      await this.jsonImporterService.startWatching();
      return { message: 'JSON watcher elindítva' };
    } catch (error) {
      this.logger.error('Hiba a watcher indításakor:', error);
      throw error;
    }
  }

  /**
   * Automatikus JSON figyelő leállítása
   */
  @Post('stop-watching')
  stopWatching(): { message: string } {
    this.jsonImporterService.stopWatching();
    return { message: 'JSON watcher leállítva' };
  }

  /**
   * Manuális JSON import
   */
  @Post('import')
  async importJsonFiles(
    @Body() body: { directory?: string },
  ): Promise<ImportResult> {
    return this.jsonImporterService.importJsonFiles(body.directory);
  }

  /**
   * Import statisztikák lekérdezése
   */
  @Get('stats')
  async getStats() {
    return this.jsonImporterService.getImportStats();
  }

  /**
   * Állapot ellenőrzése
   */
  @Get('status')
  async getStatus() {
    const stats = await this.jsonImporterService.getImportStats();
    return {
      status: stats.isWatching ? 'running' : 'stopped',
      ...stats,
    };
  }
}
