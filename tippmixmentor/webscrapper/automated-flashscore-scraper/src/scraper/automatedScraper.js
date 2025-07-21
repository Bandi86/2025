import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { delay, randomDelay } from '../utils/delay.js';
import { saveDataToFile, loadExistingData } from '../utils/fileManager.js';
import { createBrowser } from './browser.js';
import { getMatchIdList, getMatchData } from './matchScraper.js';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

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
      
      // Determine if we are using custom selection or default config
      const targetLeaguesToScrape = CONFIG.TARGET_LEAGUES; // This will be either the old or new structure

      // Group by country for delays
      const groupedScrapeItems = {};
      for (const item of targetLeaguesToScrape) {
          const countryName = item.country;
          if (!groupedScrapeItems[countryName]) {
              groupedScrapeItems[countryName] = [];
          }
          // If it's the old structure, convert it to the new one on the fly
          if (item.leagues && Array.isArray(item.leagues)) { // Old structure: { country: 'hungary', leagues: ['nb-i-2024-2025'] }
              for (const oldLeagueName of item.leagues) {
                  // Attempt to derive base league name and season name from oldLeagueName
                  const seasonMatch = oldLeagueName.match(/^(.*)-(\d{4}-\d{4})$/);
                  let baseLeagueName = oldLeagueName;
                  let seasonName = 'unknown-season';
                  let seasonUrl = `${CONFIG.BASE_URL}/football/${countryName}/${oldLeagueName}/results`; // Default construction

                  if (seasonMatch) {
                      baseLeagueName = seasonMatch[1];
                      seasonName = seasonMatch[2];
                  }
                  // Note: We don't have the actual season.url from discovery here for old config.
                  // The getMatchIdList will construct it, which is what it did before.
                  // This is a fallback for existing config.
                  groupedScrapeItems[countryName].push({
                      country: countryName,
                      leagueName: baseLeagueName,
                      seasonName: seasonName,
                      seasonUrl: seasonUrl // This will be used by getMatchIdList
                  });
              }
          } else { // New structure: { country: 'hungary', leagueName: 'nb-i', seasonName: '2024-2025', seasonUrl: '...' }
              groupedScrapeItems[countryName].push(item);
          }
      }

      const countriesToScrape = Object.keys(groupedScrapeItems);

      for (let i = 0; i < countriesToScrape.length; i++) {
          const countryName = countriesToScrape[i];
          const scrapeItemsForCountry = groupedScrapeItems[countryName];

          logger.info(`🏴 Ország scraping kezdése: ${countryName.toUpperCase()}`);

          for (let j = 0; j < scrapeItemsForCountry.length; j++) {
              const item = scrapeItemsForCountry[j];
              try {
                  await this.scrapeLeague(
                      item.country,
                      item.leagueName,
                      item.seasonName,
                      item.seasonUrl
                  );
                  
                  // Delay between leagues within the same country
                  if (j < scrapeItemsForCountry.length - 1) {
                      await delay(CONFIG.DELAY_BETWEEN_LEAGUES, `Szünet ligák között (${item.leagueName})`);
                  }
              } catch (error) {
                  logger.error(`Hiba a liga scraping során: ${item.country}/${item.leagueName} (${item.seasonName})`, error);
              }
          }
          logger.info(`✅ Ország scraping befejezve: ${countryName.toUpperCase()}`);

          // Delay between countries
          if (i < countriesToScrape.length - 1) {
              await delay(CONFIG.DELAY_BETWEEN_COUNTRIES, `Szünet országok között (${countryName})`);
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
   * Egy liga scraping-je
   * @param {string} country - Ország neve (e.g., 'hungary')
   * @param {string} leagueName - Liga alap neve (e.g., 'nb-i')
   * @param {string} seasonName - Szezon neve (e.g., '2024-2025')
   * @param {string} seasonUrl - Teljes szezon URL (e.g., 'https://www.flashscore.com/football/hungary/nb-i-2024-2025/results')
   */
  async scrapeLeague(country, leagueName, seasonName, seasonUrl) {
    logger.info(`⚽ Liga scraping kezdése: ${country}/${leagueName} (${seasonName})`);
    logger.debug(`Scraping URL: ${seasonUrl}`);
    
    try {
      // Meccs ID-k lekérése
      const { matchIds } = await getMatchIdList(this.browser, seasonUrl); 
      
      // Filename should include season for uniqueness
      const seasonFolder = seasonUrl.split('/').filter(Boolean).pop(); // Extracts 'premier-league-2024-2025'
      const filename = `${leagueName}-${seasonFolder}_matches`; 
      
      // Load existing data using country, leagueName, and seasonFolder for path
      const existingData = await loadExistingData(country, leagueName, seasonFolder, filename);

      const newMatchIds = matchIds.filter(id => !existingData[id]);
      const totalMatches = newMatchIds.length;
      let processedMatches = 0;

      if (totalMatches === 0) {
        logger.info(`✅ Nincsenek új meccsek a(z) ${country}/${leagueName} (${seasonName}) ligában.`);
        return;
      }

      const progressbar = new cliProgress.SingleBar({
        format: `[${chalk.cyan('{bar}')}] ${chalk.yellow('{percentage}%')} | ${chalk.blue('{value}/{total}')} meccs | ${chalk.gray('Liga:')} ${chalk.bold(country)}/${chalk.bold(leagueName)} (${chalk.bold(seasonName)})`,
        barCompleteChar: '=',
        barIncompleteChar: ' ',
        hideCursor: true
      });

      logger.info(`Új meccsek feldolgozása: ${totalMatches}`);
      progressbar.start(totalMatches, 0);

      for (const matchId of newMatchIds) {
        try {
          const matchData = await getMatchData(this.browser, matchId);

          if (matchData) {
            existingData[matchId] = matchData;
            this.stats.successfulMatches++;
            logger.debug(`✅ Meccs lekérve: ${matchId}`);
          } else {
            this.stats.failedMatches++;
            logger.warn(`❌ Meccs lekérése sikertelen: ${matchId}`);
          }

          this.stats.totalMatches++;
          processedMatches++;
          progressbar.update(processedMatches);

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

      progressbar.stop();

      if (Object.keys(existingData).length > 0) {
        await saveDataToFile(existingData, country, leagueName, seasonFolder, filename);
        logger.info(`💾 Liga adatok mentve: ${country}/${leagueName} (${seasonName}) (${totalMatches} új meccs)`);
      }
      
    } catch (error) {
      logger.error(`Hiba a liga scraping során: ${country}/${leagueName} (${seasonName})`, error);
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