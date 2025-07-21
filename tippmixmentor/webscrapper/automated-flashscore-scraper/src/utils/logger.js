import winston from 'winston';
import { CONFIG } from '../config/index.js';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// Log könyvtár létrehozása
const logDir = path.dirname(CONFIG.LOG_FILE);
await fs.ensureDir(logDir);

export const logger = winston.createLogger({
  level: CONFIG.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'flashscore-scraper' },
  transports: [
    new winston.transports.File({ 
      filename: CONFIG.LOG_FILE,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const levelUpper = level.toUpperCase();
          let levelColor;
          switch (levelUpper) {
            case 'ERROR': levelColor = chalk.red.bold(levelUpper); break;
            case 'WARN': levelColor = chalk.yellow.bold(levelUpper); break;
            case 'INFO': levelColor = chalk.green.bold(levelUpper); break;
            case 'DEBUG': levelColor = chalk.blue.bold(levelUpper); break;
            default: levelColor = chalk.white(levelUpper);
          }

          const coloredTimestamp = chalk.gray(timestamp);
          const coloredMessage = level === 'info' ? chalk.bold(message) : message;

          return `${coloredTimestamp} [${levelColor}]: ${coloredMessage} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    })
  ]
});