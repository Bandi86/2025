import puppeteer from 'puppeteer';
import { selectCountry } from './countries/index.js';
import { selectLeague } from './leagues/index.js';
import { selectSeason } from './season/index.js';
import { selectFileType } from './fileType/index.js';
import { scraper } from '../../scraper.js';

export const startInteractiveSelection = async () => {
  const browser = await puppeteer.launch({ headless: false });

  const country = await selectCountry(browser);
  const league = await selectLeague(browser, country.id);
  const season = await selectSeason(browser, league.url);
  const fileType = await selectFileType();

  await browser.close();

  scraper({
    country: country.name,
    league: season.name,
    headless: false,
    fileType: fileType,
  });
};
