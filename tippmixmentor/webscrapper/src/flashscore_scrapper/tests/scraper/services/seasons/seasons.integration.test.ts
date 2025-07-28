import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrowserManager } from '../../../../src/core/browser/browser-manager';
import { getListOfSeasons } from '../../../../src/scraper/services/seasons';
import { Season } from '../../../../src/types';

describe('Seasons Service Integration', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager({ headless: true });
    await browserManager.launch();
  });

  afterAll(async () => {
    await browserManager.cleanup();
  });

  it('should successfully scrape the available seasons for a league', async () => {
    const countryId = 'england';
    const leagueId = 'premier-league';
    const seasons: Season[] = await getListOfSeasons(browserManager.getCurrentBrowser()!, countryId, leagueId);

    expect(seasons.length).toBeGreaterThan(0);
    expect(seasons[0]).toHaveProperty('name');
    expect(seasons[0]).toHaveProperty('url');
    expect(seasons[0]).toHaveProperty('id');
  }, 30000); // Set a higher timeout for this integration test
});