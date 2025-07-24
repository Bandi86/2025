import { Browser } from 'playwright';
import { selectCountry } from './countries/index.ts';
import { selectLeague } from './leagues/index.ts';
import { selectSeason } from './season/index.ts';
import { selectFileType } from './fileType/index.ts';
import { scraper } from '../../app.ts';
import { Country, League, Season } from '../../types/index.ts';

export const startInteractiveSelection = async (): Promise<void> => {
  const playwright = await import('playwright');
  const browser: Browser = await playwright.chromium.launch({ headless: false });

  const country: Country = await selectCountry();
  const league: League = await selectLeague(country.id);
  const season: Season = await selectSeason(country.id, league.id);
  const fileType: string = await selectFileType();

  await browser.close();

  await scraper({
    country: country.name,
    league: season.name,
    headless: false,
    fileType: fileType,
  });
};