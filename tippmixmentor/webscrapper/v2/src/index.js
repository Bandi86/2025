#!/usr/bin/env node

import { FlashscoreScraper } from './scraper.js';
import { logger } from './utils/logger.js';

/**
 * Flashscore Scraper v2 - Főbelépési pont
 */
async function main() {
  logger.info('🚀 Flashscore Scraper v2 indítása...');
  
  const scraper = new FlashscoreScraper();
  
  // Graceful shutdown kezelése
  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT signal fogadva, scraper leállítása...');
    await scraper.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM signal fogadva, scraper leállítása...');
    await scraper.stop();
    process.exit(0);
  });

  try {
    await scraper.start();
  } catch (error) {
    logger.error('❌ Kritikus hiba:', error);
    process.exit(1);
  }
}

// Csak akkor futtatjuk, ha közvetlenül hívják
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('❌ Nem kezelt hiba:', error);
    process.exit(1);
  });
}

export { FlashscoreScraper };