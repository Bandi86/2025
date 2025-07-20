import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';

/**
 * Cache kezelő osztály az országok és ligák gyorsítótárazásához
 */
export class CacheManager {
  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache');
    this.countriesCacheFile = path.join(this.cacheDir, 'discovered_countries.json');
    this.leaguesCacheDir = path.join(this.cacheDir, 'leagues');
    this.cacheValidDays = 7; // Cache érvényességi ideje napokban
  }

  /**
   * Cache mappák inicializálása
   */
  async initCacheDirs() {
    await fs.ensureDir(this.cacheDir);
    await fs.ensureDir(this.leaguesCacheDir);
    logger.debug('Cache mappák inicializálva');
  }

  /**
   * Országok mentése a cache-be
   * @param {Array} countries - Országok listája
   */
  async saveCountriesToCache(countries) {
    try {
      await this.initCacheDirs();
      await fs.writeJson(this.countriesCacheFile, countries, { spaces: 2 });
      logger.info(`✅ ${countries.length} ország elmentve a cache-be`);
      return true;
    } catch (error) {
      logger.error('Hiba az országok cache-be mentésekor:', error);
      return false;
    }
  }

  /**
   * Országok betöltése a cache-ből
   * @returns {Array|null} - Országok listája vagy null, ha nincs érvényes cache
   */
  async loadCountriesFromCache() {
    try {
      if (!await fs.pathExists(this.countriesCacheFile)) {
        logger.debug('Országok cache nem található');
        return null;
      }

      const cacheStats = await fs.stat(this.countriesCacheFile);
      const cacheAge = Math.floor((new Date() - cacheStats.mtime) / (1000 * 60 * 60 * 24));
      
      if (cacheAge > this.cacheValidDays) {
        logger.info(`🔄 Országok cache elavult (${cacheAge} napos), frissítés szükséges`);
        return null;
      }

      const countries = await fs.readJson(this.countriesCacheFile);
      logger.info(`📋 Országok cache betöltve (${cacheAge} napos, ${countries.length} ország)`);
      return countries;
    } catch (error) {
      logger.error('Hiba az országok cache betöltésekor:', error);
      return null;
    }
  }

  /**
   * Liga mentése a cache-be
   * @param {string} countryName - Ország neve
   * @param {Array} leagues - Ligák listája
   */
  async saveLeaguesToCache(countryName, leagues) {
    try {
      await this.initCacheDirs();
      const leagueCacheFile = path.join(this.leaguesCacheDir, `${countryName}.json`);
      await fs.writeJson(leagueCacheFile, leagues, { spaces: 2 });
      logger.info(`✅ ${leagues.length} liga elmentve a cache-be (${countryName})`);
      return true;
    } catch (error) {
      logger.error(`Hiba a ligák cache-be mentésekor (${countryName}):`, error);
      return false;
    }
  }

  /**
   * Ligák betöltése a cache-ből
   * @param {string} countryName - Ország neve
   * @returns {Array|null} - Ligák listája vagy null, ha nincs érvényes cache
   */
  async loadLeaguesFromCache(countryName) {
    try {
      const leagueCacheFile = path.join(this.leaguesCacheDir, `${countryName}.json`);
      
      if (!await fs.pathExists(leagueCacheFile)) {
        logger.debug(`Ligák cache nem található: ${countryName}`);
        return null;
      }

      const cacheStats = await fs.stat(leagueCacheFile);
      const cacheAge = Math.floor((new Date() - cacheStats.mtime) / (1000 * 60 * 60 * 24));
      
      if (cacheAge > this.cacheValidDays) {
        logger.info(`🔄 Ligák cache elavult (${countryName}, ${cacheAge} napos), frissítés szükséges`);
        return null;
      }

      const leagues = await fs.readJson(leagueCacheFile);
      logger.info(`📋 Ligák cache betöltve (${countryName}, ${cacheAge} napos, ${leagues.length} liga)`);
      return leagues;
    } catch (error) {
      logger.error(`Hiba a ligák cache betöltésekor (${countryName}):`, error);
      return null;
    }
  }

  /**
   * Cache frissítése
   * @param {Object} browser - Puppeteer browser példány
   */
  async refreshCache(browser) {
    try {
      logger.info('🔄 Cache frissítése...');
      await this.initCacheDirs();

      // Import the CountryDiscovery class
      const { CountryDiscovery } = await import('../scraper/countryDiscovery.js');
      const discovery = new CountryDiscovery(browser);
      
      // Országok felfedezése és mentése
      logger.info('🔍 Elérhető országok felfedezése...');
      const countries = await discovery.discoverAvailableCountries();
      await this.saveCountriesToCache(countries);
      
      // Ligák felfedezése és mentése minden országhoz
      for (const country of countries) {
        logger.info(`🏆 ${country.displayName} ligáinak felfedezése...`);
        const leagues = await discovery.discoverCountryLeagues(country.name);
        
        if (leagues.length > 0) {
          await this.saveLeaguesToCache(country.name, leagues);
        } else {
          logger.warn(`Nem találhatók ligák: ${country.name}`);
        }
      }
      
      logger.info('✅ Cache frissítése befejezve!');
      return true;
    } catch (error) {
      logger.error('Hiba a cache frissítésekor:', error);
      return false;
    }
  }

  /**
   * Cache érvényességének ellenőrzése
   * @returns {Object} - Cache állapot információk
   */
  async checkCacheStatus() {
    try {
      await this.initCacheDirs();
      
      const status = {
        hasCountriesCache: false,
        countriesCacheAge: null,
        leaguesCacheCount: 0,
        oldestLeagueCache: null,
        newestLeagueCache: null
      };
      
      // Országok cache ellenőrzése
      if (await fs.pathExists(this.countriesCacheFile)) {
        const cacheStats = await fs.stat(this.countriesCacheFile);
        status.hasCountriesCache = true;
        status.countriesCacheAge = Math.floor((new Date() - cacheStats.mtime) / (1000 * 60 * 60 * 24));
      }
      
      // Ligák cache ellenőrzése
      if (await fs.pathExists(this.leaguesCacheDir)) {
        const leagueFiles = await fs.readdir(this.leaguesCacheDir);
        status.leaguesCacheCount = leagueFiles.length;
        
        if (leagueFiles.length > 0) {
          let oldest = null;
          let newest = null;
          
          for (const file of leagueFiles) {
            const filePath = path.join(this.leaguesCacheDir, file);
            const stats = await fs.stat(filePath);
            
            if (!oldest || stats.mtime < oldest) {
              oldest = stats.mtime;
            }
            
            if (!newest || stats.mtime > newest) {
              newest = stats.mtime;
            }
          }
          
          if (oldest) {
            status.oldestLeagueCache = Math.floor((new Date() - oldest) / (1000 * 60 * 60 * 24));
          }
          
          if (newest) {
            status.newestLeagueCache = Math.floor((new Date() - newest) / (1000 * 60 * 60 * 24));
          }
        }
      }
      
      return status;
    } catch (error) {
      logger.error('Hiba a cache állapot ellenőrzésekor:', error);
      return {
        hasCountriesCache: false,
        countriesCacheAge: null,
        leaguesCacheCount: 0,
        oldestLeagueCache: null,
        newestLeagueCache: null
      };
    }
  }
}

// Singleton példány exportálása
export const cacheManager = new CacheManager();