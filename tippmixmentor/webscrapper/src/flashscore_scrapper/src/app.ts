import playwright, { Browser } from 'playwright';
import { BASE_URL, OUTPUT_PATH } from './constants/index.ts';
import { parseArguments } from './cli/arguments/index.ts';
import { selectFileType } from './cli/prompts/fileType/index.ts';
import { selectCountry } from './cli/prompts/countries/index.ts';
import { selectLeague } from './cli/prompts/leagues/index.ts';
import { selectSeason } from './cli/prompts/season/index.ts';
import { start, stop } from './cli/loader/index.ts';
import { initializeProgressbar } from './cli/progressbar/index.ts';
import { getMatchIdList, getMatchData } from './scraper/services/matches/index.ts';
import { handleFileType } from './files/handle/index.ts';
import { MatchData, ScrapingOptions } from './types/index.ts';

interface ScraperOptions {
  country: string;
  league: string;
  season?: string;
  fileType: string;
  headless: boolean;
}

export const scraper = async (options: ScraperOptions): Promise<void> => {
  const browser: Browser = await playwright.chromium.launch({ headless: options.headless });
  const fileName: string = `${options.country}_${options.league}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  console.info(`\n📝 Data collection has started!`);
  console.info(`The league data will be saved to: ${OUTPUT_PATH}/${fileName}.${options.fileType}`);

  start();
  const matchIdList: string[] = await getMatchIdList(browser, `${BASE_URL}/football/${options.country}/${options.league}/results`);
  stop();

  const progressbar = initializeProgressbar(matchIdList.length);
  const matchData: Record<string, MatchData> = {};

  for (const matchId of matchIdList) {
    matchData[matchId] = await getMatchData(browser, matchId);
    progressbar.increment();
  }
  progressbar.stop();

  handleFileType(matchData, options.fileType, fileName);

  console.info('\n✅ Data collection and file writing completed!');
  console.info(`The data has been successfully saved to: ${OUTPUT_PATH}/${fileName}.${options.fileType}\n`);

  await browser.close();
};

(async (): Promise<void> => {
  const parsedOptions: ScrapingOptions = parseArguments();
  
  // Ensure all required fields are present
  if (!parsedOptions.country || !parsedOptions.league || !parsedOptions.fileType) {
    console.error('Missing required arguments. Please provide country, league, and fileType.');
    process.exit(1);
  }

  const options: ScraperOptions = {
    country: parsedOptions.country,
    league: parsedOptions.league,
    season: parsedOptions.season || undefined,
    fileType: parsedOptions.fileType,
    headless: parsedOptions.headless as boolean,
  };

  await scraper(options);
})();
