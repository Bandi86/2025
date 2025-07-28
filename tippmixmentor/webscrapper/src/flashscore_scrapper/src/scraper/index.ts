
import { Browser, Page } from 'playwright';
import { TIMEOUT_FAST } from '../constants/index.ts';
import { createLogger } from '../core/logging/default-logger.ts';
import { ErrorHandler } from '../core/error/error-handler.ts';
import { ErrorType } from '../types/core.js';

const logger = createLogger('ScraperUtils');
const errorHandler = new ErrorHandler(logger);

/**
 * Opens a new page in the given browser and navigates to the specified URL.
 * Includes error handling for navigation failures.
 * @param browser - The Playwright Browser instance.
 * @param url - The URL to navigate to.
 * @returns A Promise that resolves to the Playwright Page instance.
 * @throws If the browser instance is not provided, URL is missing, or navigation fails.
 */
export const openPageAndNavigate = async (browser: Browser, url: string): Promise<Page> => {
  if (!browser) {
    throw new Error('Browser instance is required to open a new page.');
  }
  if (!url) {
    throw new Error('URL is required for navigation.');
  }

  let page: Page | null = null;
  try {
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_FAST });
    logger.info(`Successfully navigated to: ${url}`);
    return page;
  } catch (error) {
    if (page) {
      await page.close();
    }
    errorHandler.handle(error as Error, {
      type: ErrorType.NETWORK,
      operation: `Navigation to ${url} failed`,
      url: url,
    });
    throw error;
  }
};

/**
 * Waits for a selector to appear and then clicks on it.
 * Includes a small delay before clicking to ensure element is ready.
 * @param page - The Playwright Page instance.
 * @param selector - The CSS selector of the element to wait for and click.
 * @param options - Options object, can include `timeout`.
 */
export const waitAndClick = async (page: Page, selector: string, options?: { timeout?: number }): Promise<void> => {
  const timeout = options?.timeout ?? TIMEOUT_FAST;
  await page.waitForSelector(selector, { timeout });
  await page.evaluate(async (selector: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for element readiness
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.scrollIntoView();
      element.click();
    }
  }, selector);
};

/**
 * Waits for a selector to appear safely, without throwing an error on timeout.
 * @param page - The Playwright Page instance.
 * @param selector - The CSS selector of the element to wait for.
 * @param options - Options object, can include `timeout`.
 */
export const waitForSelectorSafe = async (page: Page, selector: string, options?: { timeout?: number }): Promise<void> => {
  const timeout = options?.timeout ?? TIMEOUT_FAST;
  try {
    await page.waitForSelector(selector, { timeout });
  } catch (error) {
    // Silently ignore timeout errors for safe waiting
    console.debug(`Selector "${selector}" not found within timeout.`);
  }
};
