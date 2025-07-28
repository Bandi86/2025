import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrowserManager } from '../../../../src/core/browser/browser-manager';
import { getListOfCountries } from '../../../../src/scraper/services/countries';
import { Country } from '../../../../src/types';

describe('Countries Service Integration', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager({ headless: true });
    await browserManager.launch();
  });

  afterAll(async () => {
    await browserManager.cleanup();
  });

  it('should successfully scrape the list of available countries', async () => {
    const countries: Country[] = await getListOfCountries(browserManager.getCurrentBrowser()!);

    expect(countries.length).toBeGreaterThan(0);
    expect(countries[0]).toHaveProperty('name');
    expect(countries[0]).toHaveProperty('url');
    expect(countries[0]).toHaveProperty('id');
  }, 30000); // Set a higher timeout for this integration test
});