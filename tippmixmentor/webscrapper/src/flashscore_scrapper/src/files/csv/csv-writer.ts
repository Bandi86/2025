import * as fs from 'fs/promises';
import * as path from 'path';
import { MatchData } from '../../types/core.js';

export class CsvWriter {
  private baseReportPath: string;

  constructor(baseReportPath: string) {
    this.baseReportPath = baseReportPath;
  }

  /**
   * Writes a CSV string to a file.
   * @param filename The name of the file to write.
   * @param csvString The CSV content.
   */
  public async writeCsvToFile(filename: string, csvString: string): Promise<void> {
    const filePath = path.join(this.baseReportPath, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, csvString);
    console.log(`CSV data written to: ${filePath}`);
  }

  /**
   * Generates a filename based on league, season, and date.
   * @param leagueName The name of the league.
   * @param seasonName The name of the season.
   * @param date The date for the report.
   * @returns The generated filename.
   */
  public generateFilename(leagueName: string, seasonName: string, date: Date): string {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const safeLeagueName = leagueName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeSeasonName = seasonName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeLeagueName}_${safeSeasonName}_${formattedDate}.csv`;
  }
}