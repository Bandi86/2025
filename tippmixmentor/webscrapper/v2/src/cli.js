#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { FlashscoreScraper } from './scraper.js';
import { CONFIG } from './config/index.js';
import { logger } from './utils/logger.js';
import { calculateDataStats } from './fileManager.js';

/**
 * CLI interfész a Flashscore Scraper v2-höz
 */
class CLI {
  constructor() {
    this.scraper = new FlashscoreScraper();
  }

  /**
   * Parancsok feldolgozása
   */
  async processCommand(args) {
    const command = args[2] || 'help';

    switch (command) {
      case 'start':
        await this.startScraping();
        break;
      case 'select':
        await this.startInteractiveSelection();
        break;
      case 'discover':
        await this.startDiscovery();
        break;
      case 'comprehensive':
        await this.startComprehensive();
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
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }

  /**
   * Alapértelmezett scraping indítása
   */
  async startScraping() {
    console.log(chalk.blue('🚀 Alapértelmezett scraping indítása...'));
    await this.scraper.start();
  }

  /**
   * Interaktív kiválasztás
   */
  async startInteractiveSelection() {
    console.log(chalk.blue('🎯 Interaktív liga kiválasztás'));
    
    const countries = CONFIG.TARGET_LEAGUES.map(item => item.country);
    
    const { selectedCountries } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedCountries',
        message: 'Válaszd ki a kívánt országokat:',
        choices: countries,
        default: [countries[0]]
      }
    ]);

    if (selectedCountries.length === 0) {
      console.log(chalk.yellow('⚠️ Nincs kiválasztott ország.'));
      return;
    }

    // Kiválasztott országok alapján scraping
    const customConfig = CONFIG.TARGET_LEAGUES.filter(item => 
      selectedCountries.includes(item.country)
    );

    console.log(chalk.green(`✅ Kiválasztott országok: ${selectedCountries.join(', ')}`));
    
    // Ideiglenes config override
    const originalConfig = CONFIG.TARGET_LEAGUES;
    CONFIG.TARGET_LEAGUES = customConfig;
    
    try {
      await this.scraper.start();
    } finally {
      CONFIG.TARGET_LEAGUES = originalConfig;
    }
  }

  /**
   * Liga felfedezés
   */
  async startDiscovery() {
    console.log(chalk.blue('🔍 Liga felfedezés indítása...'));
    console.log(chalk.yellow('⚠️ Ez a funkció még fejlesztés alatt áll.'));
    
    // TODO: Implement discovery functionality
    console.log('Elérhető országok és ligák:');
    CONFIG.TARGET_LEAGUES.forEach(item => {
      console.log(`  🏴 ${item.country}: ${item.leagues.join(', ')}`);
    });
  }

  /**
   * Átfogó scraping
   */
  async startComprehensive() {
    console.log(chalk.red('🌟 ÁTFOGÓ SCRAPING'));
    console.log(chalk.yellow('⚠️ Ez ÓRÁKIG tarthat és sok adatot tölt le!'));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Biztosan folytatod?',
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.gray('Megszakítva.'));
      return;
    }

    console.log(chalk.yellow('⚠️ Átfogó scraping még nem implementált a v2-ben.'));
  }

  /**
   * Státusz megjelenítése
   */
  showStatus() {
    const status = this.scraper.getStatus();
    
    console.log(chalk.blue('📊 SCRAPER STÁTUSZ'));
    console.log(`Fut: ${status.isRunning ? chalk.green('✅ Igen') : chalk.red('❌ Nem')}`);
    console.log(`Összes meccs: ${status.stats.totalMatches}`);
    console.log(`Sikeres: ${chalk.green(status.stats.successfulMatches)}`);
    console.log(`Sikertelen: ${chalk.red(status.stats.failedMatches)}`);
    console.log(`Load more kattintások: ${status.stats.loadMoreClicks}`);
    
    if (status.stats.startTime) {
      const duration = status.stats.endTime 
        ? status.stats.endTime - status.stats.startTime
        : Date.now() - status.stats.startTime;
      const minutes = Math.round(duration / 1000 / 60);
      console.log(`Futási idő: ${minutes} perc`);
    }
  }

  /**
   * Konfiguráció megjelenítése
   */
  showConfig() {
    console.log(chalk.blue('⚙️ KONFIGURÁCIÓ'));
    console.log(`Base URL: ${CONFIG.BASE_URL}`);
    console.log(`Headless: ${CONFIG.HEADLESS}`);
    console.log(`Timeout: ${CONFIG.TIMEOUT}ms`);
    console.log(`Késleltetések:`);
    console.log(`  - Meccsek között: ${CONFIG.DELAY_BETWEEN_MATCHES}ms`);
    console.log(`  - Ligák között: ${CONFIG.DELAY_BETWEEN_LEAGUES}ms`);
    console.log(`  - Országok között: ${CONFIG.DELAY_BETWEEN_COUNTRIES}ms`);
    console.log(`  - Load more után: ${CONFIG.LOAD_MORE_WAIT_TIME}ms`);
    console.log(`Max load more kísérletek: ${CONFIG.MAX_LOAD_MORE_ATTEMPTS}`);
    console.log(`Kimeneti mappa: ${CONFIG.OUTPUT_BASE_PATH}`);
    console.log(`Log szint: ${CONFIG.LOG_LEVEL}`);
    
    console.log(chalk.yellow('\\nCélországok és ligák:'));
    CONFIG.TARGET_LEAGUES.forEach(item => {
      console.log(`  🏴 ${item.country}: ${item.leagues.join(', ')}`);
    });
  }

  /**
   * Statisztikák megjelenítése
   */
  async showStats() {
    console.log(chalk.blue('📈 ADATSTATISZTIKÁK'));
    
    try {
      const stats = await calculateDataStats();
      
      console.log(`Országok száma: ${stats.countries}`);
      console.log(`Ligák száma: ${stats.leagues}`);
      console.log(`Összes meccs: ${stats.totalMatches}`);
      console.log(`Adatok mérete: ${this.formatBytes(stats.totalSize)}`);
      
    } catch (error) {
      console.log(chalk.red('❌ Statisztika lekérési hiba:'), error.message);
    }
  }

  /**
   * Adatok törlése
   */
  async cleanData() {
    console.log(chalk.red('🧹 ADATOK TÖRLÉSE'));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Biztosan törölni akarod az összes letöltött adatot?',
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.gray('Megszakítva.'));
      return;
    }

    console.log(chalk.yellow('⚠️ Adattörlés még nem implementált a v2-ben.'));
  }

  /**
   * Súgó megjelenítése
   */
  showHelp() {
    console.log(chalk.blue('🎯 Flashscore Scraper v2 - Súgó'));
    console.log('================================================\\n');
    
    console.log('HASZNÁLAT:');
    console.log('  node src/cli.js <parancs>\\n');
    
    console.log('PARANCSOK:');
    console.log('  start         🚀 Alapértelmezett scraping indítása');
    console.log('  select        🎯 Interaktív ország/liga kiválasztás');
    console.log('  discover      🔍 Elérhető ligák felfedezése');
    console.log('  comprehensive 🌟 Átfogó scraping (minden adat)');
    console.log('  status        📊 Aktuális státusz');
    console.log('  config        ⚙️  Konfiguráció megjelenítése');
    console.log('  stats         📈 Adatstatisztikák');
    console.log('  clean         🧹 Adatok törlése');
    console.log('  help          ❓ Ez a súgó\\n');
    
    console.log('PÉLDÁK:');
    console.log('  node src/cli.js start');
    console.log('  node src/cli.js select');
    console.log('  npm run start');
    console.log('  npm run select\\n');
    
    console.log(chalk.yellow('💡 Tipp: Használd a "select" parancsot az interaktív kiválasztáshoz!'));
  }

  /**
   * Bájtok formázása
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI futtatása
const cli = new CLI();
cli.processCommand(process.argv).catch(error => {
  logger.error('❌ CLI hiba:', error);
  process.exit(1);
});