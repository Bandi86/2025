import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { delay, randomDelay } from '../utils/delay.js';
import { saveDataToFile, loadExistingData, fileExists } from '../utils/fileManager.js';
import { createBrowser } from './browser.js';
import { getMatchIdList, getMatchData } from './matchScraper.js';

/**
 * Automatizált scraping fő osztály
 */
export class AutomatedScraper {
  constructor() {
    this.browser = null;
    this.isRunning = false;
    this.stats = {
      totalMatches: 0,
      successfulMatches: 0,
      failedMatches: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Scraping indítása
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Scraper már fut!');
      return;
    }

    this.isRunning = true;
    this.stats.startTime = new Date();
    
    logger.info('🚀 Automatizált Flashscore scraping indítása...');
    
    try {
      this.browser = await createBrowser();
      
      for (const countryConfig of CONFIG.TARGET_LEAGUES) {
        await this.scrapeCountry(countryConfig);
        
        // Országok közötti hosszabb szünet
        if (CONFIG.TARGET_LEAGUES.indexOf(countryConfig) < CONFIG.TARGET_LEAGUES.length - 1) {
          await delay(CONFIG.DELAY_BETWEEN_COUNTRIES, `Szünet országok között`);
        }
      }
      
      this.stats.endTime = new Date();
      this.logFinalStats();
      
    } catch (error) {
      logger.error('Kritikus hiba a scraping során:', error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Egy ország ligáinak scraping-je
   * @param {Object} countryConfig - Ország konfiguráció
   */
  async scrapeCountry(countryConfig) {
    const { country, leagues } = countryConfig;
    
    logger.info(`🏴 Ország scraping kezdése: ${country.toUpperCase()}`);
    
    for (const league of leagues) {
      try {
        await this.scrapeLeague(country, league);
        
        // Ligák közötti szünet
        if (leagues.indexOf(league) < leagues.length - 1) {
          await delay(CONFIG.DELAY_BETWEEN_LEAGUES, `Szünet ligák között`);
        }
        
      } catch (error) {
        logger.error(`Hiba a liga scraping során: ${country}/${league}`, error);
      }
    }
    
    logger.info(`✅ Ország scraping befejezve: ${country.toUpperCase()}`);
  }

  /**
   * Egy liga scraping-je
   * @param {string} country - Ország neve
   * @param {string} league - Liga neve
   */
  async scrapeLeague(country, league) {
    logger.info(`⚽ Liga scraping kezdése: ${country}/${league}`);
    
    try {
      // Meccs ID-k lekérése
      const matchIds = await getMatchIdList(this.browser, country, league);
      
      if (matchIds.length === 0) {
        logger.warn(`Nem találhatók meccsek: ${country}/${league}`);
        return;
      }
      
      // Meglévő adatok betöltése (inkrementális scraping)
      const season = '2024-2025';
      const filename = `${league}_matches`;
      const existingData = await loadExistingData(country, league, season, filename);
      
      let newMatches = 0;
      let skippedMatches = 0;
      
      for (const matchId of matchIds) {
        try {
          // Ellenőrizzük, hogy már van-e adat erről a meccsről
          if (existingData[matchId]) {
            skippedMatches++;
            logger.debug(`Meccs már létezik, kihagyás: ${matchId}`);
            continue;
          }
          
          // Meccs adatok lekérése
          const matchData = await getMatchData(this.browser, matchId);
          
          if (matchData) {
            existingData[matchId] = matchData;
            newMatches++;
            this.stats.successfulMatches++;
            
            logger.info(`✅ Meccs lekérve: ${matchId} (${matchData.home?.name} vs ${matchData.away?.name})`);
          } else {
            this.stats.failedMatches++;
            logger.warn(`❌ Meccs lekérése sikertelen: ${matchId}`);
          }
          
          this.stats.totalMatches++;
          
          // Meccsek közötti késleltetés
          await randomDelay(
            CONFIG.DELAY_BETWEEN_MATCHES, 
            CONFIG.DELAY_BETWEEN_MATCHES + 2000,
            'Meccsek közötti szünet'
          );
          
        } catch (error) {
          logger.error(`Hiba a meccs feldolgozása során: ${matchId}`, error);
          this.stats.failedMatches++;
        }
      }
      
      // Adatok mentése
      if (newMatches > 0 || Object.keys(existingData).length > 0) {
        await saveDataToFile(existingData, country, league, season, filename);
        logger.info(`💾 Liga adatok mentve: ${country}/${league} (${newMatches} új, ${skippedMatches} kihagyott)`);
      }
      
    } catch (error) {
      logger.error(`Hiba a liga scraping során: ${country}/${league}`, error);
    }
  }

  /**
   * Scraping leállítása
   */
  async stop() {
    logger.info('🛑 Scraping leállítása...');
    this.isRunning = false;
    await this.cleanup();
  }

  /**
   * Cleanup és erőforrások felszabadítása
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser bezárva');
    }
    this.isRunning = false;
  }

  /**
   * Végső statisztikák logolása
   */
  logFinalStats() {
    const duration = this.stats.endTime - this.stats.startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    logger.info('📊 SCRAPING STATISZTIKÁK:');
    logger.info(`⏱️  Futási idő: ${durationMinutes} perc`);
    logger.info(`🎯 Összes meccs: ${this.stats.totalMatches}`);
    logger.info(`✅ Sikeres: ${this.stats.successfulMatches}`);
    logger.info(`❌ Sikertelen: ${this.stats.failedMatches}`);
    logger.info(`📈 Sikerességi arány: ${Math.round((this.stats.successfulMatches / this.stats.totalMatches) * 100)}%`);
  }

  /**
   * Aktuális státusz lekérdezése
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats
    };
  }
}