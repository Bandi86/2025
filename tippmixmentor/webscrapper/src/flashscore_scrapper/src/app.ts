import playwright from 'playwright'
import { BASE_URL, OUTPUT_PATH } from './constants/index'
import { parseArguments } from './cli/arguments/index.js';
import { selectFileType } from './cli/prompts/fileType/index.js';
import { selectCountry } from './cli/prompts/countries/index.js';
import { selectLeague } from './cli/prompts/leagues/index.js';
import { selectSeason } from './cli/prompts/season/index.js';
import { start, stop } from './cli/loader/index.js';
import { initializeProgressbar } from './cli/progressbar/index.js';
import { getMatchIdList, getMatchData } from './scraper/services/matches/index.js';
import { handleFileType } from './files/handle/index.js';

interface ScraperOptions {
  country: string;
  league: string;
  fileType: string;
  headless: boolean;
}

export const scraper = async (options: ScraperOptions) => {
  const browser = await playwright.launch({ headless: options.headless });
  const fileName = `${options.country}_${options.league}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  console.info(`\n📝 Data collection has started!`);
  console.info(`The league data will be saved to: ${OUTPUT_PATH}/${fileName}.${options.fileType}`);

  start();
  const matchIdList = await getMatchIdList(browser, `${BASE_URL}/football/${options.country}/${options.league}/results`);
  stop();

  const progressbar = initializeProgressbar(matchIdList.length);
  const matchData: Record<string, any> = {};

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

(async () => {
  const options = parseArguments();
  await scraper(options);
})();
