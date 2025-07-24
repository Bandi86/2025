import { parseArguments } from './cli/arguments/index.js';
import { selectFileType } from './cli/prompts/fileType/index.js';
import { selectCountry } from './cli/prompts/countries/index.js';
import { selectLeague } from './cli/prompts/leagues/index.js';
import { selectSeason } from './cli/prompts/season/index.js';
import { scraper } from './app.js';

const runCli = async () => {
  const options = parseArguments();

  if (!options.country) {
    options.country = await selectCountry();
  }

  if (!options.league) {
    options.league = await selectLeague(options.country);
  }

  if (!options.season) {
 options.season = await selectSeason(options.country, options.league);
  }

  if (!options.fileType) {
    options.fileType = await selectFileType();
  }

  // Assuming headless is true by default unless 'no-headless' is passed
  options.headless = options.headless !== false;

  await scraper(options);
};

runCli();
