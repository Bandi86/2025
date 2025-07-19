#!/usr/bin/env node

import { AutomatedScraper } from './scraper/automatedScraper.js';
import { ComprehensiveScraper } from './scraper/comprehensiveScraper.js';
import { logger } from './utils/logger.js';
import { CONFIG } from './config/index.js';
import fs from 'fs-extra';
import path from 'path';

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

      case 'comprehensive':
        await this.startComprehensive();
        break;

      case 'ml-dataset':
        await this.generateMLDatasets();
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
    console.log(`Futás: ${status.isRunning ? '🟢 AKTÍV' : '🔴 LEÁLLÍTVA'}`);
    console.log(`Összes meccs: ${status.stats.totalMatches}`);
    console.log(`Sikeres: ${status.stats.successfulMatches}`);
    console.log(`Sikertelen: ${status.stats.failedMatches}`);
    
    if (status.stats.startTime) {
      const duration = (new Date() - status.stats.startTime) / 1000 / 60;
      console.log(`Futási idő: ${Math.round(duration)} perc`);
    }
  }

  /**
   * Konfiguráció megjelenítése
   */
  showConfig() {
    console.log('⚙️  KONFIGURÁCIÓ');
    console.log('================');
    console.log(`Meccsek közötti késleltetés: ${CONFIG.DELAY_BETWEEN_MATCHES}ms`);
    console.log(`Ligák közötti késleltetés: ${CONFIG.DELAY_BETWEEN_LEAGUES}ms`);
    console.log(`Országok közötti késleltetés: ${CONFIG.DELAY_BETWEEN_COUNTRIES}ms`);
    console.log(`Fájlformátum: ${CONFIG.FILE_FORMAT.toUpperCase()}`);
    console.log(`Kimeneti mappa: ${CONFIG.OUTPUT_BASE_PATH}`);
    console.log(`Headless mód: ${CONFIG.HEADLESS ? 'BE' : 'KI'}`);
    
    console.log('\n🎯 CÉLLIGÁK:');
    CONFIG.TARGET_LEAGUES.forEach(country => {
      console.log(`  ${country.country.toUpperCase()}:`);
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
      
      console.log(`Összes ország: ${stats.countries}`);
      console.log(`Összes liga: ${stats.leagues}`);
      console.log(`Összes meccs: ${stats.totalMatches}`);
      console.log(`Fájlok száma: ${stats.files}`);
      console.log(`Összes fájlméret: ${this.formatBytes(stats.totalSize)}`);
      
      console.log('\n📁 ORSZÁGONKÉNTI BONTÁS:');
      Object.entries(stats.byCountry).forEach(([country, data]) => {
        console.log(`  ${country.toUpperCase()}: ${data.matches} meccs, ${data.leagues} liga`);
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
   * Liga felfedezés indítása
   */
  async startDiscovery() {
    console.log('🔍 Liga felfedezés indítása...\n');
    const comprehensiveScraper = new ComprehensiveScraper();
    
    try {
      comprehensiveScraper.browser = await import('./scraper/browser.js').then(m => m.createBrowser());
      const countries = await comprehensiveScraper.discoverAllCountries();
      
      console.log(`\n✅ ${countries.length} ország felfedezve:`);
      countries.forEach(country => {
        console.log(`  🏴 ${country.displayName} (${country.name})`);
      });
      
      await comprehensiveScraper.cleanup();
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
      const { MLDataProcessor } = await import('./utils/mlDataProcessor.js');
      await MLDataProcessor.generateAllMLDatasets();
      console.log('\n✅ ML datasetek sikeresen generálva!');
      console.log('📁 Keresés: scraped_data/*/*/*_ml_dataset.csv');
    } catch (error) {
      console.error('❌ Hiba az ML datasetek generálása során:', error.message);
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
    console.log('  comprehensive 🌟 MINDEN elérhető adat letöltése');
    console.log('  discover      🔍 Elérhető országok/ligák felfedezése');
    console.log('  ml-dataset    🤖 ML datasetek generálása (JSON→CSV)');
    console.log('  status        📊 Aktuális státusz');
    console.log('  config        ⚙️  Konfiguráció megjelenítése');
    console.log('  stats         📈 Adatgyűjtési statisztikák');
    console.log('  clean         🧹 Összes adat törlése');
    console.log('  help          ❓ Ez a súgó\n');
    
    console.log('PÉLDÁK:');
    console.log('  node src/cli.js start');
    console.log('  node src/cli.js status');
    console.log('  node src/cli.js stats\n');
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
        stats.byCountry[country].leagues = leagues.length;
        stats.leagues += leagues.length;

        for (const league of leagues) {
          const leaguePath = path.join(countryPath, league);
          const leagueStats = await fs.stat(leaguePath);
          
          if (leagueStats.isDirectory()) {
            const seasons = await fs.readdir(leaguePath);
            
            for (const season of seasons) {
              const seasonPath = path.join(leaguePath, season);
              const files = await fs.readdir(seasonPath);
              
              for (const file of files) {
                const filePath = path.join(seasonPath, file);
                const fileStats = await fs.stat(filePath);
                
                if (fileStats.isFile()) {
                  stats.files++;
                  stats.totalSize += fileStats.size;
                  
                  // JSON fájlok esetén meccsek számolása
                  if (file.endsWith('.json')) {
                    try {
                      const data = await fs.readJson(filePath);
                      const matchCount = Object.keys(data).length;
                      stats.totalMatches += matchCount;
                      stats.byCountry[country].matches += matchCount;
                    } catch (error) {
                      // Hibás JSON fájl esetén folytatjuk
                    }
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
   * Byte-ok formázása olvasható formátumba
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI indítása
const cli = new CLI();
cli.processCommand(process.argv).catch(error => {
  logger.error('CLI hiba:', error);
  process.exit(1);
});