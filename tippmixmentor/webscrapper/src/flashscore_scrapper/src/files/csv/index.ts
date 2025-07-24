import fs from 'fs';
import path from 'path';
import jsonexport from 'jsonexport';
import { MatchData, MatchInformation, MatchStatistic } from '../../types/index.ts';

export const writeCsvToFile = (data: Record<string, MatchData>, outputPath: string, fileName: string): void => {
  const filePath: string = path.join(outputPath, `${fileName}.csv`);

  const csvData = convertDataToCsv(data);

  jsonexport(csvData, (error: any, fileContent: string) => {
    if (error) throw error;

    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, fileContent);
    } catch (error) {
      console.error(`Error creating directories or writing to CSV file:`, error);
    }
  });
};

const convertDataToCsv = (data: Record<string, MatchData>): any[] =>
  Object.keys(data).map((matchId: string) => {
    const { stage, date, status, home, away, result, information, statistics } = data[matchId];
    const informationObject: Record<string, string> = {};
    const statisticsObject: Record<string, { home: string; away: string }> = {};

    information.forEach((info: MatchInformation) => {
      informationObject[info.category.toLowerCase().replace(/ /g, '_')] = info.value;
    });

    statistics.forEach((stat: MatchStatistic) => {
      statisticsObject[stat.category.toLowerCase().replace(/ /g, '_')] = {
        home: stat.homeValue,
        away: stat.awayValue,
      };
    });

    return { matchId, stage, status, date, home, away, result, ...informationObject, ...statisticsObject };
  });
