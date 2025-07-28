import { MatchData } from "../../types/core.js"; // Corrected import path and type name
import jsonexport from "jsonexport";

export class CsvConverter {
  /**
   * Converts an array of structured data into a CSV string.
   * @param data The data to convert.
   * @returns A promise that resolves to the CSV string.
   */
  public async convertToCsv(data: MatchData[]): Promise<string> {
    return new Promise((resolve, reject) => {
      jsonexport(data, function(err: Error, csv: string){
        if(err) return reject(err);
        resolve(csv);
      });
    });
  }
}