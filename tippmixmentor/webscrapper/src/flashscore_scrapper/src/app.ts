import { Browser } from 'playwright';
import { BASE_URL, OUTPUT_PATH } from './constants/index.ts';
import { parseArguments } from './cli/arguments/index.ts';
import { start, stop } from './cli/loader/index.ts';
import { initializeProgressbar } from './cli/progressbar/index.ts';
import { getMatchIdList, getMatchData } from './scraper/services/matches/index.ts';
import { handleFileType } from './files/handle/index.ts';
import { MatchData, ScrapingOptions, ErrorType, ExportFormat } from './types/index.ts';
import { BrowserManager } from './core/browser/browser-manager.ts';
import { createLogger } from './core/logging/default-logger.ts';
import { ErrorHandler } from './core/error/error-handler.ts';

const logger = createLogger('App');
const errorHandler = new ErrorHandler(logger);

/**
 * Generates a clean filename from country and league names.
 * @param country - The country name.
 * @param league - The league name.
 * @returns A formatted filename string.
 */
function generateFileName(country: string, league: string): string {
  return `${country}_${league}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Main scraping function to collect and save Flashscore data.
 * @param options - The scraping options including country, league, file type, and headless mode.
 */
export const scraper = async (options: ScrapingOptions): Promise<MatchData[]> => {
  let browser: Browser | null = null;
  const browserManager = new BrowserManager({ headless: options.headless === 'shell' ? false : options.headless });

  try {
    browser = await browserManager.launch();
    if (!browser) {
      throw new Error('Failed to launch browser.');
    }

    const fileName: string = generateFileName(options.country!, options.league!);

    logger.info(`📝 Data collection has started!`);
    logger.info(`The league data will be saved to: ${OUTPUT_PATH}/${fileName}.${options.fileType}`);

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

    logger.info('✅ Data collection completed!');
    return Object.values(matchData);
  } catch (error) {
    errorHandler.handle(error as Error, { type: ErrorType.SCRAPING, operation: 'Scraping process failed' });
    process.exit(1);
  } finally {
    if (browser) {
      await browserManager.closeBrowser(browser);
    }
  }
};

/**
 * Initializes and runs the CLI application for Flashscore data scraping.
 */
(async (): Promise<void> => {
  try {
    const parsedOptions: ScrapingOptions = parseArguments();

    // Ensure all required fields are present
    if (!parsedOptions.country || !parsedOptions.league || !parsedOptions.fileType) {
      logger.error('Missing required arguments. Please provide country, league, and fileType.');
      process.exit(1);
    }

    // Since ScrapingOptions can have nulls from parseArguments,
    // we ensure they are non-null before passing to scraper.
    const options: ScrapingOptions = {
      ...parsedOptions,
      country: parsedOptions.country!,
      league: parsedOptions.league!,
      fileType: parsedOptions.fileType!,
      headless: parsedOptions.headless as boolean | 'shell',
    };

    const scrapedDataArray = await scraper(options);
    if (options.fileType !== ExportFormat.CSV) {
      const scrapedDataRecord: Record<string, MatchData> = scrapedDataArray.reduce((acc, match) => {
        acc[match.id!] = match;
        return acc;
      }, {} as Record<string, MatchData>);
      await handleFileType(scrapedDataRecord, options.fileType!, generateFileName(options.country!, options.league!));
      logger.info('✅ Data collection and file writing completed!');
      logger.info(`The data has been successfully saved to: ${OUTPUT_PATH}/${generateFileName(options.country!, options.league!)}.${options.fileType}\n`);
    }

  } catch (error) {
    errorHandler.handle(error as Error, { type: ErrorType.SYSTEM, operation: 'Application initialization failed' });
    process.exit(1);
  }
})();
