import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrowserManager } from '../../../../src/core/browser/browser-manager';
import { getListOfLeagues } from '../../../../src/scraper/services/leagues';
import { League } from '../../../../src/types';

describe('Leagues Service Integration', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager({ headless: true });
    await browserManager.launch();
  });

  afterAll(async () => {
    await browserManager.cleanup();
  });

  it('should successfully scrape the leagues for a given country', async () => {
    const countryId = 'g_13'; // England
    const leagues: League[] = await getListOfLeagues(browserManager.getCurrentBrowser()!, countryId);

    expect(leagues.length).toBeGreaterThan(0);
    expect(leagues[0]).toHaveProperty('name');
    expect(leagues[0]).toHaveProperty('url');
    expect(leagues[0]).toHaveProperty('id');
  }, 30000); // Set a higher timeout for this integration test
});