import inquirer from 'inquirer';

export const selectFileType = async (): Promise<'json' | 'csv'> => {
  const options: ('json' | 'csv')[] = ['json', 'csv'];
  const { choice }: { choice: string } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select a output file type:',
      choices: ['json', 'csv', 'Cancel'],
    },
  ]);

  if (choice === 'Cancel') {
    console.log('No option selected. Exiting...');
    process.exit(1);
  }

  const selectedFileType: 'json' | 'csv' | undefined = options.find((element: 'json' | 'csv') => element === choice);
  if (!selectedFileType) {
    throw new Error(`Invalid file type: ${choice}`);
  }

  return selectedFileType;
};
