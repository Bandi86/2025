import { Browser, Page } from 'playwright';
import { BASE_URL } from '../../../constants/index.ts';
import { openPageAndNavigate, waitAndClick, waitForSelectorSafe } from '../../index.ts';
import { MatchData, MatchInformation, MatchStatistic, MatchResult, Team } from '../../../types/index.ts';

export const getMatchIdList = async (browser: Browser, url: string): Promise<string[]> => {
  const page: Page = await openPageAndNavigate(browser, url);
  
  while (true) {
    try {
      await waitAndClick(page, 'a.event__more.event__more--static');
    } catch (error) {
      break;
    }
  }
  
  await waitForSelectorSafe(page, '.event__match.event__match--static.event__match--twoLine');
  
  const matchIdList: string[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.event__match.event__match--static.event__match--twoLine')).map((element: Element) => {
      const htmlElement = element as HTMLElement;
      return htmlElement?.id?.replace('g_1_', '') || '';
    }).filter(id => id !== '');
  });
  
  await page.close();
  return matchIdList;
};

export const getMatchData = async (browser: Browser, matchId: string): Promise<MatchData> => {
  const page: Page = await openPageAndNavigate(browser, `${BASE_URL}/match/${matchId}/#/match-summary/match-summary`);
  
  await waitForSelectorSafe(page, '.duelParticipant__startTime');
  await waitForSelectorSafe(page, "div[data-testid='wcl-summaryMatchInformation'] > div");
  
  const matchData = await extractMatchData(page);
  const information: MatchInformation[] = await extractMatchInformation(page);
  
  await page.goto(`${BASE_URL}/match/${matchId}/#/match-summary/match-statistics/0`, { waitUntil: 'domcontentloaded' });
  await waitForSelectorSafe(page, "div[data-testid='wcl-statistics']");
  
  const statistics: MatchStatistic[] = await extractMatchStatistics(page);
  
  await page.close();
  return { ...matchData, information, statistics };
};

const extractMatchData = async (page: Page): Promise<Omit<MatchData, 'information' | 'statistics'>> => {
  return await page.evaluate(() => {
    const homeNameElement = document.querySelector('.duelParticipant__home .participant__participantName.participant__overflow') as HTMLElement;
    const awayNameElement = document.querySelector('.duelParticipant__away .participant__participantName.participant__overflow') as HTMLElement;
    const homeImageElement = document.querySelector('.duelParticipant__home .participant__image') as HTMLImageElement;
    const awayImageElement = document.querySelector('.duelParticipant__away .participant__image') as HTMLImageElement;
    const stageElement = document.querySelector('.tournamentHeader__country > a') as HTMLElement;
    const dateElement = document.querySelector('.duelParticipant__startTime') as HTMLElement;
    const statusElement = document.querySelector('.fixedHeaderDuel__detailStatus') as HTMLElement;
    
    const scoreElements = Array.from(document.querySelectorAll('.detailScore__wrapper span:not(.detailScore__divider)')) as HTMLElement[];
    const regulationTimeElement = document.querySelector('.detailScore__fullTime') as HTMLElement;
    
    const penaltiesElement = Array.from(document.querySelectorAll('[data-testid="wcl-scores-overline-02"]'))
      .find((element: Element) => (element as HTMLElement).innerText.trim().toLowerCase() === 'penalties')
      ?.nextElementSibling as HTMLElement;

    return {
      stage: stageElement?.innerText.trim() || '',
      date: dateElement?.innerText.trim() || '',
      status: statusElement?.innerText.trim() || '',
      home: {
        name: homeNameElement?.innerText.trim() || '',
        image: homeImageElement?.src,
      } as Team,
      away: {
        name: awayNameElement?.innerText.trim() || '',
        image: awayImageElement?.src,
      } as Team,
      result: {
        home: scoreElements?.[0]?.innerText.trim() || '',
        away: scoreElements?.[1]?.innerText.trim() || '',
        regulationTime: regulationTimeElement?.innerText.trim().replace(/[\n()]/g, ''),
        penalties: penaltiesElement?.innerText?.trim().replace(/\s+/g, ''),
      } as MatchResult,
    };
  });
};

const extractMatchInformation = async (page: Page): Promise<MatchInformation[]> => {
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("div[data-testid='wcl-summaryMatchInformation'] > div")) as HTMLElement[];
    return elements.reduce((acc: MatchInformation[], element: HTMLElement, index: number) => {
      if (index % 2 === 0) {
        acc.push({
          category: element?.textContent
            ?.trim()
            .replace(/\s+/g, ' ')
            .replace(/(^[:\s]+|[:\s]+$|:)/g, '') || '',
          value: elements[index + 1]?.innerText
            ?.trim()
            .replace(/\s+/g, ' ')
            .replace(/(^[:\s]+|[:\s]+$|:)/g, '') || '',
        });
      }
      return acc;
    }, []);
  });
};

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