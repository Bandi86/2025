import inquirer from 'inquirer';
import { getAvailableSeasons } from '../../../scraper/matchScraper.js';
import { logger } from '../../../utils/logger.js';

export const selectSeason = async (browser, leagueUrl) => {
  logger.info(`Szezonok lekérése a(z) ${leagueUrl} ligához...`);
  
  try {
    const seasons = await getAvailableSeasons(browser, leagueUrl);

    if (seasons.length === 0) {
      logger.warn(`Nem találhatók szezonok a(z) ${leagueUrl} ligához. Visszatérés alapértelmezettre.`);
      // Fallback to a default season if none are found
      // Construct a plausible URL for the current season if no archive is found
      const currentYear = new Date().getFullYear();
      const defaultSeasonName = `${currentYear}-${currentYear + 1}`;
      const defaultSeasonUrl = `${leagueUrl.replace('/results', '')}${defaultSeasonName}/results`;
      return { name: defaultSeasonName, url: defaultSeasonUrl }; 
    }

    const options = seasons.map(season => ({ name: season.name, value: season }));

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Válaszd ki a szezont:',
        choices: [...options, 'Cancel', new inquirer.Separator()],
      },
    ]);

    if (choice === 'Cancel') {
      console.log('Nincs szezon kiválasztva. Kilépés...');
      process.exit(1);
    }

    logger.debug(`Visszatérő szezon URL: ${choice.url}`);
    return choice;
  } catch (error) {
    logger.error(`Hiba a szezon kiválasztása során a(z) ${leagueUrl} ligához:`, error);
    process.exit(1);
  }
};