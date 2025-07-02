import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JsonImporterService } from '../json-importer/json-importer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AutoStartupService implements OnModuleInit {
  private readonly logger = new Logger(AutoStartupService.name);

  constructor(
    private readonly jsonImporterService: JsonImporterService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const autoStartJsonWatcher = this.configService.get(
      'AUTO_START_JSON_WATCHER',
      'true',
    );

    if (autoStartJsonWatcher === 'true') {
      try {
        this.logger.log('🚀 Automatikus JSON watcher indítása...');
        await this.jsonImporterService.startWatching();
        this.logger.log('✅ JSON watcher automatikusan elindítva');
      } catch (error) {
        this.logger.error(
          '❌ Hiba az automatikus JSON watcher indításakor:',
          error,
        );
      }
    } else {
      this.logger.log('ℹ️  Automatikus JSON watcher kikapcsolva');
    }
  }
}
