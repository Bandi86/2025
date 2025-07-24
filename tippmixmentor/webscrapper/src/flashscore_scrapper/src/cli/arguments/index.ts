import { ScrapingOptions } from '../../types/index.ts';

export const parseArguments = (): ScrapingOptions => {
  const args: string[] = process.argv.slice(2);
  const options: ScrapingOptions = {
    country: null,
    league: null,
    headless: 'shell',
    fileType: null,
  };

  args.forEach((arg: string) => {
    if (arg.startsWith('country=')) options.country = arg.split('=')[1];
    if (arg.startsWith('league=')) options.league = arg.split('=')[1];
    if (arg.startsWith('fileType=')) {
      const fileType = arg.split('=')[1];
      if (fileType === 'json' || fileType === 'csv') {
        options.fileType = fileType;
      }
    }
    if (arg === 'no-headless') options.headless = false;
  });

  return options;
};
