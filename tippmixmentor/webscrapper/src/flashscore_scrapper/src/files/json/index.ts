import fs from 'fs';
import path from 'path';
import { MatchData } from '../../types/index.ts';

export const writeJsonToFile = (data: Record<string, MatchData>, outputPath: string, fileName: string): void => {
  const filePath: string = path.join(outputPath, `${fileName}.json`);
  const fileContent: string = JSON.stringify(data, null, 2);

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, fileContent);
  } catch (error) {
    console.error(`Error creating directories or writing to JSON file:`, error);
  }
};
