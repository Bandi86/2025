import inquirer from 'inquirer';
import { Browser } from 'playwright';
import { getListOfCountries } from '../../../scraper/services/countries/index.ts';
import { start, stop } from '../../loader/index.ts';
import { Country } from '../../../types/index.ts';

export const selectCountry = async (browser?: Browser): Promise<Country> => {
  start();
  const countries: Country[] = await getListOfCountries(browser);
  stop();

  const options: string[] = countries.map((element: Country) => element.name);

  const { choice }: { choice: string } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select a country:',
      choices: [...options, 'Cancel', new inquirer.Separator()],
    },
  ]);

  if (choice === 'Cancel') {
    console.log('No option selected. Exiting...');
    process.exit(1);
  }

  const selectedCountry: Country | undefined = countries.find((country: Country) => country.name === choice);
  if (!selectedCountry) {
    throw new Error(`Country not found: ${choice}`);
  }

  return selectedCountry;
};
