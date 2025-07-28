import { parseArguments } from './cli/arguments/index.ts';
import { selectFileType } from './cli/prompts/fileType/index.ts';
import { selectCountry } from './cli/prompts/countries/index.ts';
import { selectLeague } from './cli/prompts/leagues/index.ts';
import { selectSeason } from './cli/prompts/season/index.ts';
import { scraper } from './app.ts';
import { ScrapingOptions, ErrorType, ExportFormat, MatchData } from './types/index.ts';
import { CsvConverter } from './files/csv/csv-converter.js';
import { CsvWriter } from './files/csv/csv-writer.js';
import { createLogger } from './core/logging/default-logger.ts';
import { ErrorHandler } from './core/error/error-handler.ts';

const logger = createLogger('CLI');
const errorHandler = new ErrorHandler(logger);

/**
 * Defines the structure for options passed to the scraper.
 * This interface is used internally to ensure type safety.
 */
interface ScraperOptionsInternal {
  country: string;
  league: string;
  season?: string;
  fileType: ExportFormat;
  headless: boolean;
}

/**
 * Runs the command-line interface for the Flashscore scrapper.
 * It parses arguments, prompts for missing information, and initiates the scraping process.
 */
const runCli = async (): Promise<void> => {
  try {
    const options: ScrapingOptions = parseArguments();

    // Prompt for missing information if not provided via arguments
    if (!options.country) {
      const selectedCountry = await selectCountry();
      options.country = selectedCountry.name;
    }

    if (!options.league) {
      const selectedLeague = await selectLeague(options.country!);
      options.league = selectedLeague.name;
    }

    if (!options.season) {
      const selectedSeason = await selectSeason(options.country!, options.league!);
      options.season = selectedSeason.name;
    }

    if (!options.fileType) {
      options.fileType = await selectFileType();
    }

    // Determine headless mode: default to true unless 'no-headless' is explicitly passed
    options.headless = options.headless !== false;

    // Validate that all required fields are present before proceeding
    if (!options.country || !options.league || !options.fileType) {
      throw new Error('Missing required options: country, league, and fileType are mandatory.');
    }

    // Prepare options for the scraper, ensuring non-null values for required fields
    const scraperOptions: ScraperOptionsInternal = {
      country: options.country,
      league: options.league,
      season: options.season || undefined,
      fileType: options.fileType as ExportFormat,
      headless: options.headless as boolean,
    };

    const scrapedData: MatchData[] = await scraper(scraperOptions);

    if (scraperOptions.fileType === ExportFormat.CSV) {
      const csvConverter = new CsvConverter();
      const csvWriter = new CsvWriter('./riports/');
      const csvString = await csvConverter.convertToCsv(scrapedData);
      const filename = csvWriter.generateFilename(scraperOptions.league, scraperOptions.season || 'unknown_season', new Date());
      await csvWriter.writeCsvToFile(filename, csvString);
    }

  } catch (error) {
    errorHandler.handle(error as Error, { type: ErrorType.SYSTEM, operation: 'CLI execution failed' });
    process.exit(1);
  }
};

runCli();
