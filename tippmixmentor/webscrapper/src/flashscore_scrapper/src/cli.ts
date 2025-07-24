import { parseArguments } from './cli/arguments/index.ts';
import { selectFileType } from './cli/prompts/fileType/index.ts';
import { selectCountry } from './cli/prompts/countries/index.ts';
import { selectLeague } from './cli/prompts/leagues/index.ts';
import { selectSeason } from './cli/prompts/season/index.ts';
import { scraper } from './app.ts';
import { ScrapingOptions } from './types/index.ts';

interface ScraperOptions {
  country: string;
  league: string;
  season?: string;
  fileType: string;
  headless: boolean;
}

const runCli = async (): Promise<void> => {
  const options: ScrapingOptions = parseArguments();

  if (!options.country) {
    const selectedCountry = await selectCountry();
    options.country = selectedCountry.name;
  }

  if (!options.league) {
    const selectedLeague = await selectLeague(options.country);
    options.league = selectedLeague.name;
  }

  if (!options.season) {
    const selectedSeason = await selectSeason(options.country, options.league);
    options.season = selectedSeason.name;
  }

  if (!options.fileType) {
    options.fileType = await selectFileType();
  }

  // Assuming headless is true by default unless 'no-headless' is passed
  options.headless = options.headless !== false;

  // Ensure all required fields are present before calling scraper
  if (!options.country || !options.league || !options.fileType) {
    throw new Error('Missing required options: country, league, and fileType are required');
  }

  const scraperOptions: ScraperOptions = {
    country: options.country,
    league: options.league,
    season: options.season || undefined,
    fileType: options.fileType,
    headless: options.headless as boolean,
  };

  await scraper(scraperOptions);
};

runCli();
