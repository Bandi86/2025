#!/usr/bin/env node

import { AutomatedScraper } from './scraper/automatedScraper.js';
import { logger } from './utils/logger.js';
import { CONFIG } from './config/index.js';

/**
 * Fő alkalmazás indítása
 */
async function main() {
  logger.info('🎯 BettingMentor Automatizált Flashscore Scraper');
  logger.info('================================================');
  
  // Konfiguráció logolása
  logger.info('⚙️  Konfiguráció:');
  logger.info(`   - Meccsek közötti késleltetés: ${CONFIG.DELAY_BETWEEN_MATCHES}ms`);
  logger.info(`   - Ligák közötti késleltetés: ${CONFIG.DELAY_BETWEEN_LEAGUES}ms`);
  logger.info(`   - Országok közötti késleltetés: ${CONFIG.DELAY_BETWEEN_COUNTRIES}ms`);
  logger.info(`   - Kimeneti formátum: ${CONFIG.FILE_FORMAT.toUpperCase()}`);
  logger.info(`   - Célországok: ${CONFIG.TARGET_LEAGUES.length} ország`);
  
  const scraper = new AutomatedScraper();
  
  // Graceful shutdown kezelése
  process.on('SIGINT', async () => {
    logger.info('\n🛑 SIGINT signal fogadva, scraper leállítása...');
    await scraper.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('\n🛑 SIGTERM signal fogadva, scraper leállítása...');
    await scraper.stop();
    process.exit(0);
  });
  
  // Hibakezelés
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
  
  try {
    // Scraping indítása
    await scraper.start();
    logger.info('🎉 Scraping sikeresen befejezve!');
    
  } catch (error) {
    logger.error('💥 Kritikus hiba a scraping során:', error);
    process.exit(1);
  }
}

// Alkalmazás indítása
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Hiba a main függvényben:', error);
    process.exit(1);
  });
}