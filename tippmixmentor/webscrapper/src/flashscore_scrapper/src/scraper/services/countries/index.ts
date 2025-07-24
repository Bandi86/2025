import { Browser, Page } from 'playwright';
import { BASE_URL } from '../../../constants/index.ts';
import { openPageAndNavigate, waitAndClick, waitForSelectorSafe } from '../../index.ts';
import { Country } from '../../../types/index.ts';

export const getListOfCountries = async (browser?: Browser): Promise<Country[]> => {
  const page: Page = await openPageAndNavigate(browser, BASE_URL);

  await waitAndClick(page, '#category-left-menu > div > span');
  await waitForSelectorSafe(page, '#category-left-menu > div > div > a');

  const listOfCountries: Country[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#category-left-menu > div > div > a')).map((element: Element) => {
      const anchor = element as HTMLAnchorElement;
      return { 
        name: anchor.innerText.trim(), 
        url: anchor.href, 
        id: anchor.id 
      };
    });
  });

  await page.close();
  return listOfCountries;
};
