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
export const getMatchIdList = async (browser, seasonUrl) => {
  logger.info(`Meccs ID-k lekérése: ${seasonUrl}`);
  
  try {
    const page = await openPageAndNavigate(browser, seasonUrl);
    
    await delay(3000, 'Initial page load wait');

    const currentSeason = seasonUrl.match(/\/(\d{4}-\d{4})\/results/)?.[1] || 'unknown-season';

    

    

    while (attempts < maxAttempts) {
      const initialMatchCount = await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
      }, matchElementSelector);

      const clicked = await waitAndClick(page, showMoreSelector);
      if (!clicked) {
        logger.debug('"Show more" button not found or no more matches to load.');
        break;
      }
      
      // Wait for a network response that indicates new data is loaded
      // This is a more reliable way to detect content loading than DOM changes
      let responseReceived = false;
      try {
        const responsePromise = page.waitForResponse(response => 
          response.url().includes('/x/feed/d_match_') && response.status() === 200,
          { timeout: CONFIG.TIMEOUT }
        );
        await Promise.race([
          responsePromise,
          delay(CONFIG.TIMEOUT / 2) // Don't wait too long for response if it's not coming
        ]);
        responseReceived = true;
      } catch (e) {
        logger.debug(`No relevant network response received within timeout: ${e.message}`);
      }

      // Even if no response, wait a bit for DOM to update
      await randomDelay(1000, 2000, 'Waiting for DOM update after click'); 

      const currentMatchCount = await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
      }, matchElementSelector);

      if (currentMatchCount === initialMatchCount) {
        noNewMatchesCount++;
        logger.debug(`No new matches loaded. Consecutive attempts without new matches: ${noNewMatchesCount}`);
        if (noNewMatchesCount >= maxNoNewMatchesAttempts) {
          logger.info('Stopped clicking "Show more" button after multiple attempts with no new matches.');
          break;
        }
      } else {
        noNewMatchesCount = 0; // Reset counter if new matches were loaded
        logger.debug(`Matches increased from ${initialMatchCount} -> ${currentMatchCount}`);
      }

      attempts++;
      if (attempts % 10 === 0) {
        logger.info(`${attempts} "Show more" gomb megnyomva`);
      }
    }

    if (attempts >= maxAttempts) {
      logger.warn(`Elérte a maximális próbálkozási számot (${maxAttempts}) a "Show more" gombra. Lehet, hogy nem minden meccs lett betöltve.`);
    }
    

    while (attempts < maxAttempts) {
      const initialMatchCount = await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
      }, matchElementSelector);

      const clicked = await waitAndClick(page, showMoreSelector);
      if (!clicked) {
        logger.debug('"Show more" button not found or no more matches to load.');
        break;
      }
      
      // Wait for a network response that indicates new data is loaded
      // This is a more reliable way to detect content loading than DOM changes
      let responseReceived = false;
      try {
        const responsePromise = page.waitForResponse(response => 
          response.url().includes('/x/feed/d_match_') && response.status() === 200,
          { timeout: CONFIG.TIMEOUT }
        );
        await Promise.race([
          responsePromise,
          delay(CONFIG.TIMEOUT / 2) // Don't wait too long for response if it's not coming
        ]);
        responseReceived = true;
      } catch (e) {
        logger.debug(`No relevant network response received within timeout: ${e.message}`);
      }

      // Even if no response, wait a bit for DOM to update
      await randomDelay(1000, 2000, 'Waiting for DOM update after click'); 

      const currentMatchCount = await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
      }, matchElementSelector);

      if (currentMatchCount === initialMatchCount) {
        noNewMatchesCount++;
        logger.debug(`No new matches loaded. Consecutive attempts without new matches: ${noNewMatchesCount}`);
        if (noNewMatchesCount >= maxNoNewMatchesAttempts) {
          logger.info('Stopped clicking "Show more" button after multiple attempts with no new matches.');
          break;
        }
      } else {
        noNewMatchesCount = 0; // Reset counter if new matches were loaded
        logger.debug(`Matches increased from ${initialMatchCount} -> ${currentMatchCount}`);
      }

      attempts++;
      if (attempts % 10 === 0) {
        logger.info(`${attempts} "Show more" gomb megnyomva`);
      }
    }

    if (attempts >= maxAttempts) {
      logger.warn(`Elérte a maximális próbálkozási számot (${maxAttempts}) a "Show more" gombra. Lehet, hogy nem minden meccs lett betöltve.`);
    }

    const matchSelector = '.event__match--static[id^="g_1_"]';
    await waitForSelectorSafe(page, matchSelector, 5000);
    
    const matchIdList = await page.evaluate((selector) => {
      return Array.from(document.querySelectorAll(selector)).map((element) => 
        element.id.replace('g_1_', '')
      );
    }, matchSelector);
    
    await page.close();
    
    logger.info(`${matchIdList.length} meccs ID lekérve a ${seasonUrl} oldalról.`);
    return { matchIds: matchIdList, season: currentSeason };
    
  } catch (error) {
    logger.error(`Hiba a meccs ID-k lekérésekor: ${seasonUrl}`, error);
    return { matchIds: [], season: 'unknown-season' };
  }
};

/**
 * Elérhető szezonok lekérése egy ligához
 * @param {Object} browser - Puppeteer browser példány
 * @param {string} country - Ország neve
 * @param {string} league - Liga neve
 */
export const getAvailableSeasons = async (browser, leagueUrl) => {
  logger.info(`Szezonok lekérése: ${leagueUrl}`);

  try {
    const page = await openPageAndNavigate(browser, leagueUrl);

    // Várjuk meg a szezonválasztó elemet
    // Flashscore uses a specific structure for season archives, usually under a /archive path
    // We need to navigate to the archive page first if not already there.
    if (!page.url().includes('/archive')) {
      await page.goto(`${leagueUrl}archive`, { waitUntil: 'domcontentloaded' });
    }

    await waitForSelectorSafe(page, 'div.archive__season > a', CONFIG.TIMEOUT);

    const seasons = await page.evaluate(() => {
      const seasonElements = document.querySelectorAll('div.archive__season > a');
      return Array.from(seasonElements).map(el => ({
        name: el.innerText.trim(),
        url: el.href // The href attribute already contains the full URL for the season
      }));
    });

    await page.close();
    logger.info(`${seasons.length} szezon lekérve a ${leagueUrl} ligához.`);
    return seasons;

  } catch (error) {
    logger.error(`Hiba a szezonok lekérésekor a ${leagueUrl} ligához:`, error);
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