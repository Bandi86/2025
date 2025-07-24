import inquirer from 'inquirer';
import { Browser } from 'playwright';
import { getListOfSeasons } from '../../../scraper/services/seasons/index.ts';
import { start, stop } from '../../loader/index.ts';
import { Season } from '../../../types/index.ts';

export const selectSeason = async (countryId: string, leagueId: string, browser?: Browser): Promise<Season> => {
  start();
  const seasons: Season[] = await getListOfSeasons(browser, countryId, leagueId);
  stop();
  const options: string[] = seasons.map((season: Season) => season.name);

  const { choice }: { choice: string } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select a league season:',
      choices: [...options, 'Cancel', new inquirer.Separator()],
    },
  ]);

  if (choice === 'Cancel') {
    console.log('No option selected. Exiting...');
    process.exit(1);
  }

  const selectedSeason: Season | undefined = seasons.find((season: Season) => season.name === choice);
  if (!selectedSeason) {
    throw new Error(`Season not found: ${choice}`);
  }

  return selectedSeason;
};
