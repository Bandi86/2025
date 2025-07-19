import { logger } from './logger.js';

/**
 * Késleltetés függvény rate limiting-hez
 * @param {number} ms - Milliszekundumok
 * @param {string} reason - Késleltetés oka (logging-hoz)
 */
export const delay = (ms, reason = 'Rate limiting') => {
  return new Promise(resolve => {
    logger.debug(`Késleltetés: ${ms}ms - ${reason}`);
    setTimeout(resolve, ms);
  });
};

/**
 * Véletlenszerű késleltetés a természetesebb viselkedésért
 * @param {number} minMs - Minimum milliszekundumok
 * @param {number} maxMs - Maximum milliszekundumok
 * @param {string} reason - Késleltetés oka
 */
export const randomDelay = (minMs, maxMs, reason = 'Random delay') => {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(ms, `${reason} (${ms}ms)`);
};