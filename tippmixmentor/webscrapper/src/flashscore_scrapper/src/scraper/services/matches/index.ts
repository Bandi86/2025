import { Browser, Page } from 'playwright';
import { BASE_URL } from '../../../constants/index.ts';
import { openPageAndNavigate, waitAndClick, waitForSelectorSafe } from '../../index.ts';
import { MatchData, MatchInformation, MatchStatistic, MatchResult, Team } from '../../../types/index.ts';
import { createLogger } from '../../../core/logging/default-logger.ts';
import { ErrorHandler } from '../../../core/error/error-handler.ts';
import { ErrorType } from '../../../types/core.js';

const logger = createLogger('MatchScraper');
const errorHandler = new ErrorHandler(logger);

/**
 * Scrapes a list of match IDs from a given URL.
 * It navigates to the URL, clicks the "show more" button until all matches are loaded,
 * and then extracts the match IDs.
 * @param browser - The Playwright Browser instance.
 * @param url - The URL to scrape match IDs from.
 * @returns A Promise that resolves to an array of match IDs.
 */
export const getMatchIdList = async (browser: Browser, url: string): Promise<string[]> => {
  let page: Page | null = null;
  try {
    page = await openPageAndNavigate(browser, url);

    // Keep clicking the 'show more' button until it's no longer visible
    while (true) {
      try {
        await waitAndClick(page, 'a.event__more.event__more--static', { timeout: 2000 }); // Short timeout for click
        logger.debug('Clicked "show more" button.');
      } catch (error) {
        logger.debug('No more "show more" button found or timeout reached. All matches loaded.');
        break; // Button not found or timeout, assume all matches loaded
      }
    }

    // Wait for the match elements to be present after loading all matches
    await waitForSelectorSafe(page, '.event__match.event__match--static.event__match--twoLine', { timeout: 10000 });

    const matchIdList: string[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.event__match.event__match--static.event__match--twoLine')).map((element: Element) => {
        const htmlElement = element as HTMLElement;
        return htmlElement?.id?.replace('g_1_', '') || '';
      }).filter(id => id !== '');
    });

    logger.info(`Found ${matchIdList.length} match IDs from ${url}.`);
    return matchIdList;
  } catch (error) {
    errorHandler.handle(error as Error, { type: ErrorType.SCRAPING, operation: `Failed to get match ID list from ${url}`, url: url });
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
};

/**
 * Scrapes detailed match data for a given match ID.
 * It navigates to the match summary page, extracts basic match data,
 * then navigates to the statistics page and extracts statistics.
 * @param browser - The Playwright Browser instance.
 * @param matchId - The ID of the match to scrape.
 * @returns A Promise that resolves to a MatchData object.
 */
export const getMatchData = async (browser: Browser, matchId: string): Promise<MatchData> => {
  let page: Page | null = null;
  try {
    page = await openPageAndNavigate(browser, `${BASE_URL}/match/${matchId}/#/match-summary/match-summary`);

    await waitForSelectorSafe(page, '.duelParticipant__startTime', { timeout: 10000 });
    await waitForSelectorSafe(page, "div[data-testid='wcl-summaryMatchInformation'] > div", { timeout: 10000 });

    const matchData = await extractMatchData(page);
    const information: MatchInformation[] = await extractMatchInformation(page);

    await page.goto(`${BASE_URL}/match/${matchId}/#/match-summary/match-statistics/0`, { waitUntil: 'domcontentloaded' });
    await waitForSelectorSafe(page, "div[data-testid='wcl-statistics']", { timeout: 10000 });

    const statistics: MatchStatistic[] = await extractMatchStatistics(page);

    logger.info(`Successfully scraped data for match ID: ${matchId}.`);
    return { ...matchData, information, statistics };
  } catch (error) {
    errorHandler.handle(error as Error, { type: ErrorType.SCRAPING, operation: `Failed to get match data for match ID: ${matchId}`, matchId: matchId });
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
};

/**
 * Extracts core match data (stage, date, status, teams, result) from the current page.
 * @param page - The Playwright Page instance.
 * @returns A Promise that resolves to a partial MatchData object.
 */
const extractMatchData = async (page: Page): Promise<Omit<MatchData, 'information' | 'statistics'>> => {
  return await page.evaluate(() => {
    const getText = (selector: string) => (document.querySelector(selector) as HTMLElement)?.innerText?.trim() || '';
    const getSrc = (selector: string) => (document.querySelector(selector) as HTMLImageElement)?.src || '';
    const getScorePart = (elements: HTMLElement[], index: number) => elements?.[index]?.innerText?.trim() || '';

    const homeName = getText('.duelParticipant__home .participant__participantName.participant__overflow');
    const awayName = getText('.duelParticipant__away .participant__participantName.participant__overflow');
    const homeImage = getSrc('.duelParticipant__home .participant__image');
    const awayImage = getSrc('.duelParticipant__away .participant__image');
    const stage = getText('.tournamentHeader__country > a');
    const date = getText('.duelParticipant__startTime');
    const status = getText('.fixedHeaderDuel__detailStatus');

    const scoreElements = Array.from(document.querySelectorAll('.detailScore__wrapper span:not(.detailScore__divider)')) as HTMLElement[];
    const regulationTime = (document.querySelector('.detailScore__fullTime') as HTMLElement)?.innerText?.trim().replace(/[\n()]/g, '') || '';

    const penaltiesElement = Array.from(document.querySelectorAll('[data-testid="wcl-scores-overline-02"]'))
      .find((element: Element) => (element as HTMLElement).innerText.trim().toLowerCase() === 'penalties')
      ?.nextElementSibling as HTMLElement;
    const penalties = penaltiesElement?.innerText?.trim().replace(/\s+/g, '') || '';

    return {
      stage: stage,
      date: date,
      status: status,
      home: { name: homeName, image: homeImage } as Team,
      away: { name: awayName, image: awayImage } as Team,
      result: {
        home: getScorePart(scoreElements, 0),
        away: getScorePart(scoreElements, 1),
        regulationTime: regulationTime,
        penalties: penalties,
      } as MatchResult,
    };
  });
};

/**
 * Extracts match information (key-value pairs) from the current page.
 * @param page - The Playwright Page instance.
 * @returns A Promise that resolves to an array of MatchInformation objects.
 */
const extractMatchInformation = async (page: Page): Promise<MatchInformation[]> => {
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("div[data-testid='wcl-summaryMatchInformation'] > div")) as HTMLElement[];
    return elements.reduce((acc: MatchInformation[], element: HTMLElement, index: number) => {
      if (index % 2 === 0) {
        const category = element?.textContent
          ?.trim()
          .replace(/\s+/g, ' ')
          .replace(/(^[:\s]+|[:\s]+$|:)/g, '') || '';
        const value = elements[index + 1]?.innerText
          ?.trim()
          .replace(/\s+/g, ' ')
          .replace(/(^[:\s]+|[:\s]+$|:)/g, '') || '';
        acc.push({ category, value });
      }
      return acc;
    }, []);
  });
};

/**
 * Extracts match statistics (category, home value, away value) from the current page.
 * @param page - The Playwright Page instance.
 * @returns A Promise that resolves to an array of MatchStatistic objects.
 */
const extractMatchStatistics = async (page: Page): Promise<MatchStatistic[]> => {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div[data-testid='wcl-statistics']")).map((element: Element) => {
      const htmlElement = element as HTMLElement;
      const categoryElement = htmlElement.querySelector("div[data-testid='wcl-statistics-category']") as HTMLElement;
      const valueElements = Array.from(htmlElement.querySelectorAll("div[data-testid='wcl-statistics-value'] > strong")) as HTMLElement[];

      return {
        category: categoryElement?.innerText.trim() || '',
        homeValue: valueElements?.[0]?.innerText.trim() || '',
        awayValue: valueElements?.[1]?.innerText.trim() || '',
      };
    });
  });
};