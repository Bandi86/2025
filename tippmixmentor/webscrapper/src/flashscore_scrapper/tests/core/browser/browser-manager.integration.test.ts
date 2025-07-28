import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrowserManager } from '../../../src/core/browser/browser-manager';
import { Browser } from 'playwright';

describe('BrowserManager Integration', () => {
  let browserManager: BrowserManager;
  let browser: Browser;

  beforeAll(() => {
    browserManager = new BrowserManager({ headless: true });
  });

  afterAll(async () => {
    await browserManager.cleanup();
  });

  it('should launch and close a browser instance successfully', async () => {
    browser = await browserManager.launch();
    expect(browser).toBeDefined();
    expect(browser.isConnected()).toBe(true);

    await browserManager.closeBrowser();
    expect(browser.isConnected()).toBe(false);
  });

  it('should create and close a page successfully', async () => {
    browser = await browserManager.launch();
    const page = await browserManager.createPage();
    expect(page).toBeDefined();
    expect(page.isClosed()).toBe(false);

    await browserManager.closePage(page);
    expect(page.isClosed()).toBe(true);
    await browserManager.closeBrowser();
  });
});