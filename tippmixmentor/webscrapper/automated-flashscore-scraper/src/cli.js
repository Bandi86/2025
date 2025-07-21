#!/usr/bin/env node

import {AutomatedScraper} from './scraper/automatedScraper.js';
import {ComprehensiveScraper} from './scraper/comprehensiveScraper.js';
import {logger} from './utils/logger.js';
import {CONFIG} from './config/index.js';
import {cacheManager} from './utils/cacheManager.js';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { selectSeason } from './cli/prompts/season/index.js';

/**
 * CLI parancsok kezelése
 */
class CLI {
    constructor() {
        this.scraper = new AutomatedScraper();
    }

    /**
   * Parancsok feldolgozása
   */
    async processCommand(args) {
        const command = args[2];

        switch (command) {
            case 'start':
                await this.startScraping();
                break;

            case 'status':
                this.showStatus();
                break;

            case 'config':
                this.showConfig();
                break;

            case 'stats':
                await this.showStats();
                break;

            case 'clean':
                await this.cleanData();
                break;

            case 'discover':
                await this.startDiscovery();
                break;

            case 'select':
                await this.startInteractiveSelection();
                break;

            case 'comprehensive':
                await this.startComprehensive();
                break;

            case 'ml-dataset':
                await this.generateMLDatasets();
                break;

            case 'refresh-cache':
                await this.refreshCache();
                break;

            case 'cache-status':
                await this.showCacheStatus();
                break;

            case 'help':
            default:
                this.showHelp();
                break;
        }
    }

    /**
   * Scraping indítása
   */
    async startScraping() {
        console.log('🚀 Automatizált scraping indítása...\n');
        await this.scraper.start();
    }

    /**
   * Aktuális státusz megjelenítése
   */
    showStatus() {
        const status = this.scraper.getStatus();

        console.log('📊 SCRAPER STÁTUSZ');
        console.log('==================');
        console.log(`Futás: ${
            status.isRunning ? '🟢 AKTÍV' : '🔴 LEÁLLÍTVA'
        }`);
        console.log(`Összes meccs: ${
            status.stats.totalMatches
        }`);
        console.log(`Sikeres: ${
            status.stats.successfulMatches
        }`);
        console.log(`Sikertelen: ${
            status.stats.failedMatches
        }`);

        if (status.stats.startTime) {
            const duration = (new Date() - status.stats.startTime) / 1000 / 60;
            console.log(`Futási idő: ${
                Math.round(duration)
            } perc`);
        }
    }

    /**
   * Konfiguráció megjelenítése
   */
    showConfig() {
        console.log('⚙️  KONFIGURÁCIÓ');
        console.log('================');
        console.log(`Meccsek közötti késleltetés: ${
            CONFIG.DELAY_BETWEEN_MATCHES
        }ms`);
        console.log(`Ligák közötti késleltetés: ${
            CONFIG.DELAY_BETWEEN_LEAGUES
        }ms`);
        console.log(`Országok közötti késleltetés: ${
            CONFIG.DELAY_BETWEEN_COUNTRIES
        }ms`);
        console.log(`Fájlformátum: ${
            CONFIG.FILE_FORMAT.toUpperCase()
        }`);
        console.log(`Kimeneti mappa: ${
            CONFIG.OUTPUT_BASE_PATH
        }`);
        console.log(`Headless mód: ${
            CONFIG.HEADLESS ? 'BE' : 'KI'
        }`);

        console.log('\n🎯 CÉLLIGÁK:');
        CONFIG.TARGET_LEAGUES.forEach(country => {
            console.log(`  ${
                country.country.toUpperCase()
            }:`);
            country.leagues.forEach(league => {
                console.log(`    - ${league}`);
            });
        });
    }

    /**
   * Statisztikák megjelenítése
   */
    async showStats() {
        console.log('📈 ADATGYŰJTÉSI STATISZTIKÁK');
        console.log('===========================');

        try {
            const stats = await this.calculateDataStats();

            console.log(`Összes ország: ${
                stats.countries
            }`);
            console.log(`Összes liga: ${
                stats.leagues
            }`);
            console.log(`Összes meccs: ${
                stats.totalMatches
            }`);
            console.log(`Fájlok száma: ${
                stats.files
            }`);
            console.log(`Összes fájlméret: ${
                this.formatBytes(stats.totalSize)
            }`);

            console.log('\n📁 ORSZÁGONKÉNTI BONTÁS:');
            Object.entries(stats.byCountry).forEach(([country, data]) => {
                console.log(`  ${
                    country.toUpperCase()
                }: ${
                    data.matches
                } meccs, ${
                    data.leagues
                } liga`);
            });

        } catch (error) {
            console.error('Hiba a statisztikák számításakor:', error.message);
        }
    }

    /**
   * Adatok törlése
   */
    async cleanData() {
        console.log('🧹 Adatok törlése...');

        try {
            if (await fs.pathExists(CONFIG.OUTPUT_BASE_PATH)) {
                await fs.remove(CONFIG.OUTPUT_BASE_PATH);
                console.log('✅ Adatok sikeresen törölve!');
            } else {
                console.log('ℹ️  Nincs törlendő adat.');
            }
        } catch (error) {
            console.error('❌ Hiba az adatok törlésekor:', error.message);
        }
    }

    /**
   * Már letöltött adatok ellenőrzése
   */
    async checkExistingData() {
        const existingData = {};

        if (!await fs.pathExists(CONFIG.OUTPUT_BASE_PATH)) {
            return existingData;
        }

        try {
            const countries = await fs.readdir(CONFIG.OUTPUT_BASE_PATH);

            for (const country of countries) {
                const countryPath = path.join(CONFIG.OUTPUT_BASE_PATH, country);
                const countryStats = await fs.stat(countryPath);

                if (countryStats.isDirectory()) {
                    existingData[country] = {
                        leagues: [],
                        totalMatches: 0,
                        lastUpdated: null
                    };

                    const leagues = await fs.readdir(countryPath);

                    for (const league of leagues) {
                        const leaguePath = path.join(countryPath, league);
                        const leagueStats = await fs.stat(leaguePath);

                        if (leagueStats.isDirectory()) {
                            const seasons = await fs.readdir(leaguePath);
                            let leagueMatches = 0;
                            let latestUpdate = null;

                            for (const season of seasons) {
                                const seasonPath = path.join(leaguePath, season);
                                const files = await fs.readdir(seasonPath);

                                for (const file of files) {
                                    if (file.endsWith('.json')) {
                                        const filePath = path.join(seasonPath, file);
                                        const fileStats = await fs.stat(filePath);

                                        if (! latestUpdate || fileStats.mtime > latestUpdate) {
                                            latestUpdate = fileStats.mtime;
                                        }

                                        try {
                                            const data = await fs.readJson(filePath);
                                            leagueMatches += Object.keys(data).length;
                                        } catch (error) { // Hibás JSON fájl esetén folytatjuk
                                        }
                                    }
                                }
                            }

                            existingData[country].leagues.push({name: league, matches: leagueMatches, lastUpdated: latestUpdate});
                            existingData[country].totalMatches += leagueMatches;

                            if (! existingData[country].lastUpdated || (latestUpdate && latestUpdate > existingData[country].lastUpdated)) {
                                existingData[country].lastUpdated = latestUpdate;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Hiba a meglévő adatok ellenőrzésekor:', error.message);
        }

        return existingData;
    }

    /**
   * Interaktív kiválasztás indítása
   */
    async startInteractiveSelection() {
        console.log('🎯 Intelligens Liga Kiválasztás');
        console.log('===============================\n');

        try {
            const { createBrowser } = await import('./scraper/browser.js');
            const browser = await createBrowser();

            const { CountryDiscovery } = await import('./scraper/countryDiscovery.js');
            const discovery = new CountryDiscovery(browser);

            let countries = await cacheManager.loadCountriesFromCache();
            if (!countries) {
                countries = await discovery.discoverAvailableCountries();
                await cacheManager.saveCountriesToCache(countries);
            }

            if (countries.length === 0) {
                logger.error('Nem találhatók elérhető országok.');
                await browser.close();
                return;
            }

            const { selectedCountries } = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'selectedCountries',
                    message: 'Válaszd ki a kívánt országokat:',
                    choices: countries.map(c => ({ name: `${c.flag} ${c.displayName}`, value: c })),
                    validate: answer => answer.length > 0 ? true : 'Legalább egy országot válassz ki!'
                }
            ]);

            const finalSelection = [];
            for (const country of selectedCountries) {
                let leagues = await cacheManager.loadLeaguesFromCache(country.name);
                if (!leagues) {
                    leagues = await discovery.discoverCountryLeagues(country.name);
                    if (leagues && leagues.length > 0) {
                        await cacheManager.saveLeaguesToCache(country.name, leagues);
                    }
                }

                if (leagues && leagues.length > 0) {
                    const { selectedLeagueNames } = await inquirer.prompt([
                        {
                            type: 'checkbox',
                            name: 'selectedLeagueNames',
                            message: `Válaszd ki a ligákat (${country.displayName}):`,
                            choices: leagues.map(l => ({ name: l.displayName, value: l.name }))
                        }
                    ]);

                    for (const selectedLeagueName of selectedLeagueNames) {
                        const leagueObject = leagues.find(l => l.name === selectedLeagueName);
                        if (leagueObject) {
                            // NEW: Select season for each chosen league
                            const season = await selectSeason(browser, leagueObject.url); // Pass league URL to get seasons
                            finalSelection.push({ 
                                country: country.name, 
                                leagueName: leagueObject.name, // Base league name
                                leagueDisplayName: leagueObject.displayName, // For logging/display
                                seasonName: season.name, // e.g., "2024-2025"
                                seasonUrl: season.url // Full URL for the season
                            });
                        }
                    }
                }
    }

    await browser.close();

    if (finalSelection.length > 0) {
        console.log('\nKiválasztott ligák és szezonok:');
        finalSelection.forEach(item => {
            console.log(`- ${item.country.toUpperCase()}: ${item.leagueDisplayName} (${item.seasonName})`);
        });

        const { shouldStart } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldStart',
                message: 'Indulhat a scraping a kiválasztott ligákkal és szezonokkal?',
                default: true
            }
        ]);

        if (shouldStart) {
            await this.startCustomScraping(finalSelection);
        }
    } else {
        console.log('Nincs kiválasztott liga vagy szezon. Kilépés.');
    }

        } catch (error) {
            logger.error('Hiba az interaktív kiválasztás során:', error);
        }
    }

    /**
   * Egyedi scraping indítása a kiválasztott országokkal/ligákkal
   */
    async startCustomScraping(selection) {
        console.log('🚀 Egyedi scraping indítása...\n');

        try {
            // The selection now contains country, leagueName, seasonName, seasonUrl
            // We need to adapt AutomatedScraper to handle this new structure.
            // For now, let's just pass it as a new TARGET_LEAGUES structure.
            const customConfig = {
                TARGET_LEAGUES: selection.map(item => ({
                    country: item.country,
                    leagueName: item.leagueName,
                    seasonName: item.seasonName,
                    seasonUrl: item.seasonUrl
                }))
            };

            const customScraper = new AutomatedScraper();

            // Temporarily override CONFIG for this scraping run
            const originalTargetLeagues = CONFIG.TARGET_LEAGUES;
            CONFIG.TARGET_LEAGUES = customConfig.TARGET_LEAGUES;

            await customScraper.start();

            // Restore original CONFIG
            CONFIG.TARGET_LEAGUES = originalTargetLeagues;

            console.log('\n✅ Egyedi scraping befejezve!');

        } catch (error) {
            console.error('❌ Hiba az egyedi scraping során:', error.message);
        }
    }

    /**
   * Liga felfedezés indítása
   */
    async startDiscovery() {
        console.log('🔍 Liga felfedezés indítása...\n');

        try { // Import the new CountryDiscovery class
            const {CountryDiscovery} = await import ('./scraper/countryDiscovery.js');
            const {createBrowser} = await import ('./scraper/browser.js');

            const browser = await createBrowser();
            const discovery = new CountryDiscovery(browser);

            // Discover available countries
            const countries = await discovery.discoverAvailableCountries();

            console.log(`\n✅ ${
                countries.length
            } ország felfedezve:`);
            countries.forEach(country => {
                console.log(`  🏴 ${
                    country.displayName
                } (${
                    country.name
                })`);
            });

            // Optionally discover leagues for the first few countries
            if (countries.length > 0) {
                console.log('\n🏆 Liga felfedezés az első országban...');
                const firstCountry = countries[0];
                const leagues = await discovery.discoverCountryLeagues(firstCountry.name);

                if (leagues.length > 0) {
                    console.log(`\n✅ ${
                        leagues.length
                    } liga találva ${
                        firstCountry.displayName
                    } országban:`);
                    leagues.forEach(league => {
                        console.log(`  ⚽ ${
                            league.displayName
                        } (${
                            league.name
                        })`);
                    });
                }
            }

            await browser.close();
        } catch (error) {
            console.error('❌ Hiba a felfedezés során:', error.message);
        }
    }

    /**
   * Átfogó scraping indítása
   */
    async startComprehensive() {
        console.log('🌟 ÁTFOGÓ SCRAPING indítása - Minden elérhető adat...\n');
        console.log('⚠️  FIGYELEM: Ez több órát is igénybe vehet!');
        console.log('⚠️  A folyamat lassan halad az IP védelem miatt.\n');

        const comprehensiveScraper = new ComprehensiveScraper();
        await comprehensiveScraper.startComprehensiveScraping();
    }

    /**
   * ML datasetek generálása
   */
    async generateMLDatasets() {
        console.log('🤖 ML datasetek generálása...\n');

        try {
            const {MLDataProcessor} = await import ('./utils/mlDataProcessor.js');
            await MLDataProcessor.generateAllMLDatasets();
            console.log('\n✅ ML datasetek sikeresen generálva!');
            console.log('📁 Keresés: scraped_data/*/*/*_ml_dataset.csv');
        } catch (error) {
            console.error('❌ Hiba az ML datasetek generálása során:', error.message);
        }
    }

    /**
   * Cache frissítése
   */
    async refreshCache() {
        console.log('🔄 Cache frissítése...');

        try {
            const { createBrowser } = await import('./scraper/browser.js');
            const browser = await createBrowser();

            await cacheManager.refreshCache(browser);

            await browser.close();
            console.log('✅ Cache frissítése befejezve!');
        } catch (error) {
            console.error('❌ Hiba a cache frissítésekor:', error.message);
        }
    }

    async showCacheStatus() {
        console.log('📋 CACHE ÁLLAPOT');
        console.log('===============');

        try {
            const status = await cacheManager.checkCacheStatus();

            if (status.hasCountriesCache) {
                console.log(`🌍 Országok cache: ✅ (${status.countriesCacheAge} napos)`);
            } else {
                console.log('🌍 Országok cache: ❌ (nem található)');
            }

            console.log(`🏆 Ligák cache: ${status.leaguesCacheCount} ország`);

            if (status.leaguesCacheCount > 0) {
                console.log(`   - Legrégebbi: ${status.oldestLeagueCache} napos`);
                console.log(`   - Legújabb: ${status.newestLeagueCache} napos`);
            }

            // Cache érvényesség ellenőrzése
            const cacheValidDays = 7; // Ugyanaz, mint a CacheManager osztályban

            if (status.hasCountriesCache && status.countriesCacheAge > cacheValidDays) {
                console.log('\n⚠️  Az országok cache elavult, frissítés javasolt!');
            }

            if (status.leaguesCacheCount > 0 && status.oldestLeagueCache > cacheValidDays) {
                console.log('⚠️  Néhány liga cache elavult, frissítés javasolt!');
            }

            console.log('\nCache frissítése:');
            console.log('  npm run refresh-cache');

        } catch (error) {
            console.error('❌ Hiba a cache állapot ellenőrzésekor:', error.message);
        }
    }

  /**
   * Súgó megjelenítése
   */
    showHelp() {
        console.log('🎯 BettingMentor Automatizált Flashscore Scraper');
        console.log('================================================\n');

        console.log('HASZNÁLAT:');
        console.log('  node src/cli.js <parancs>\n');

        console.log('PARANCSOK:');
        console.log('  start         🚀 Scraping indítása (konfigurált ligák)');
        console.log('  select        🎯 Interaktív ország/liga kiválasztás');
        console.log('  comprehensive 🌟 MINDEN elérhető adat letöltése');
        console.log('  discover      🔍 Elérhető országok/ligák felfedezése');
        console.log('  ml-dataset    🤖 ML datasetek generálása (JSON→CSV)');
        console.log('  refresh-cache 🔄 Országok és ligák cache frissítése');
        console.log('  cache-status  📋 Cache állapot megjelenítése');
        console.log('  status        📊 Aktuális státusz');
        console.log('  config        ⚙️  Konfiguráció megjelenítése');
        console.log('  stats         📈 Adatgyűjtési statisztikák');
        console.log('  clean         🧹 Összes adat törlése');
        console.log('  help          ❓ Ez a súgó\n');

        console.log('PÉLDÁK:');
        console.log('  node src/cli.js start');
        console.log('  node src/cli.js select');
        console.log('  node src/cli.js refresh-cache\n');
    }

  /**
   * Adatstatisztikák számítása
   */
  async calculateDataStats() {
    const stats = {
      countries: 0,
      leagues: 0,
      totalMatches: 0,
      files: 0,
      totalSize: 0,
      byCountry: {}
    };

    if (!await fs.pathExists(CONFIG.OUTPUT_BASE_PATH)) {
      return stats;
    }

    const countries = await fs.readdir(CONFIG.OUTPUT_BASE_PATH);
    stats.countries = countries.length;

    for (const country of countries) {
      const countryPath = path.join(CONFIG.OUTPUT_BASE_PATH, country);
      const countryStats = await fs.stat(countryPath);

      if (countryStats.isDirectory()) {
        stats.byCountry[country] = { leagues: 0, matches: 0 };

        const leagues = await fs.readdir(countryPath);
        stats.leagues += leagues.length;
        stats.byCountry[country].leagues = leagues.length;

        for (const league of leagues) {
          const leaguePath = path.join(countryPath, league);
          const leagueStats = await fs.stat(leaguePath);

          if (leagueStats.isDirectory()) {
            const seasons = await fs.readdir(leaguePath);

            for (const season of seasons) {
              const seasonPath = path.join(leaguePath, season);
              const files = await fs.readdir(seasonPath);

              for (const file of files) {
                if (file.endsWith('.json')) {
                  const filePath = path.join(seasonPath, file);
                  const fileStats = await fs.stat(filePath);

                  stats.files++;
                  stats.totalSize += fileStats.size;

                  try {
                    const data = await fs.readJson(filePath);
                    const matchCount = Object.keys(data).length;
                    stats.totalMatches += matchCount;
                    stats.byCountry[country].matches += matchCount;
                  } catch (error) {
                    logger.error(`Hiba a JSON fájl olvasásakor: ${filePath}`, error);
                  }
                }
              }
            }
          }
        }
      }
    }
    return stats;
  }

  /**
   * Bájtok olvasható formátumba formázása
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// CLI indítás
const cli = new CLI();
cli.processCommand(process.argv).catch(error => {
  logger.error('CLI hiba:', error);
  process.exit(1);
});