#!/usr/bin/env node

/**
 * Egyszerű teszt script a scraper alapfunkcióinak ellenőrzésére
 */

import { createBrowser, openPageAndNavigate, waitForSelectorSafe } from './src/scraper/browser.js';
import { getMatchIdList, getMatchData } from './src/scraper/matchScraper.js';
import { logger } from './src/utils/logger.js';
import { CONFIG } from './src/config/index.js';

async function testScraper() {
  logger.info('🧪 Scraper teszt indítása...');
  
  let browser;
  
  try {
    // Browser indítása
    browser = await createBrowser();
    logger.info('✅ Browser sikeresen elindítva');
    
    // Teszt: Flashscore főoldal elérése
    const page = await openPageAndNavigate(browser, CONFIG.BASE_URL);
    logger.info('✅ Flashscore főoldal elérve');
    await page.close();
    
    // Teszt: Magyar NB I meccs ID-k lekérése (csak az első 5)
    logger.info('🔍 Magyar NB I meccs ID-k tesztelése...');
    const matchIds = await getMatchIdList(browser, 'hungary', 'nb-i-2024-2025');
    
    if (matchIds.length > 0) {
      logger.info(`✅ ${matchIds.length} meccs ID lekérve`);
      
      // Teszt: Első meccs adatainak lekérése
      const firstMatchId = matchIds[0];
      logger.info(`🎯 Első meccs adatainak tesztelése: ${firstMatchId}`);
      
      const matchData = await getMatchData(browser, firstMatchId);
      
      if (matchData) {
        logger.info('✅ Meccs adatok sikeresen lekérve');
        logger.info(`   Meccs: ${matchData.home?.name} vs ${matchData.away?.name}`);
        logger.info(`   Eredmény: ${matchData.result?.home}-${matchData.result?.away}`);
        logger.info(`   Dátum: ${matchData.date}`);
        logger.info(`   Státusz: ${matchData.status}`);
        logger.info(`   Statisztikák száma: ${matchData.statistics?.length || 0}`);
        logger.info(`   Információk száma: ${matchData.information?.length || 0}`);
        
        // Teszt fájl mentése
        const { saveDataToFile } = await import('./src/utils/fileManager.js');
        const testData = { [firstMatchId]: matchData };
        
        await saveDataToFile(testData, 'hungary', 'nb-i-2024-2025', '2024-2025', 'test_match');
        logger.info('💾 Teszt fájl mentve: scraped_data/hungary/nb-i-2024-2025/2024-2025/test_match.json');
      } else {
        logger.error('❌ Meccs adatok lekérése sikertelen');
      }
    } else {
      logger.warn('⚠️  Nem találhatók meccs ID-k');
    }
    
    logger.info('🎉 Teszt sikeresen befejezve!');
    
  } catch (error) {
    logger.error('💥 Teszt hiba:', error);
  } finally {
    if (browser) {
      await browser.close();
      logger.info('🔒 Browser bezárva');
    }
  }
}

// Teszt indítása
testScraper().catch(error => {
  logger.error('Kritikus teszt hiba:', error);
  process.exit(1);
});