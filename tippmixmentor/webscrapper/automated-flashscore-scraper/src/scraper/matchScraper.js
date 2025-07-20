import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { delay, randomDelay } from '../utils/delay.js';
import { openPageAndNavigate, waitForSelectorSafe, waitAndClick } from './browser.js';
import { analyzeHtmlStructure, findAllSelectors } from '../utils/debugTools.js';

/**
 * Liga meccs ID-k lekérése
 * @param {Object} browser - Puppeteer browser példány
 * @param {string} country - Ország neve
 * @param {string} league - Liga neve
 */
export const getMatchIdList = async (browser, country, league) => {
  const leagueUrl = `${CONFIG.BASE_URL}/football/${country}/${league}/results`;
  logger.info(`Meccs ID-k lekérése: ${leagueUrl}`);
  
  try {
    const page = await openPageAndNavigate(browser, leagueUrl);
    
    // Get current season from URL
    const currentSeason = page.url().match(/\/([0-9]{4}-[0-9]{4})\/results/)?.[1] || '2024-2025';

    // "Show more" gombok kattintása az összes meccs betöltéséhez
    let clickCount = 0;
    while (clickCount < 50) { // Maximum 50 kattintás a végtelen ciklus elkerülésére
      const clicked = await waitAndClick(page, 'a.event__more.event__more--static');
      if (!clicked) break;
      
      clickCount++;
      await randomDelay(1000, 3000, 'Show more button delay');
      
      if (clickCount % 10 === 0) {
        logger.info(`${clickCount} "Show more" gomb megnyomva`);
      }
    }
    
    // Meccsek várakozása - frissített selectorok
    const matchSelectors = [
      '.event__match.event__match--static.event__match--twoLine',
      '.event__match--static',
      '.event__match',
      '[id^="g_1_"]'
    ];
    
    let selectorFound = false;
    for (const selector of matchSelectors) {
      const found = await waitForSelectorSafe(page, selector, 5000);
      if (found) {
        logger.info(`Meccs selector találva: ${selector}`);
        selectorFound = true;
        break;
      }
    }
    
    if (!selectorFound) {
      logger.warn(`Nem találhatók meccs selectorok: ${country}/${league}`);
      
      // Debug eszközök használata a HTML struktúra elemzéséhez
      await page.screenshot({ path: `debug_${country}_${league}.png` });
      logger.info(`Debug képernyőkép mentve: debug_${country}_${league}.png`);
      
      // HTML struktúra elemzése
      await analyzeHtmlStructure(page, 'body', `${country}_${league}_structure`);
      
      // Meccs és esemény selectorok keresése
      await findAllSelectors(page, 'match', `${country}_${league}_match_selectors`);
      await findAllSelectors(page, 'event', `${country}_${league}_event_selectors`);
      
      logger.info(`HTML struktúra elemzés befejezve: ${country}/${league}`);
    }
    
    const matchIdList = await page.evaluate(() => {
      // Több selector próbálása
      const selectors = [
        '.event__match.event__match--static.event__match--twoLine',
        '.event__match--static',
        '.event__match',
        '[id^="g_1_"]'
      ];
      
      let elements = [];
      for (const selector of selectors) {
        elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) {
          console.log(`Selector találva: ${selector} (${elements.length} db)`);
          break;
        }
      }
      
      return elements.map((element) => {
        const id = element?.id;
        if (id && id.startsWith('g_1_')) {
          return id.replace('g_1_', '');
        }
        return null;
      }).filter(id => id && id.length > 0);
    });
    
    await page.close();
    
    logger.info(`${matchIdList.length} meccs ID lekérve: ${country}/${league}`);
    return { matchIds: matchIdList, season: currentSeason };
    
  } catch (error) {
    logger.error(`Hiba a meccs ID-k lekérésekor: ${country}/${league}`, error);
    return { matchIds: [], season: '2024-2025' };
  }
};

/**
 * Elérhető szezonok lekérése egy ligához
 * @param {Object} browser - Puppeteer browser példány
 * @param {string} country - Ország neve
 * @param {string} league - Liga neve
 */
export const getAvailableSeasons = async (browser, country, league) => {
  const leagueUrl = `${CONFIG.BASE_URL}/football/${country}/${league}/results`;
  logger.info(`Szezonok lekérése: ${leagueUrl}`);

  try {
    const page = await openPageAndNavigate(browser, leagueUrl);

    // Várjuk meg a szezonválasztó elemet
    await waitForSelectorSafe(page, '.team-season-selector');

    const seasons = await page.evaluate(() => {
      const seasonElements = document.querySelectorAll('.team-season-selector a');
      return Array.from(seasonElements).map(el => el.textContent.trim());
    });

    await page.close();
    logger.info(`${seasons.length} szezon lekérve: ${country}/${league}`);
    return seasons;

  } catch (error) {
    logger.error(`Hiba a szezonok lekérésekor: ${country}/${league}`, error);
    return [];
  }
};

/**
 * Egyedi meccs adatok lekérése
 * @param {Object} browser - Puppeteer browser példány
 * @param {string} matchId - Meccs ID
 */
export const getMatchData = async (browser, matchId) => {
  const matchUrl = `${CONFIG.BASE_URL}/match/${matchId}/#/match-summary/match-summary`;
  
  try {
    const page = await openPageAndNavigate(browser, matchUrl);
    
    // Alapadatok várakozása
    await waitForSelectorSafe(page, '.duelParticipant__startTime');
    await waitForSelectorSafe(page, "div[data-testid='wcl-summaryMatchInformation'] > div");
    
    const matchData = await extractMatchData(page);
    const information = await extractMatchInformation(page);
    
    // Statisztikák lekérése
    await page.goto(`${CONFIG.BASE_URL}/match/${matchId}/#/match-summary/match-statistics/0`, { 
      waitUntil: 'domcontentloaded' 
    });
    
    await waitForSelectorSafe(page, "div[data-testid='wcl-statistics']");
    const statistics = await extractMatchStatistics(page);
    
    await page.close();
    
    logger.debug(`Meccs adatok lekérve: ${matchId}`);
    return { ...matchData, information, statistics };
    
  } catch (error) {
    logger.error(`Hiba a meccs adatok lekérésekor: ${matchId}`, error);
    return null;
  }
};

/**
 * Alapvető meccs adatok kinyerése
 */
const extractMatchData = async (page) => {
  return await page.evaluate(() => {
    return {
      stage: document.querySelector('.tournamentHeader__country > a')?.innerText.trim(),
      date: document.querySelector('.duelParticipant__startTime')?.innerText.trim(),
      status: document.querySelector('.fixedHeaderDuel__detailStatus')?.innerText.trim(),
      home: {
        name: document.querySelector('.duelParticipant__home .participant__participantName.participant__overflow')?.innerText.trim(),
        image: document.querySelector('.duelParticipant__home .participant__image')?.src,
      },
      away: {
        name: document.querySelector('.duelParticipant__away .participant__participantName.participant__overflow')?.innerText.trim(),
        image: document.querySelector('.duelParticipant__away .participant__image')?.src,
      },
      result: {
        home: Array.from(document.querySelectorAll('.detailScore__wrapper span:not(.detailScore__divider)'))?.[0]?.innerText.trim(),
        away: Array.from(document.querySelectorAll('.detailScore__wrapper span:not(.detailScore__divider)'))?.[1]?.innerText.trim(),
        regulationTime: document
          .querySelector('.detailScore__fullTime')
          ?.innerText.trim()
          .replace(/[\n()]/g, ''),
        penalties: Array.from(document.querySelectorAll('[data-testid="wcl-scores-overline-02"]'))
          .find((element) => element.innerText.trim().toLowerCase() === 'penalties')
          ?.nextElementSibling?.innerText?.trim()
          .replace(/\s+/g, ''),
      },
    };
  });
};

/**
 * Meccs információk kinyerése
 */
const extractMatchInformation = async (page) => {
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("div[data-testid='wcl-summaryMatchInformation'] > div"));
    return elements.reduce((acc, element, index) => {
      if (index % 2 === 0) {
        acc.push({
          category: element?.textContent
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/(^[:\s]+|[:\s]+$|:)/g, ''),
          value: elements[index + 1]?.innerText
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/(^[:\s]+|[:\s]+$|:)/g, ''),
        });
      }
      return acc;
    }, []);
  });
};

/**
 * Meccs statisztikák kinyerése
 */
const extractMatchStatistics = async (page) => {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div[data-testid='wcl-statistics']")).map((element) => ({
      category: element.querySelector("div[data-testid='wcl-statistics-category']")?.innerText.trim(),
      homeValue: Array.from(element.querySelectorAll("div[data-testid='wcl-statistics-value'] > strong"))?.[0]?.innerText.trim(),
      awayValue: Array.from(element.querySelectorAll("div[data-testid='wcl-statistics-value'] > strong"))?.[1]?.innerText.trim(),
    }));
  });
};