import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from '../config/index.js';
import { logger } from './logger.js';

/**
 * Szervezett fájl struktúra létrehozása
 * @param {string} country - Ország neve
 * @param {string} league - Liga neve
 * @param {string} season - Szezon neve
 */
export const createOutputPath = (country, league, season) => {
  const outputPath = path.join(
    CONFIG.OUTPUT_BASE_PATH,
    country,
    league,
    season
  );
  
  return outputPath;
};

/**
 * Fájl mentése szervezett struktúrában
 * @param {Object} data - Mentendő adatok
 * @param {string} country - Ország
 * @param {string} league - Liga
 * @param {string} season - Szezon
 * @param {string} filename - Fájl név
 */
export const saveDataToFile = async (data, country, league, season, filename) => {
  try {
    const outputPath = createOutputPath(country, league, season);
    await fs.ensureDir(outputPath);
    
    const filePath = path.join(outputPath, `${filename}.${CONFIG.FILE_FORMAT}`);
    
    if (CONFIG.FILE_FORMAT === 'json') {
      await fs.writeJson(filePath, data, { spaces: 2 });
    } else if (CONFIG.FILE_FORMAT === 'csv') {
      // CSV mentés implementálása szükség esetén
      const csvContent = convertToCsv(data);
      await fs.writeFile(filePath, csvContent);
    }
    
    logger.info(`Adatok mentve: ${filePath}`, { 
      country, 
      league, 
      season, 
      filename,
      recordCount: Object.keys(data).length 
    });
    
    return filePath;
  } catch (error) {
    logger.error('Hiba a fájl mentése során:', error);
    throw error;
  }
};

/**
 * Ellenőrzi, hogy a fájl már létezik-e
 * @param {string} country - Ország
 * @param {string} league - Liga  
 * @param {string} season - Szezon
 * @param {string} filename - Fájl név
 */
export const fileExists = async (country, league, season, filename) => {
  const outputPath = createOutputPath(country, league, season);
  const filePath = path.join(outputPath, `${filename}.${CONFIG.FILE_FORMAT}`);
  return await fs.pathExists(filePath);
};

/**
 * Meglévő adatok betöltése (inkrementális scraping-hez)
 * @param {string} country - Ország
 * @param {string} league - Liga
 * @param {string} season - Szezon  
 * @param {string} filename - Fájl név
 */
export const loadExistingData = async (country, league, season, filename) => {
  try {
    const outputPath = createOutputPath(country, league, season);
    const filePath = path.join(outputPath, `${filename}.${CONFIG.FILE_FORMAT}`);
    
    if (await fs.pathExists(filePath)) {
      if (CONFIG.FILE_FORMAT === 'json') {
        return await fs.readJson(filePath);
      }
    }
    
    return {};
  } catch (error) {
    logger.warn('Nem sikerült betölteni a meglévő adatokat:', error);
    return {};
  }
};

/**
 * CSV konvertálás (egyszerű implementáció)
 */
const convertToCsv = (data) => {
  // Egyszerű CSV konvertálás - bővíthető
  const headers = ['matchId', 'stage', 'date', 'status', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore'];
  const rows = Object.entries(data).map(([matchId, match]) => [
    matchId,
    match.stage || '',
    match.date || '',
    match.status || '',
    match.home?.name || '',
    match.away?.name || '',
    match.result?.home || '',
    match.result?.away || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};