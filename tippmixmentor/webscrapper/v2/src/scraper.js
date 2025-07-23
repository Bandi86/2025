

import { createBrowser, createPageAndNavigate, waitForSelectorSafe, clickSafe } from './browser.js';
import { saveStructuredData, loadExistingData } from './fileManager.js';
import { CONFIG } from './config/index.js';
import { logger, delay, randomDelay } from './utils/logger.js';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

/**
 * Javított Flashscore Scraper v2
 * - Jobb load more kezelés
 * - Robusztusabb hibaelhárítás
 * - Playwright alapú
 */
export class FlashscoreScraper {
  constructor() {
    this.browser = null;
    this.isRunning = false;
    this.stats = {
      totalMatches: 0,
      successfulMatches: 0,
      failedMatches: 0,
      startTime: null,
      endTime: null,
      loadMoreClicks: 0
    };
  }

  /**
   * Scraper indítása
   */
  async start() {
    if (this.isRunning) {
      logger.warn('⚠️ Scraper már fut!');
      return;
    }

    this.isRunning = true;
    this.stats.startTime = new Date();
    
    logger.info('🚀 Flashscore Scraper v2 indítása...');
    
    try {
      this.browser = await createBrowser();
      
      // Alapértelmezett ligák scraping-je
      for (const countryConfig of CONFIG.TARGET_LEAGUES) {
        await this.scrapeCountry(countryConfig);
        
        // Szünet országok között
        if (CONFIG.TARGET_LEAGUES.indexOf(countryConfig) < CONFIG.TARGET_LEAGUES.length - 1) {
          await delay(CONFIG.DELAY_BETWEEN_COUNTRIES, `Szünet országok között`);
        }
      }
      
      this.stats.endTime = new Date();
      this.logFinalStats();
      
    } catch (error) {
      logger.error('❌ Kritikus hiba a scraping során:', error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Egy ország összes ligájának scraping-je
   */
  async scrapeCountry(countryConfig) {
    const { country, leagues } = countryConfig;
    logger.info(`🏴 Ország scraping kezdése: ${country.toUpperCase()}`);

    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      
      try {
        // Szezonok felfedezése
        const seasons = await this.discoverSeasons(country, league);
        
        if (seasons.length === 0) {
          logger.warn(`⚠️ Nem találhatók szezonok: ${country}/${league}`);
          continue;
        }

        // Minden szezon scraping-je
        for (const season of seasons) {
          await this.scrapeLeague(country, league, season.name, season.url);
          await delay(CONFIG.DELAY_BETWEEN_LEAGUES / 2, 'Szünet szezonok között');
        }
        
        // Szünet ligák között
        if (i < leagues.length - 1) {
          await delay(CONFIG.DELAY_BETWEEN_LEAGUES, `Szünet ligák között`);
        }
        
      } catch (error) {
        logger.error(`❌ Hiba a liga scraping során: ${country}/${league}`, error);
      }
    }
    
    logger.info(`✅ Ország scraping befejezve: ${country.toUpperCase()}`);
  }

  /**
   * Szezonok felfedezése egy ligához
   */
  async discoverSeasons(country, league) {
    const archiveUrl = `${CONFIG.BASE_URL}/football/${country}/${league}/archive/`;
    
    try {
      const page = await createPageAndNavigate(this.browser, archiveUrl);
      
      // Várjuk meg a szezon elemeket
      const hasSeasons = await waitForSelectorSafe(page, CONFIG.SELECTORS.SEASON_ARCHIVE, 10000);
      
      if (!hasSeasons) {
        // Ha nincs archive oldal, próbáljuk az aktuális szezont
        await page.close();
        const currentSeasonUrl = `${CONFIG.BASE_URL}/football/${country}/${league}/results/`;
        return [{ name: '2024-2025', url: currentSeasonUrl }];
      }

      const seasons = await page.evaluate((selector) => {
        const seasonElements = document.querySelectorAll(selector);
        return Array.from(seasonElements).map(el => ({
          name: el.innerText.trim(),
          url: el.href
        }));
      }, CONFIG.SELECTORS.SEASON_ARCHIVE);

      await page.close();
      
      logger.info(`📅 ${seasons.length} szezon találva: ${country}/${league}`);
      return seasons.slice(0, 3); // Csak az utolsó 3 szezon
      
    } catch (error) {
      logger.error(`❌ Szezon felfedezési hiba: ${country}/${league}`, error);
      return [];
    }
  }

  /**
   * Egy liga scraping-je - JAVÍTOTT LOAD MORE KEZELÉSSEL
   */
  async scrapeLeague(country, league, season, seasonUrl) {
    logger.info(`⚽ Liga scraping kezdése: ${country}/${league} (${season})`);
    
    try {
      // Meccs ID-k lekérése javított load more kezeléssel
      const matchIds = await this.getMatchIdListImproved(seasonUrl);
      
      if (matchIds.length === 0) {
        logger.warn(`⚠️ Nem találhatók meccsek: ${country}/${league} (${season})`);
        return;
      }

      // Meglévő adatok betöltése
      const filename = `${league}-${season}_matches`;
      const existingData = await loadExistingData(country, league, season, filename);
      
      // Új meccsek szűrése
      const newMatchIds = matchIds.filter(id => !existingData[id]);
      
      if (newMatchIds.length === 0) {
        logger.info(`✅ Nincsenek új meccsek: ${country}/${league} (${season})`);
        return;
      }

      // Progress bar
      const progressBar = new cliProgress.SingleBar({
        format: `[${chalk.cyan('{bar}')}] ${chalk.yellow('{percentage}%')} | ${chalk.blue('{value}/{total}')} | ${chalk.gray(country)}/${chalk.bold(league)} (${season})`,
        barCompleteChar: '=',
        barIncompleteChar: ' ',
        hideCursor: true
      });

      logger.info(`🔄 ${newMatchIds.length} új meccs feldolgozása...`);
      progressBar.start(newMatchIds.length, 0);

      // Meccsek feldolgozása
      let processedCount = 0;
      for (const matchId of newMatchIds) {
        try {
          const matchData = await this.getMatchData(matchId);
          
          if (matchData) {
            existingData[matchId] = matchData;
            this.stats.successfulMatches++;
          } else {
            this.stats.failedMatches++;
          }
          
          this.stats.totalMatches++;
          processedCount++;
          progressBar.update(processedCount);
          
          // Rate limiting
          await randomDelay(
            CONFIG.DELAY_BETWEEN_MATCHES,
            CONFIG.DELAY_BETWEEN_MATCHES + 1000,
            'Meccsek közötti szünet'
          );
          
        } catch (error) {
          logger.error(`❌ Meccs feldolgozási hiba: ${matchId}`, error);
          this.stats.failedMatches++;
        }
      }

      progressBar.stop();

      // Adatok mentése
      if (Object.keys(existingData).length > 0) {
        await saveStructuredData(existingData, country, league, season, filename);
        logger.info(`💾 Liga adatok mentve: ${country}/${league} (${season}) - ${newMatchIds.length} új meccs`);
      }
      
    } catch (error) {
      logger.error(`❌ Liga scraping hiba: ${country}/${league} (${season})`, error);
    }
  }

  /**
   * JAVÍTOTT meccs ID lista lekérése - jobb load more kezelés
   */
  async getMatchIdListImproved(seasonUrl) {
    logger.debug(`🔍 Meccs ID-k lekérése: ${seasonUrl}`);
    
    try {
      const page = await createPageAndNavigate(this.browser, seasonUrl);
      
      // Várjuk meg az oldal betöltését
      await delay(3000, 'Oldal betöltés várakozás');
      
      let attempts = 0;
      let consecutiveNoNewMatches = 0;
      let previousMatchCount = 0;
      
      // JAVÍTOTT LOAD MORE CIKLUS
      while (attempts < CONFIG.MAX_LOAD_MORE_ATTEMPTS && consecutiveNoNewMatches < CONFIG.MAX_NO_NEW_MATCHES_ATTEMPTS) {
        
        // Aktuális meccsek száma
        const currentMatchCount = await page.locator(CONFIG.SELECTORS.MATCH_ELEMENT).count();
        
        // Load more gomb keresése és kattintás
        const loadMoreClicked = await clickSafe(page, CONFIG.SELECTORS.SHOW_MORE_BUTTON, 3000);
        
        if (!loadMoreClicked) {
          logger.debug('🔚 Load more gomb nem található - minden meccs betöltve');
          break;
        }
        
        this.stats.loadMoreClicks++;
        attempts++;
        
        // Várakozás a tartalom betöltésére
        await delay(CONFIG.LOAD_MORE_WAIT_TIME, 'Load more után várakozás');
        
        // Új meccsek száma ellenőrzése
        const newMatchCount = await page.locator(CONFIG.SELECTORS.MATCH_ELEMENT).count();
        
        if (newMatchCount === currentMatchCount) {
          consecutiveNoNewMatches++;
          logger.debug(`⚠️ Nincs új meccs betöltve (${consecutiveNoNewMatches}/${CONFIG.MAX_NO_NEW_MATCHES_ATTEMPTS})`);
        } else {
          consecutiveNoNewMatches = 0;
          logger.debug(`✅ Meccsek száma: ${currentMatchCount} → ${newMatchCount}`);
        }
        
        // Progress log minden 10. kattintásnál
        if (attempts % 10 === 0) {
          logger.info(`🔄 ${attempts} load more kattintás, ${newMatchCount} meccs betöltve`);
        }
      }
      
      // Végső meccs ID-k kinyerése
      const matchIds = await page.evaluate((selector) => {
        return Array.from(document.querySelectorAll(selector))
          .map(element => element.id.replace('g_1_', ''))
          .filter(id => id && id.length > 0);
      }, CONFIG.SELECTORS.MATCH_ELEMENT);
      
      await page.close();
      
      logger.info(`✅ ${matchIds.length} meccs ID lekérve (${this.stats.loadMoreClicks} load more kattintás)`);
      return matchIds;
      
    } catch (error) {
      logger.error(`❌ Meccs ID lekérési hiba: ${seasonUrl}`, error);
      return [];
    }
  }

  /**
   * Egyedi meccs adatok lekérése
   */
  async getMatchData(matchId) {
    const matchUrl = `${CONFIG.BASE_URL}/match/${matchId}/#/match-summary/match-summary`;
    
    try {
      const page = await createPageAndNavigate(this.browser, matchUrl);
      
      // Alapadatok várakozása
      await waitForSelectorSafe(page, CONFIG.SELECTORS.MATCH_DATE, 10000);
      
      // Adatok kinyerése
      const matchData = await page.evaluate((selectors) => {
        return {
          stage: document.querySelector('.tournamentHeader__country > a')?.innerText?.trim(),
          date: document.querySelector(selectors.MATCH_DATE)?.innerText?.trim(),
          status: document.querySelector(selectors.MATCH_STATUS)?.innerText?.trim(),
          home: {
            name: document.querySelector(selectors.HOME_TEAM)?.innerText?.trim(),
            image: document.querySelector('.duelParticipant__home .participant__image')?.src
          },
          away: {
            name: document.querySelector(selectors.AWAY_TEAM)?.innerText?.trim(),
            image: document.querySelector('.duelParticipant__away .participant__image')?.src
          },
          result: {
            home: Array.from(document.querySelectorAll(selectors.MATCH_SCORE))?.[0]?.innerText?.trim(),
            away: Array.from(document.querySelectorAll(selectors.MATCH_SCORE))?.[1]?.innerText?.trim()
          }
        };
      }, CONFIG.SELECTORS);
      
      // Információk és statisztikák lekérése
      const information = await this.extractMatchInformation(page);
      const statistics = await this.extractMatchStatistics(page, matchId);
      
      await page.close();
      
      return { ...matchData, information, statistics };
      
    } catch (error) {
      logger.error(`❌ Meccs adat lekérési hiba: ${matchId}`, error);
      return null;
    }
  }

  /**
   * Meccs információk kinyerése
   */
  async extractMatchInformation(page) {
    try {
      return await page.evaluate((selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        const info = [];
        
        for (let i = 0; i < elements.length; i += 2) {
          if (elements[i] && elements[i + 1]) {
            info.push({
              category: elements[i].textContent?.trim()?.replace(/[:\s]+$/, ''),
              value: elements[i + 1].textContent?.trim()
            });
          }
        }
        
        return info;
      }, CONFIG.SELECTORS.MATCH_INFO);
    } catch (error) {
      logger.debug('⚠️ Információ kinyerési hiba:', error);
      return [];
    }
  }

  /**
   * Meccs statisztikák kinyerése
   */
  async extractMatchStatistics(page, matchId) {
    try {
      // Navigálás a statisztikák oldalra
      const statsUrl = `${CONFIG.BASE_URL}/match/${matchId}/#/match-summary/match-statistics/0`;
      await page.goto(statsUrl, { waitUntil: 'domcontentloaded' });
      
      await waitForSelectorSafe(page, CONFIG.SELECTORS.MATCH_STATS, 5000);
      
      return await page.evaluate((selector) => {
        return Array.from(document.querySelectorAll(selector)).map(element => ({
          category: element.querySelector("div[data-testid='wcl-statistics-category']")?.innerText?.trim(),
          homeValue: element.querySelectorAll("div[data-testid='wcl-statistics-value'] > strong")?.[0]?.innerText?.trim(),
          awayValue: element.querySelectorAll("div[data-testid='wcl-statistics-value'] > strong")?.[1]?.innerText?.trim()
        }));
      }, CONFIG.SELECTORS.MATCH_STATS);
      
    } catch (error) {
      logger.debug('⚠️ Statisztika kinyerési hiba:', error);
      return [];
    }
  }

  /**
   * Scraper leállítása
   */
  async stop() {
    logger.info('🛑 Scraper leállítása...');
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
      logger.info('🌐 Browser bezárva');
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
    logger.info(`🔄 Load more kattintások: ${this.stats.loadMoreClicks}`);
    
    if (this.stats.totalMatches > 0) {
      const successRate = Math.round((this.stats.successfulMatches / this.stats.totalMatches) * 100);
      logger.info(`📈 Sikerességi arány: ${successRate}%`);
    }
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
