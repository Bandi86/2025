import { Browser, Page } from 'playwright';
import { BASE_URL, TIMEOUT } from '../../../constants/index.ts';
import { openPageAndNavigate, waitAndClick, waitForSelectorSafe } from '../../index.ts';
import { League } from '../../../types/index.ts';

export const getListOfLeagues = async (browser?: Browser, countryId?: string): Promise<League[]> => {
  if (!browser) {
    throw new Error('Browser instance is required');
  }
  if (!countryId) {
    throw new Error('Country ID is required');
  }

  const page: Page = await openPageAndNavigate(browser, BASE_URL);

  await waitAndClick(page, '#category-left-menu > div > span');
  await waitAndClick(page, `#${countryId}`);
  await waitForSelectorSafe(page, `#${countryId} ~ span > a`, TIMEOUT);

  const listOfLeagues: League[] = await page.evaluate((countryId: string | undefined) => {
    if (!countryId) return [];
    return Array.from(document.querySelectorAll(`#${countryId} ~ span > a`)).map((element: Element) => {
      const anchor = element as HTMLAnchorElement;
      return { 
        name: anchor.innerText.trim(), 
        url: anchor.href,
        id: anchor.href.split('/').pop() || ''
      };
    });
  }, countryId);

  await page.close();
  return listOfLeagues;
};
