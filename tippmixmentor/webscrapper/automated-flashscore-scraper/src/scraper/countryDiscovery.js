import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';
import { openPageAndNavigate } from './browser.js';

/**
 * Tiszta és egyszerű ország felfedezés
 */
export class CountryDiscovery {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Bővített országlista több régióból
   */
  getKnownCountries() {
    return [
      // Európa - Nyugat
      { name: 'england', displayName: 'Anglia', region: 'Nyugat-Európa', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { name: 'spain', displayName: 'Spanyolország', region: 'Nyugat-Európa', flag: '🇪🇸' },
      { name: 'germany', displayName: 'Németország', region: 'Nyugat-Európa', flag: '🇩🇪' },
      { name: 'italy', displayName: 'Olaszország', region: 'Nyugat-Európa', flag: '🇮🇹' },
      { name: 'france', displayName: 'Franciaország', region: 'Nyugat-Európa', flag: '🇫🇷' },
      { name: 'netherlands', displayName: 'Hollandia', region: 'Nyugat-Európa', flag: '🇳🇱' },
      { name: 'portugal', displayName: 'Portugália', region: 'Nyugat-Európa', flag: '🇵🇹' },
      { name: 'belgium', displayName: 'Belgium', region: 'Nyugat-Európa', flag: '🇧🇪' },
      { name: 'austria', displayName: 'Ausztria', region: 'Nyugat-Európa', flag: '🇦🇹' },
      { name: 'switzerland', displayName: 'Svájc', region: 'Nyugat-Európa', flag: '🇨🇭' },
      
      // Európa - Közép/Kelet
      { name: 'hungary', displayName: 'Magyarország', region: 'Közép-Európa', flag: '🇭🇺' },
      { name: 'czech-republic', displayName: 'Csehország', region: 'Közép-Európa', flag: '🇨🇿' },
      { name: 'poland', displayName: 'Lengyelország', region: 'Közép-Európa', flag: '🇵🇱' },
      { name: 'slovakia', displayName: 'Szlovákia', region: 'Közép-Európa', flag: '🇸🇰' },
      { name: 'slovenia', displayName: 'Szlovénia', region: 'Közép-Európa', flag: '🇸🇮' },
      { name: 'croatia', displayName: 'Horvátország', region: 'Közép-Európa', flag: '🇭🇷' },
      { name: 'serbia', displayName: 'Szerbia', region: 'Közép-Európa', flag: '🇷🇸' },
      { name: 'romania', displayName: 'Románia', region: 'Közép-Európa', flag: '🇷🇴' },
      { name: 'bulgaria', displayName: 'Bulgária', region: 'Közép-Európa', flag: '🇧🇬' },
      { name: 'ukraine', displayName: 'Ukrajna', region: 'Közép-Európa', flag: '🇺🇦' },
      
      // Európa - Észak
      { name: 'norway', displayName: 'Norvégia', region: 'Észak-Európa', flag: '🇳🇴' },
      { name: 'sweden', displayName: 'Svédország', region: 'Észak-Európa', flag: '🇸🇪' },
      { name: 'denmark', displayName: 'Dánia', region: 'Észak-Európa', flag: '🇩🇰' },
      { name: 'finland', displayName: 'Finnország', region: 'Észak-Európa', flag: '🇫🇮' },
      { name: 'iceland', displayName: 'Izland', region: 'Észak-Európa', flag: '🇮🇸' },
      
      // Brit-szigetek
      { name: 'scotland', displayName: 'Skócia', region: 'Brit-szigetek', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
      { name: 'wales', displayName: 'Wales', region: 'Brit-szigetek', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
      { name: 'ireland', displayName: 'Írország', region: 'Brit-szigetek', flag: '🇮🇪' },
      { name: 'northern-ireland', displayName: 'Észak-Írország', region: 'Brit-szigetek', flag: '🇬🇧' },
      
      // Mediterrán
      { name: 'greece', displayName: 'Görögország', region: 'Mediterrán', flag: '🇬🇷' },
      { name: 'turkey', displayName: 'Törökország', region: 'Mediterrán', flag: '🇹🇷' },
      { name: 'cyprus', displayName: 'Ciprus', region: 'Mediterrán', flag: '🇨🇾' },
      { name: 'malta', displayName: 'Málta', region: 'Mediterrán', flag: '🇲🇹' },
      
      // Amerika - Észak
      { name: 'usa', displayName: 'USA', region: 'Észak-Amerika', flag: '🇺🇸' },
      { name: 'canada', displayName: 'Kanada', region: 'Észak-Amerika', flag: '🇨🇦' },
      { name: 'mexico', displayName: 'Mexikó', region: 'Észak-Amerika', flag: '🇲🇽' },
      
      // Amerika - Dél
      { name: 'brazil', displayName: 'Brazília', region: 'Dél-Amerika', flag: '🇧🇷' },
      { name: 'argentina', displayName: 'Argentína', region: 'Dél-Amerika', flag: '🇦🇷' },
      { name: 'chile', displayName: 'Chile', region: 'Dél-Amerika', flag: '🇨🇱' },
      { name: 'colombia', displayName: 'Kolumbia', region: 'Dél-Amerika', flag: '🇨🇴' },
      { name: 'uruguay', displayName: 'Uruguay', region: 'Dél-Amerika', flag: '🇺🇾' },
      { name: 'peru', displayName: 'Peru', region: 'Dél-Amerika', flag: '🇵🇪' },
      { name: 'ecuador', displayName: 'Ecuador', region: 'Dél-Amerika', flag: '🇪🇨' },
      { name: 'venezuela', displayName: 'Venezuela', region: 'Dél-Amerika', flag: '🇻🇪' },
      { name: 'bolivia', displayName: 'Bolívia', region: 'Dél-Amerika', flag: '🇧🇴' },
      { name: 'paraguay', displayName: 'Paraguay', region: 'Dél-Amerika', flag: '🇵🇾' },
      
      // Ázsia
      { name: 'japan', displayName: 'Japán', region: 'Ázsia', flag: '🇯🇵' },
      { name: 'south-korea', displayName: 'Dél-Korea', region: 'Ázsia', flag: '🇰🇷' },
      { name: 'china', displayName: 'Kína', region: 'Ázsia', flag: '🇨🇳' },
      { name: 'india', displayName: 'India', region: 'Ázsia', flag: '🇮🇳' },
      { name: 'thailand', displayName: 'Thaiföld', region: 'Ázsia', flag: '🇹🇭' },
      { name: 'malaysia', displayName: 'Malajzia', region: 'Ázsia', flag: '🇲🇾' },
      { name: 'singapore', displayName: 'Szingapúr', region: 'Ázsia', flag: '🇸🇬' },
      { name: 'indonesia', displayName: 'Indonézia', region: 'Ázsia', flag: '🇮🇩' },
      
      // Óceánia
      { name: 'australia', displayName: 'Ausztrália', region: 'Óceánia', flag: '🇦🇺' },
      { name: 'new-zealand', displayName: 'Új-Zéland', region: 'Óceánia', flag: '🇳🇿' },
      
      // Afrika
      { name: 'south-africa', displayName: 'Dél-Afrika', region: 'Afrika', flag: '🇿🇦' },
      { name: 'egypt', displayName: 'Egyiptom', region: 'Afrika', flag: '🇪🇬' },
      { name: 'morocco', displayName: 'Marokkó', region: 'Afrika', flag: '🇲🇦' },
      { name: 'tunisia', displayName: 'Tunézia', region: 'Afrika', flag: '🇹🇳' },
      { name: 'algeria', displayName: 'Algéria', region: 'Afrika', flag: '🇩🇿' },
      { name: 'nigeria', displayName: 'Nigéria', region: 'Afrika', flag: '🇳🇬' },
      { name: 'ghana', displayName: 'Ghána', region: 'Afrika', flag: '🇬🇭' },
      
      // Közel-Kelet
      { name: 'israel', displayName: 'Izrael', region: 'Közel-Kelet', flag: '🇮🇱' },
      { name: 'saudi-arabia', displayName: 'Szaúd-Arábia', region: 'Közel-Kelet', flag: '🇸🇦' },
      { name: 'uae', displayName: 'Egyesült Arab Emirátusok', region: 'Közel-Kelet', flag: '🇦🇪' },
      { name: 'qatar', displayName: 'Katar', region: 'Közel-Kelet', flag: '🇶🇦' }
    ];
  }

  /**
   * Ellenőrzi, hogy egy ország elérhető-e a Flashscore-on
   */
  async testCountryAvailability(country) {
    try {
      const testUrl = `${CONFIG.BASE_URL}/football/${country.name}/`;
      const page = await openPageAndNavigate(this.browser, testUrl);
      
      // Várjunk egy kicsit, hogy az oldal betöltődjön
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ellenőrizzük, hogy van-e tartalom az oldalon
      const hasContent = await page.evaluate(() => {
        // Keressünk liga linkeket vagy meccs adatokat
        const leagueLinks = document.querySelectorAll('a[href*="/football/"]');
        const matchElements = document.querySelectorAll('[class*="match"], [class*="event"], [class*="league"]');
        const titleElement = document.querySelector('title');
        
        // Ellenőrizzük, hogy nem 404 oldal-e
        const is404 = titleElement && titleElement.textContent.includes('404');
        
        return !is404 && (leagueLinks.length > 3 || matchElements.length > 0);
      });
      
      await page.close();
      
      return hasContent;
      
    } catch (error) {
      logger.debug(`Hiba ${country.name} tesztelése során: ${error.message}`);
      return false;
    }
  }

  /**
   * Felfedezi az elérhető országokat
   */
  async discoverAvailableCountries() {
    logger.info('🌍 Elérhető országok felfedezése...');
    
    const knownCountries = this.getKnownCountries();
    const availableCountries = [];
    
    // Teszteljük az összes országot
    const countriesToTest = knownCountries;
    
    for (const country of countriesToTest) {
      logger.info(`🔍 Tesztelés: ${country.displayName} (${country.name})`);
      
      const isAvailable = await this.testCountryAvailability(country);
      
      if (isAvailable) {
        const countryWithUrl = {
          ...country,
          url: `${CONFIG.BASE_URL}/football/${country.name}/`
        };
        availableCountries.push(countryWithUrl);
        logger.info(`✅ ${country.displayName} - elérhető`);
      } else {
        logger.info(`❌ ${country.displayName} - nem elérhető vagy nincs tartalom`);
      }
    }
    
    // Ha nem találtunk semmit, adjunk vissza egy alapértelmezett listát
    if (availableCountries.length === 0) {
      logger.info('🔄 Alapértelmezett országlista használata...');
      const defaultCountries = [
        { name: 'hungary', displayName: 'Magyarország', url: `${CONFIG.BASE_URL}/football/hungary/` },
        { name: 'england', displayName: 'Anglia', url: `${CONFIG.BASE_URL}/football/england/` },
        { name: 'germany', displayName: 'Németország', url: `${CONFIG.BASE_URL}/football/germany/` },
        { name: 'spain', displayName: 'Spanyolország', url: `${CONFIG.BASE_URL}/football/spain/` },
        { name: 'czech-republic', displayName: 'Csehország', url: `${CONFIG.BASE_URL}/football/czech-republic/` }
      ];
      
      return defaultCountries;
    }
    
    logger.info(`✅ ${availableCountries.length} ország sikeresen felfedezve:`);
    availableCountries.forEach(country => {
      logger.info(`   - ${country.displayName} (${country.name})`);
    });
    
    return availableCountries;
  }

  /**
   * Egy ország ligáinak felfedezése
   */
  async discoverCountryLeagues(countryName) {
    logger.info(`🏆 ${countryName} ligáinak felfedezése...`);
    
    try {
      const url = `${CONFIG.BASE_URL}/football/${countryName}/`;
      const page = await openPageAndNavigate(this.browser, url);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const leagues = await page.evaluate((countryName) => {
        const results = [];
        
        // Próbáljunk különböző szelektorokat
        const selectors = [
          'a[href*="/football/"]',
          'a[href*="/' + countryName + '/"]',
          '.leagues a',
          '.tournament a',
          '.competition a',
          '[class*="league"] a',
          '[class*="tournament"] a',
          '[class*="competition"] a'
        ];
        
        selectors.forEach(selector => {
          try {
            const links = document.querySelectorAll(selector);
            
            links.forEach(link => {
              const href = link.getAttribute('href');
              const text = link.textContent?.trim();
              
              if (href && text && text.length > 2) {
                // Ellenőrizzük, hogy a link az adott országhoz tartozik-e
                if (href.includes(`/${countryName}/`) || href.includes(`football/${countryName}`)) {
                  const pathParts = href.split('/');
                  let leagueName = '';
                  
                  // Próbáljuk megtalálni a liga nevét az URL-ben
                  for (let i = 0; i < pathParts.length; i++) {
                    if (pathParts[i] === countryName && i + 1 < pathParts.length) {
                      leagueName = pathParts[i + 1];
                      break;
                    }
                  }
                  
                  // Ha nem találtunk liga nevet az URL-ben, használjuk a szöveget
                  if (!leagueName) {
                    leagueName = text.toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9\-]/g, '');
                  }
                  
                  // Csak akkor adjuk hozzá, ha még nincs benne
                  const exists = results.some(r => r.name === leagueName || r.displayName === text);
                  
                  if (!exists && leagueName) {
                    results.push({
                      name: leagueName,
                      displayName: text,
                      url: href.startsWith('http') ? href : `https://www.flashscore.com${href}`
                    });
                  }
                }
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });
        
        // Ha még mindig nincs eredmény, próbáljunk minden linket
        if (results.length === 0) {
          const allLinks = document.querySelectorAll('a');
          
          allLinks.forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent?.trim();
            
            if (href && text && text.length > 2 && 
                (href.includes(`/${countryName}/`) || href.includes(`football/${countryName}`))) {
              
              const leagueName = text.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9\-]/g, '');
              
              const exists = results.some(r => r.displayName === text);
              
              if (!exists && leagueName) {
                results.push({
                  name: leagueName,
                  displayName: text,
                  url: href.startsWith('http') ? href : `https://www.flashscore.com${href}`
                });
              }
            }
          });
        }
        
        // Szűrjük ki a túl rövid vagy gyanús neveket
        const filtered = results.filter(league => 
          league.displayName.length > 3 && 
          !league.displayName.toLowerCase().includes('more') &&
          !league.displayName.toLowerCase().includes('show') &&
          !league.displayName.toLowerCase().includes('view')
        );
        
        return filtered.slice(0, 20); // Növeljük a limitet 20-ra
      }, countryName);
      
      await page.close();
      
      logger.info(`✅ ${leagues.length} liga találva ${countryName} országban`);
      leagues.forEach(league => {
        logger.info(`   - ${league.displayName} (${league.name})`);
      });
      
      return leagues;
      
    } catch (error) {
      logger.error(`Hiba ${countryName} ligáinak felfedezése során:`, error);
      return [];
    }
  }
}