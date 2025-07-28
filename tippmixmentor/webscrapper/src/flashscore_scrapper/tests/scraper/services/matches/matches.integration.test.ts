import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrowserManager } from '../../../../src/core/browser/browser-manager';
import { getMatchIdList, getMatchData } from '../../../../src/scraper/services/matches';
import { MatchData } from '../../../../src/types';

describe('Matches Service Integration', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager({ headless: true });
    await browserManager.launch();
  });

  afterAll(async () => {
    await browserManager.cleanup();
  });

  it('should successfully scrape a list of match IDs for a given league and season', async () => {
    const leagueUrl = 'https://www.flashscore.com/football/england/premier-league/results/';
    const matchIds: string[] = await getMatchIdList(browserManager.getCurrentBrowser()!, leagueUrl);

    expect(matchIds.length).toBeGreaterThan(0);
    expect(typeof matchIds[0]).toBe('string');
  }, 60000); // Higher timeout due to potential page loading and clicking "show more matches"

  it('should successfully scrape match data for a given match ID', async () => {
    const matchId = 'fL2fC3wB'; // A sample match ID (replace with a real one if needed)
    const matchData: MatchData = await getMatchData(browserManager.getCurrentBrowser()!, matchId);

    expect(matchData).toBeDefined();
    expect(matchData).toHaveProperty('stage');
    expect(matchData).toHaveProperty('date');
    expect(matchData).toHaveProperty('home');
    expect(matchData).toHaveProperty('away');
    expect(matchData).toHaveProperty('result');
    expect(matchData.information.length).toBeGreaterThan(0);
    expect(matchData.statistics.length).toBeGreaterThan(0);
  }, 60000); // Higher timeout for scraping detailed match data
});