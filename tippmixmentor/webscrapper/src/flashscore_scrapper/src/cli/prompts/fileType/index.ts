import inquirer from 'inquirer';
import { ExportFormat } from '../../../types/index.js';

export const selectFileType = async (): Promise<ExportFormat> => {
  const options: ExportFormat[] = Object.values(ExportFormat);
  const { choice }: { choice: string } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select an output file type:',
      choices: [...options, 'Cancel'],
    },
  ]);

  if (choice === 'Cancel') {
    console.log('No option selected. Exiting...');
    process.exit(1);
  }

  const selectedFileType: ExportFormat | undefined = options.find((element: ExportFormat) => element === choice);
  if (!selectedFileType) {
    throw new Error(`Invalid file type: ${choice}`);
  }

  return selectedFileType;
};
