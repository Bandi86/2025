import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class MlProcessorService {
  private readonly logger = new Logger(MlProcessorService.name);

  async predictMatch(matchData: any): Promise<any> {
    const pythonScriptPath = 'predict_api.py';
    const matchDataJson = JSON.stringify(matchData);

    return new Promise((resolve, reject) => {
      // Ensure the Python executable from the venv is used
      const pythonExecutable =
        '/home/bandi/Documents/code/2025/.venv/bin/python';

      this.logger.log(
        `Executing Python script: ${pythonExecutable} ${pythonScriptPath}`,
      );
      this.logger.log(`Match data: ${matchDataJson}`);

      const child = spawn(pythonExecutable, [pythonScriptPath], {
        cwd: '/home/bandi/Documents/code/2025/sp3/ml_pipeline',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}`);
          this.logger.error(`stderr: ${stderr}`);
          return reject(`Prediction failed: ${stderr || 'Unknown error'}`);
        }

        if (stderr) {
          this.logger.warn(`Python script stderr: ${stderr}`);
        }

        this.logger.log(`Python script stdout: ${stdout}`);

        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseError) {
          this.logger.error(`JSON parse error: ${parseError}`);
          reject(`Failed to parse prediction result: ${parseError.message}`);
        }
      });

      child.on('error', (error) => {
        this.logger.error(`spawn error: ${error}`);
        reject(`Failed to start Python script: ${error.message}`);
      });

      // Send JSON data to stdin
      if (child.stdin) {
        child.stdin.write(matchDataJson);
        child.stdin.end();
      } else {
        reject('Failed to write to Python script stdin');
      }
    });
  }
}
