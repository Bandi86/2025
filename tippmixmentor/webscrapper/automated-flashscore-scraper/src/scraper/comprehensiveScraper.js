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
      // Próbáljunk több különböző URL-t
      const urls = [
        `${CONFIG.BASE_URL}/football/`,
        `${CONFIG.BASE_URL}/`,
        `${CONFIG.BASE_URL}/football/europe/`,
        `${CONFIG.BASE_URL}/football/world/`
      ];
      
      let countries = [];
      
      for (const url of urls) {
        logger.info(`🔍 Próbálkozás: ${url}`);
        
        try {
          const page = await openPageAndNavigate(this.browser, url);
          
          // Várjuk meg, hogy az oldal betöltődjön
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Próbáljunk meg screenshot-ot készíteni debug céljából
          try {
            await page.screenshot({ path: 'debug_flashscore.png', fullPage: false });
            logger.info('📸 Debug screenshot készítve: debug_flashscore.png');
          } catch (screenshotError) {
            logger.debug('Screenshot hiba:', screenshotError.message);
          }
          
          // Keressük meg az összes linket, ami football-hoz kapcsolódik
          countries = await page.evaluate(() => {
            const results = [];
            
            // Keressük meg az összes linket
            const allLinks = document.querySelectorAll('a');
            
            allLinks.forEach(link => {
              const href = link.getAttribute('href');
              const text = link.textContent?.trim();
              
              if (href && text) {
                // Ellenőrizzük, hogy football URL-e
                if (href.includes('/football/') && !href.includes('#') && !href.includes('?')) {
                  const pathParts = href.split('/');
                  
                  // Keressük meg a football index-et
                  const footballIndex = pathParts.indexOf('football');
                  if (footballIndex >= 0 && footballIndex + 1 < pathParts.length) {
                    const countryName = pathParts[footballIndex + 1];
                    
                    // Szűrjük ki a nem ország neveket
                    const excludeList = [
                      'live', 'results', 'fixtures', 'standings', 'archive', 
                      'world', 'europe', 'asia', 'africa', 'america', 'oceania',
                      'champions-league', 'europa-league', 'world-cup', 'euro',
                      'my-leagues', 'favourites', 'news', 'transfers'
                    ];
                    
                    if (countryName && 
                        countryName.length > 1 && 
                        !excludeList.includes(countryName) &&
                        !countryName.includes('-cup') &&
                        !countryName.includes('-league') &&
                        text.length > 2 && text.length < 50) {
                      
                      results.push({
                        name: countryName,
                        displayName: text,
                        url: href.startsWith('http') ? href : `https://www.flashscore.com${href}`
                      });
                    }
                  }
                }
              }
            });
            
            // Távolítsuk el a duplikátumokat és rendezzük ABC sorrendbe
            const unique = results.filter((country, index, self) => 
              index === self.findIndex(c => c.name === country.name)
            );
            
            return unique.sort((a, b) => a.displayName.localeCompare(b.displayName));
          });
          
          await page.close();
          
          if (countries.length > 0) {
            logger.info(`✅ ${countries.length} ország találva a ${url} oldalon`);
            break;
          }
          
        } catch (pageError) {
          logger.debug(`Hiba a ${url} oldal feldolgozásakor:`, pageError.message);
          continue;
        }
      }
      
      // Ha még mindig nincs eredmény, használjunk egy előre definiált listát
      if (countries.length === 0) {
        logger.info('🔧 Előre definiált országlista használata...');
        countries = [
          { name: 'hungary', displayName: 'Magyarország', url: `${CONFIG.BASE_URL}/football/hungary/` },
          { name: 'england', displayName: 'Anglia', url: `${CONFIG.BASE_URL}/football/england/` },
          { name: 'spain', displayName: 'Spanyolország', url: `${CONFIG.BASE_URL}/football/spain/` },
          { name: 'germany', displayName: 'Németország', url: `${CONFIG.BASE_URL}/football/germany/` },
          { name: 'italy', displayName: 'Olaszország', url: `${CONFIG.BASE_URL}/football/italy/` },
          { name: 'france', displayName: 'Franciaország', url: `${CONFIG.BASE_URL}/football/france/` },
          { name: 'portugal', displayName: 'Portugália', url: `${CONFIG.BASE_URL}/football/portugal/` },
          { name: 'netherlands', displayName: 'Hollandia', url: `${CONFIG.BASE_URL}/football/netherlands/` },
          { name: 'belgium', displayName: 'Belgium', url: `${CONFIG.BASE_URL}/football/belgium/` },
          { name: 'czech-republic', displayName: 'Csehország', url: `${CONFIG.BASE_URL}/football/czech-republic/` },
          { name: 'poland', displayName: 'Lengyelország', url: `${CONFIG.BASE_URL}/football/poland/` },
          { name: 'austria', displayName: 'Ausztria', url: `${CONFIG.BASE_URL}/football/austria/` },
          { name: 'switzerland', displayName: 'Svájc', url: `${CONFIG.BASE_URL}/football/switzerland/` },
          { name: 'croatia', displayName: 'Horvátország', url: `${CONFIG.BASE_URL}/football/croatia/` },
          { name: 'serbia', displayName: 'Szerbia', url: `${CONFIG.BASE_URL}/football/serbia/` },
          { name: 'romania', displayName: 'Románia', url: `${CONFIG.BASE_URL}/football/romania/` },
          { name: 'slovakia', displayName: 'Szlovákia', url: `${CONFIG.BASE_URL}/football/slovakia/` },
          { name: 'slovenia', displayName: 'Szlovénia', url: `${CONFIG.BASE_URL}/football/slovenia/` },
          { name: 'brazil', displayName: 'Brazília', url: `${CONFIG.BASE_URL}/football/brazil/` },
          { name: 'argentina', displayName: 'Argentína', url: `${CONFIG.BASE_URL}/football/argentina/` },
          { name: 'usa', displayName: 'USA', url: `${CONFIG.BASE_URL}/football/usa/` },
          { name: 'mexico', displayName: 'Mexikó', url: `${CONFIG.BASE_URL}/football/mexico/` }
        ];
      }
      
      this.allCountries = countries;
      logger.info(`✅ ${countries.length} ország felfedezve`);
      
      // Log some examples for debugging
      if (countries.length > 0) {
        logger.info(`Első 10 ország: ${countries.slice(0, 10).map(c => c.displayName).join(', ')}`);
      }
      
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
      
      // Várjuk meg, hogy az oldal betöltődjön
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Próbáljunk különböző selectorokat a ligákhoz
      const selectors = [
        '.leagues__item a',
        '.league-item a',
        'a[href*="/football/"]',
        '.sidebar a',
        '.menu a'
      ];
      
      let leagues = [];
      
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          
          leagues = await page.evaluate((sel, countryName) => {
            const elements = document.querySelectorAll(sel);
            const results = [];
            
            elements.forEach(link => {
              const href = link.getAttribute('href');
              const text = link.textContent?.trim();
              
              if (href && text && href.includes('/football/') && href.includes(countryName)) {
                const parts = href.split('/');
                const footballIndex = parts.indexOf('football');
                
                if (footballIndex >= 0 && footballIndex + 2 < parts.length) {
                  const countryPart = parts[footballIndex + 1];
                  const leagueName = parts[footballIndex + 2];
                  
                  // Csak akkor adjuk hozzá, ha ez valóban egy liga
                  if (countryPart === countryName && 
                      leagueName && 
                      leagueName.length > 3 &&
                      !leagueName.includes('archive') &&
                      !leagueName.includes('results') &&
                      !leagueName.includes('fixtures') &&
                      !leagueName.includes('standings') &&
                      text.length > 3 && text.length < 100) {
                    
                    results.push({
                      name: leagueName,
                      displayName: text,
                      url: href.startsWith('http') ? href : `https://www.flashscore.com${href}`,
                      country: countryPart
                    });
                  }
                }
              }
            });
            
            // Távolítsuk el a duplikátumokat
            const unique = results.filter((league, index, self) => 
              index === self.findIndex(l => l.name === league.name)
            );
            
            return unique;
          }, selector, countryName);
          
          if (leagues.length > 0) {
            logger.info(`✅ Ligák találva a '${selector}' selector használatával`);
            break;
          }
        } catch (selectorError) {
          logger.debug(`Selector '${selector}' nem található, próbálkozás a következővel...`);
          continue;
        }
      }
      
      // Ha még mindig nincs eredmény, próbáljunk egy általános megközelítést
      if (leagues.length === 0) {
        logger.info(`🔍 Általános keresés indítása: ${countryName}`);
        leagues = await page.evaluate((country) => {
          const allLinks = document.querySelectorAll('a');
          const results = [];
          
          allLinks.forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent?.trim();
            
            if (href && text && href.includes(`/football/${country}/`)) {
              const parts = href.split('/');
              const footballIndex = parts.indexOf('football');
              
              if (footballIndex >= 0 && footballIndex + 2 < parts.length) {
                const leagueName = parts[footballIndex + 2];
                
                if (leagueName && 
                    leagueName.length > 3 &&
                    !['results', 'fixtures', 'standings', 'archive', 'live'].includes(leagueName) &&
                    text.length > 3 && text.length < 100) {
                  
                  results.push({
                    name: leagueName,
                    displayName: text,
                    url: href.startsWith('http') ? href : `https://www.flashscore.com${href}`,
                    country: country
                  });
                }
              }
            }
          });
          
          // Távolítsuk el a duplikátumokat és rendezzük ABC sorrendbe
          const unique = results.filter((league, index, self) => 
            index === self.findIndex(l => l.name === league.name)
          );
          
          return unique.sort((a, b) => a.displayName.localeCompare(b.displayName));
        }, countryName);
      }
      
      // Ha még mindig nincs eredmény, használjunk előre definiált ligákat a főbb országokhoz
      if (leagues.length === 0) {
        const predefinedLeagues = {
          'hungary': [
            { name: 'nb-i-2024-2025', displayName: 'NB I 2024/2025', country: 'hungary' },
            { name: 'nb-ii-2024-2025', displayName: 'NB II 2024/2025', country: 'hungary' }
          ],
          'england': [
            { name: 'premier-league-2024-2025', displayName: 'Premier League 2024/2025', country: 'england' },
            { name: 'championship-2024-2025', displayName: 'Championship 2024/2025', country: 'england' }
          ],
          'spain': [
            { name: 'laliga-2024-2025', displayName: 'La Liga 2024/2025', country: 'spain' },
            { name: 'segunda-division-2024-2025', displayName: 'Segunda División 2024/2025', country: 'spain' }
          ],
          'germany': [
            { name: 'bundesliga-2024-2025', displayName: 'Bundesliga 2024/2025', country: 'germany' },
            { name: '2-bundesliga-2024-2025', displayName: '2. Bundesliga 2024/2025', country: 'germany' }
          ],
          'italy': [
            { name: 'serie-a-2024-2025', displayName: 'Serie A 2024/2025', country: 'italy' },
            { name: 'serie-b-2024-2025', displayName: 'Serie B 2024/2025', country: 'italy' }
          ],
          'france': [
            { name: 'ligue-1-2024-2025', displayName: 'Ligue 1 2024/2025', country: 'france' },
            { name: 'ligue-2-2024-2025', displayName: 'Ligue 2 2024/2025', country: 'france' }
          ],
          'czech-republic': [
            { name: 'fortuna-liga-2024-2025', displayName: 'Fortuna Liga 2024/2025', country: 'czech-republic' }
          ]
        };
        
        if (predefinedLeagues[countryName]) {
          leagues = predefinedLeagues[countryName].map(league => ({
            ...league,
            url: `${CONFIG.BASE_URL}/football/${countryName}/${league.name}/`
          }));
          logger.info(`🔧 Előre definiált ligák használata: ${countryName}`);
        }
      }
      
      await page.close();
      
      logger.info(`✅ ${leagues.length} liga találva: ${countryName}`);
      
      // Log some examples for debugging
      if (leagues.length > 0) {
        logger.info(`Ligák: ${leagues.map(l => l.displayName).join(', ')}`);
      }
      
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
        // Extract season name from league.url for consistent logging and file naming
        const seasonMatch = league.url.match(/\/([0-9]{4}-[0-9]{4})\/results/);
        const seasonName = seasonMatch ? seasonMatch[1] : 'unknown-season';

        await this.scrapeLeague(country.name, league.name, seasonName, league.url);
        
        // Ligák közötti szünet
        await delay(CONFIG.DELAY_BETWEEN_LEAGUES, `Szünet ligák között`);
        
        // Felfedezett ligák nyilvántartása
        this.discoveredLeagues.add(`${country.name}/${league.name}/${seasonName}`);
        
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
      const [country, league, season] = leagueKey.split('/');
      if (!leaguesByCountry[country]) {
        leaguesByCountry[country] = [];
      }
      // Add season to the league entry
      leaguesByCountry[country].push(`${league}-${season}`);
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