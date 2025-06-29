import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class MlProcessorService {
  private readonly logger = new Logger(MlProcessorService.name);

  async predictMatch(matchData: any): Promise<string> {
    const pythonScriptPath = 'ml_pipeline/predict.py';
    const matchDataJson = JSON.stringify(matchData);

    return new Promise((resolve, reject) => {
      // Ensure the Python executable from the venv is used
      const pythonExecutable = '/home/bandi/Documents/code/2025/sp3/ml_pipeline/venv/bin/python';
      const command = `${pythonExecutable} ${pythonScriptPath} '${matchDataJson}'`;

      this.logger.log(`Executing Python script: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`exec error: ${error}`);
          this.logger.error(`stderr: ${stderr}`);
          return reject(`Prediction failed: ${stderr || error.message}`);
        }
        if (stderr) {
          this.logger.warn(`Python script stderr: ${stderr}`);
        }
        this.logger.log(`Python script stdout: ${stdout}`);
        resolve(stdout.trim());
      });
    });
  }
}