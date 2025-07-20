import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';

/**
 * HTML struktúra elemzése és mentése
 * @param {Object} page - Puppeteer page példány
 * @param {string} selector - CSS selector
 * @param {string} filename - Kimeneti fájlnév
 */
export const analyzeHtmlStructure = async (page, selector, filename) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug');
    await fs.ensureDir(debugDir);
    
    const outputPath = path.join(debugDir, `${filename}.json`);
    
    const structure = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) return { error: 'No elements found' };
      
      const firstElement = elements[0];
      
      // HTML struktúra elemzése
      const analyzeElement = (element, depth = 0) => {
        if (depth > 5) return { maxDepthReached: true };
        
        const result = {
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          classes: Array.from(element.classList),
          attributes: {},
          children: []
        };
        
        // Attribútumok kinyerése
        Array.from(element.attributes).forEach(attr => {
          if (attr.name !== 'class' && attr.name !== 'id') {
            result.attributes[attr.name] = attr.value;
          }
        });
        
        // Gyermek elemek elemzése
        if (depth < 5) {
          Array.from(element.children).slice(0, 10).forEach(child => {
            result.children.push(analyzeElement(child, depth + 1));
          });
        }
        
        return result;
      };
      
      return {
        count: elements.length,
        firstElement: analyzeElement(firstElement),
        allClasses: Array.from(document.querySelectorAll('*'))
          .map(el => Array.from(el.classList))
          .flat()
          .filter(cls => cls.includes('match') || cls.includes('event'))
          .filter((value, index, self) => self.indexOf(value) === index)
      };
    }, selector);
    
    await fs.writeJson(outputPath, structure, { spaces: 2 });
    logger.info(`HTML struktúra elemzés mentve: ${outputPath}`);
    
    // Képernyőkép készítése
    await page.screenshot({ path: path.join(debugDir, `${filename}.png`), fullPage: true });
    logger.info(`Képernyőkép mentve: ${path.join(debugDir, `${filename}.png`)}`);
    
    return structure;
  } catch (error) {
    logger.error('Hiba a HTML struktúra elemzésekor:', error);
    return null;
  }
};

/**
 * Összes elérhető CSS selector keresése
 * @param {Object} page - Puppeteer page példány
 * @param {string} pattern - Keresési minta (pl. 'match', 'event')
 * @param {string} filename - Kimeneti fájlnév
 */
export const findAllSelectors = async (page, pattern, filename) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug');
    await fs.ensureDir(debugDir);
    
    const outputPath = path.join(debugDir, `${filename}.json`);
    
    const selectors = await page.evaluate((pattern) => {
      const allElements = document.querySelectorAll('*');
      const classMap = {};
      const idMap = {};
      
      Array.from(allElements).forEach(el => {
        // Osztályok gyűjtése
        Array.from(el.classList).forEach(cls => {
          if (cls.includes(pattern)) {
            if (!classMap[cls]) classMap[cls] = 0;
            classMap[cls]++;
          }
        });
        
        // ID-k gyűjtése
        if (el.id && el.id.includes(pattern)) {
          if (!idMap[el.id]) idMap[el.id] = 0;
          idMap[el.id]++;
        }
      });
      
      return {
        classes: Object.entries(classMap)
          .map(([cls, count]) => ({ selector: `.${cls}`, count }))
          .sort((a, b) => b.count - a.count),
        ids: Object.entries(idMap)
          .map(([id, count]) => ({ selector: `#${id}`, count }))
          .sort((a, b) => b.count - a.count)
      };
    }, pattern);
    
    await fs.writeJson(outputPath, selectors, { spaces: 2 });
    logger.info(`Selector keresés eredménye mentve: ${outputPath}`);
    
    return selectors;
  } catch (error) {
    logger.error('Hiba a selectorok keresésekor:', error);
    return null;
  }
};