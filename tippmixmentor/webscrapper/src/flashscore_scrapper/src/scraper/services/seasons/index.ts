import { Browser, Page } from 'playwright';
import { TIMEOUT } from '../../../constants/index.ts';
import { openPageAndNavigate, waitForSelectorSafe } from '../../index.ts';
import { Season } from '../../../types/index.ts';

export const getListOfSeasons = async (browser?: Browser, countryId?: string, leagueId?: string): Promise<Season[]> => {
  // Construct league URL from countryId and leagueId if provided
  const leagueUrl = `https://www.flashscore.com/football/${countryId}/${leagueId}`;
  const page: Page = await openPageAndNavigate(browser, `${leagueUrl}/archive`);

  await waitForSelectorSafe(page, 'div.archive__season > a', TIMEOUT);

  const listOfLeagueSeasons: Season[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div.archive__season > a')).map((element: Element) => {
      const anchor = element as HTMLAnchorElement;
      return { 
        name: anchor.innerText.trim(), 
        url: anchor.href,
        id: anchor.href.split('/').pop() || ''
      };
    });
  });

  await page.close();
  return listOfLeagueSeasons;
};
