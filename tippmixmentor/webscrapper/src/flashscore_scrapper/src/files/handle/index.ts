import { OUTPUT_PATH } from '../../constants/index.ts';
import { writeJsonToFile } from '../json/index.ts';
import { writeCsvToFile } from '../csv/index.ts';
import { MatchData } from '../../types/index.ts';

export const handleFileType = (matchData: Record<string, MatchData>, fileType: string, fileName: string): void => {
  switch (fileType) {
    case 'json':
      writeJsonToFile(matchData, OUTPUT_PATH, fileName);
      break;
    case 'csv':
      writeCsvToFile(matchData, OUTPUT_PATH, fileName);
      break;
    default:
      console.error('\n❌ ERROR: Invalid file type specified.');
      console.info('Please refer to the documentation for usage instructions: https://github.com/gustavofariaa/FlashscoreScraping\n');
  }
};