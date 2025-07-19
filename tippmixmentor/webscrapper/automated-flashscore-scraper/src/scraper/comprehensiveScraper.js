import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { delay, randomDelay } from '../utils/delay.js';
import { saveDataToFile } from '../utils/fileManager.js';
import { createBrowser, openPageAndNavigate, waitForSelectorSafe } from './browser.js';
import { AutomatedScraper } from './automatedScraper.js';

/**
 * Átfogó scraper - minden elérhető adat letöltése
 */
export class ComprehensiveScraper extends AutomatedScraper {
  constructor() {
    super();
    this.discoveredLeagues = new Set();
    this.allCountries = [];
  }

  /**
   * Összes elérhető ország felfedezése
   */
  async discoverAllCountries() {
    logger.info('🌍 Összes elérhető ország felfedezése...');
    
    try {
      const page = await openPageAndNavigate(this.browser, `${CONFIG.BASE_URL}/football/`);
      
      // Várjuk meg az országok listáját
      await waitForSelectorSafe(page, '.leagues__country');
      
      const countries = await page.evaluate(() => {
        const countryElements = document.querySelectorAll('.leagues__country');
        return Array.from(countryElements).map(element => {
          const link = element.querySelector('a');
          const name = link?.getAttribute('href')?.split('/')[2]; // /football/country/
          const displayName = element.textContent.trim();
          return { name, displayName, url: link?.href };
        }).filter(country => country.name && country.name !== 'world');
      });
      
      await page.close();
      
      this.allCountries = countries;
      logger.info(`✅ ${countries.length} ország felfedezve`);
      
      return countries;
    } catch (error) {
      logger.error('Hiba az országok felfedezése során:', error);
      return [];
    }
  }

  /**
   * Egy ország összes ligájának felfedezése
   */
  async discoverCountryLeagues(countryName) {
    logger.info(`🏴 ${countryName} ligáinak felfedezése...`);
    
    try {
      const page = await openPageAndNavigate(this.browser, `${CONFIG.BASE_URL}/football/${countryName}/`);
      
      await waitForSelectorSafe(page, '.leagues__item');
      
      const leagues = await page.evaluate(() => {
        const leagueElements = document.querySelectorAll('.leagues__item a');
        return Array.from(leagueElements).map(link => {
          const href = link.getAttribute('href');
          const parts = href.split('/');
          const leagueName = parts[parts.length - 1];
          const displayName = link.textContent.trim();
          
          return {
            name: leagueName,
            displayName,
            url: href,
            country: parts[2] // /football/country/league
          };
        }).filter(league => 
          league.name && 
          !league.name.includes('archive') &&
          (league.name.includes('2024-2025') || league.name.includes('2025'))
        );
      });
      
      await page.close();
      
      logger.info(`✅ ${leagues.length} liga találva: ${countryName}`);
      return leagues;
      
    } catch (error) {
      logger.error(`Hiba ${countryName} ligáinak felfedezése során:`, error);
      return [];
    }
  }

  /**
   * Átfogó scraping - minden elérhető adat
   */
  async startComprehensiveScraping() {
    if (this.isRunning) {
      logger.warn('Scraper már fut!');
      return;
    }

    this.isRunning = true;
    this.stats.startTime = new Date();
    
    logger.info('🌟 ÁTFOGÓ SCRAPING INDÍTÁSA - Minden elérhető adat');
    logger.info('================================================');
    
    try {
      this.browser = await createBrowser();
      
      // 1. Összes ország felfedezése
      const countries = await this.discoverAllCountries();
      
      if (countries.length === 0) {
        logger.error('Nem sikerült országokat felfedezni');
        return;
      }

      // 2. Minden országból ligák felfedezése és scraping
      for (const country of countries.slice(0, 20)) { // Első 20 ország (teszteléshez)
        try {
          await this.scrapeCountryComprehensive(country);
          
          // Országok közötti hosszabb szünet
          await delay(CONFIG.DELAY_BETWEEN_COUNTRIES * 2, `Hosszú szünet országok között`);
          
        } catch (error) {
          logger.error(`Hiba ${country.name} átfogó scraping során:`, error);
        }
      }
      
      this.stats.endTime = new Date();
      this.logComprehensiveStats();
      
    } catch (error) {
      logger.error('Kritikus hiba az átfogó scraping során:', error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Egy ország átfogó scraping-je
   */
  async scrapeCountryComprehensive(country) {
    logger.info(`🏴 ÁTFOGÓ SCRAPING: ${country.displayName} (${country.name})`);
    
    // Ligák felfedezése
    const leagues = await this.discoverCountryLeagues(country.name);
    
    if (leagues.length === 0) {
      logger.warn(`Nem találhatók ligák: ${country.name}`);
      return;
    }

    // Minden liga scraping-je
    for (const league of leagues) {
      try {
        await this.scrapeLeague(country.name, league.name);
        
        // Ligák közötti szünet
        await delay(CONFIG.DELAY_BETWEEN_LEAGUES, `Szünet ligák között`);
        
        // Felfedezett ligák nyilvántartása
        this.discoveredLeagues.add(`${country.name}/${league.name}`);
        
      } catch (error) {
        logger.error(`Hiba liga scraping során: ${country.name}/${league.name}`, error);
      }
    }
  }

  /**
   * Átfogó statisztikák
   */
  logComprehensiveStats() {
    const duration = this.stats.endTime - this.stats.startTime;
    const durationHours = Math.round(duration / 1000 / 60 / 60 * 100) / 100;
    
    logger.info('📊 ÁTFOGÓ SCRAPING STATISZTIKÁK:');
    logger.info(`⏱️  Futási idő: ${durationHours} óra`);
    logger.info(`🌍 Feldolgozott országok: ${this.allCountries.length}`);
    logger.info(`⚽ Felfedezett ligák: ${this.discoveredLeagues.size}`);
    logger.info(`🎯 Összes meccs: ${this.stats.totalMatches}`);
    logger.info(`✅ Sikeres: ${this.stats.successfulMatches}`);
    logger.info(`❌ Sikertelen: ${this.stats.failedMatches}`);
    logger.info(`📈 Sikerességi arány: ${Math.round((this.stats.successfulMatches / this.stats.totalMatches) * 100)}%`);
  }

  /**
   * Felfedezett ligák exportálása konfigurációba
   */
  async exportDiscoveredLeagues() {
    const leaguesByCountry = {};
    
    for (const leagueKey of this.discoveredLeagues) {
      const [country, league] = leagueKey.split('/');
      if (!leaguesByCountry[country]) {
        leaguesByCountry[country] = [];
      }
      leaguesByCountry[country].push(league);
    }

    const configExport = Object.entries(leaguesByCountry).map(([country, leagues]) => ({
      country,
      leagues
    }));

    logger.info('📋 FELFEDEZETT LIGÁK KONFIGURÁCIÓJA:');
    console.log(JSON.stringify(configExport, null, 2));
    
    return configExport;
  }
}