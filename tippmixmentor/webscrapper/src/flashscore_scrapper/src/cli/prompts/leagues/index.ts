import inquirer from 'inquirer';
import { Browser } from 'playwright';
import { getListOfLeagues } from '../../../scraper/services/leagues/index.ts';
import { start, stop } from '../../loader/index.ts';
import { League } from '../../../types/index.ts';

export const selectLeague = async (countryId: string, browser?: Browser): Promise<League> => {
  start();
  const leagues: League[] = await getListOfLeagues(browser, countryId);
  stop();
  const options: string[] = leagues.map((element: League) => element.name);

  const { choice }: { choice: string } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select a league:',
      choices: [...options, 'Cancel', new inquirer.Separator()],
    },
  ]);

  if (choice === 'Cancel') {
    console.log('No option selected. Exiting...');
    process.exit(1);
  }

  const selectedLeague: League | undefined = leagues.find((league: League) => league.name === choice);
  if (!selectedLeague) {
    throw new Error(`League not found: ${choice}`);
  }

  return selectedLeague;
};
