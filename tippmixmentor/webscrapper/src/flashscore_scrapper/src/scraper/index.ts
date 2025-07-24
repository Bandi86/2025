import { Browser, Page } from 'playwright';
import { TIMEOUT_FAST } from '../constants/index.ts';

export const openPageAndNavigate = async (browser?: Browser, url?: string): Promise<Page> => {
  if (!browser) {
    throw new Error('Browser instance is required');
  }
  if (!url) {
    throw new Error('URL is required');
  }
  
  const page: Page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page;
};

export const waitAndClick = async (page: Page, selector: string, timeout: number = TIMEOUT_FAST): Promise<void> => {
  await page.waitForSelector(selector, { timeout });
  await page.evaluate(async (selector: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.scrollIntoView();
      element.click();
    }
  }, selector);
};

export const waitForSelectorSafe = async (page: Page, selector: string, timeout: number = TIMEOUT_FAST): Promise<void> => {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch (error) {
    // Silently ignore timeout errors for safe waiting
  }
};
