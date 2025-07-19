import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';

/**
 * Gépi tanuláshoz optimalizált adatfeldolgozás
 */
export class MLDataProcessor {
  
  /**
   * JSON adatok konvertálása ML-ready CSV formátumba
   * @param {Object} matchData - Meccs adatok JSON formátumban
   * @returns {Array} CSV sorok tömbje
   */
  static convertToMLFormat(matchData) {
    const mlRows = [];
    
    Object.entries(matchData).forEach(([matchId, match]) => {
      const row = {
        // Alapadatok
        match_id: matchId,
        date: match.date,
        stage: match.stage,
        status: match.status,
        
        // Csapatok
        home_team: match.home?.name || '',
        away_team: match.away?.name || '',
        
        // Eredmények
        home_score: parseInt(match.result?.home) || 0,
        away_score: parseInt(match.result?.away) || 0,
        total_goals: (parseInt(match.result?.home) || 0) + (parseInt(match.result?.away) || 0),
        
        // Kimenetel (target változó)
        result: this.getMatchResult(match.result?.home, match.result?.away),
        
        // Statisztikák (ha vannak)
        ...this.extractStatistics(match.statistics || []),
        
        // További információk
        ...this.extractInformation(match.information || [])
      };
      
      mlRows.push(row);
    });
    
    return mlRows;
  }

  /**
   * Meccs kimenetel meghatározása
   */
  static getMatchResult(homeScore, awayScore) {
    const home = parseInt(homeScore) || 0;
    const away = parseInt(awayScore) || 0;
    
    if (home > away) return 'HOME_WIN';
    if (away > home) return 'AWAY_WIN';
    return 'DRAW';
  }

  /**
   * Statisztikák kinyerése és normalizálása
   */
  static extractStatistics(statistics) {
    const stats = {};
    
    statistics.forEach(stat => {
      const category = stat.category?.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!category) return;
      
      // Numerikus értékek kinyerése
      const homeValue = this.parseStatValue(stat.homeValue);
      const awayValue = this.parseStatValue(stat.awayValue);
      
      stats[`${category}_home`] = homeValue;
      stats[`${category}_away`] = awayValue;
      
      // Különbség és arány számítása
      if (homeValue !== null && awayValue !== null) {
        stats[`${category}_diff`] = homeValue - awayValue;
        if (awayValue !== 0) {
          stats[`${category}_ratio`] = homeValue / awayValue;
        }
      }
    });
    
    return stats;
  }

  /**
   * Információk kinyerése
   */
  static extractInformation(information) {
    const info = {};
    
    information.forEach(item => {
      const category = item.category?.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (category) {
        info[category] = item.value;
      }
    });
    
    return info;
  }

  /**
   * Statisztikai érték parsing (%, szám, stb.)
   */
  static parseStatValue(value) {
    if (!value || value === '-') return null;
    
    // Százalék
    if (value.includes('%')) {
      return parseFloat(value.replace('%', ''));
    }
    
    // Szám
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * ML dataset generálása egy ligából
   */
  static async generateMLDataset(country, league, season = '2024-2025') {
    try {
      const jsonPath = path.join('./scraped_data', country, league, season);
      const files = await fs.readdir(jsonPath);
      
      let allMLData = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(jsonPath, file);
          const jsonData = await fs.readJson(filePath);
          const mlData = this.convertToMLFormat(jsonData);
          allMLData = allMLData.concat(mlData);
        }
      }
      
      // CSV mentése
      const csvPath = path.join(jsonPath, `${league}_ml_dataset.csv`);
      await this.saveAsCSV(allMLData, csvPath);
      
      logger.info(`ML dataset generálva: ${csvPath} (${allMLData.length} meccs)`);
      return csvPath;
      
    } catch (error) {
      logger.error('Hiba az ML dataset generálása során:', error);
      throw error;
    }
  }

  /**
   * CSV fájl mentése
   */
  static async saveAsCSV(data, filePath) {
    if (data.length === 0) return;
    
    // Headers
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // String értékek idézőjelbe
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');
    
    await fs.writeFile(filePath, csvContent);
  }

  /**
   * Összes liga ML dataset generálása
   */
  static async generateAllMLDatasets() {
    logger.info('🤖 ML datasetek generálása minden ligához...');
    
    const baseDir = './scraped_data';
    if (!await fs.pathExists(baseDir)) {
      logger.warn('Nincs scraped_data mappa');
      return;
    }

    const countries = await fs.readdir(baseDir);
    
    for (const country of countries) {
      const countryPath = path.join(baseDir, country);
      const leagues = await fs.readdir(countryPath);
      
      for (const league of leagues) {
        try {
          await this.generateMLDataset(country, league);
        } catch (error) {
          logger.error(`Hiba ML dataset generálása során: ${country}/${league}`, error);
        }
      }
    }
    
    logger.info('✅ ML datasetek generálása befejezve');
  }

  /**
   * Adatok statisztikai összefoglalója
   */
  static async analyzeDataset(csvPath) {
    try {
      const csvContent = await fs.readFile(csvPath, 'utf8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      const analysis = {
        totalMatches: lines.length - 1,
        features: headers.length,
        headers: headers,
        resultDistribution: { HOME_WIN: 0, AWAY_WIN: 0, DRAW: 0 }
      };
      
      // Eredmény eloszlás
      const resultIndex = headers.indexOf('result');
      if (resultIndex !== -1) {
        for (let i = 1; i < lines.length; i++) {
          const result = lines[i].split(',')[resultIndex];
          if (analysis.resultDistribution[result] !== undefined) {
            analysis.resultDistribution[result]++;
          }
        }
      }
      
      return analysis;
    } catch (error) {
      logger.error('Hiba az adatelemzés során:', error);
      return null;
    }
  }
}