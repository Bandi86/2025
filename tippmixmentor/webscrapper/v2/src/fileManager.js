
import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from './config/index.js';
import { logger } from './utils/logger.js';

/**
 * Adatok mentése fájlba
 */
export const saveData = async (data, filePath) => {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
    logger.debug(`💾 Adatok mentve: ${filePath}`);
  } catch (error) {
    logger.error(`❌ Mentési hiba: ${filePath}`, error);
    throw error;
  }
};

/**
 * Adatok betöltése fájlból
 */
export const loadData = async (filePath) => {
  try {
    const data = await fs.readJson(filePath);
    logger.debug(`📂 Adatok betöltve: ${filePath}`);
    return data;
  } catch (error) {
    logger.debug(`📂 Fájl nem található vagy üres: ${filePath}`);
    return {};
  }
};

/**
 * Strukturált fájl útvonal generálása
 */
export const generateFilePath = (country, league, season, filename) => {
  return path.join(
    CONFIG.OUTPUT_BASE_PATH,
    country,
    `${league}-${season}`,
    season,
    `${filename}.${CONFIG.FILE_FORMAT}`
  );
};

/**
 * Meglévő adatok betöltése strukturált útvonalról
 */
export const loadExistingData = async (country, league, season, filename) => {
  const filePath = generateFilePath(country, league, season, filename);
  return await loadData(filePath);
};

/**
 * Adatok mentése strukturált útvonalra
 */
export const saveStructuredData = async (data, country, league, season, filename) => {
  const filePath = generateFilePath(country, league, season, filename);
  await saveData(data, filePath);
  return filePath;
};

/**
 * Régi kompatibilitás - saveDataToFile
 */
export const saveDataToFile = async (data, country, league, season, filename) => {
  return await saveStructuredData(data, country, league, season, filename);
};

/**
 * Statisztikák számítása a mentett adatokról
 */
export const calculateDataStats = async () => {
  try {
    const stats = {
      countries: 0,
      leagues: 0,
      totalMatches: 0,
      totalSize: 0
    };

    const dataPath = CONFIG.OUTPUT_BASE_PATH;
    if (!await fs.pathExists(dataPath)) {
      return stats;
    }

    const countries = await fs.readdir(dataPath);
    stats.countries = countries.length;

    for (const country of countries) {
      const countryPath = path.join(dataPath, country);
      const leagues = await fs.readdir(countryPath);
      stats.leagues += leagues.length;

      for (const league of leagues) {
        const leaguePath = path.join(countryPath, league);
        const seasons = await fs.readdir(leaguePath);

        for (const season of seasons) {
          const seasonPath = path.join(leaguePath, season);
          const files = await fs.readdir(seasonPath);

          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(seasonPath, file);
              const fileStats = await fs.stat(filePath);
              stats.totalSize += fileStats.size;

              const data = await loadData(filePath);
              stats.totalMatches += Object.keys(data).length;
            }
          }
        }
      }
    }

    return stats;
  } catch (error) {
    logger.error('❌ Statisztika számítási hiba:', error);
    return { countries: 0, leagues: 0, totalMatches: 0, totalSize: 0 };
  }
};
