import winston from 'winston';
import chalk from 'chalk';
import { CONFIG } from '../config/index.js';

// Színes formázás a konzolhoz
const colorize = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const ts = chalk.gray(timestamp);
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${ts} ${level}: ${message} ${metaStr}`;
  })
);

// Logger létrehozása
export const logger = winston.createLogger({
  level: CONFIG.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Fájlba írás
    new winston.transports.File({ 
      filename: CONFIG.LOG_FILE,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Konzolra írás
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        colorize
      )
    })
  ]
});

// Egyszerű delay függvény logolással
export const delay = (ms, reason = 'Rate limiting') => {
  return new Promise(resolve => {
    logger.debug(`⏳ Késleltetés: ${ms}ms - ${reason}`);
    setTimeout(resolve, ms);
  });
};

// Véletlenszerű delay
export const randomDelay = (minMs, maxMs, reason = 'Random delay') => {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(ms, `${reason} (${ms}ms)`);
};