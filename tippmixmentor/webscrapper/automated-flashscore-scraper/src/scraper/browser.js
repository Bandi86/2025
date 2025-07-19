import puppeteer from 'puppeteer';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Browser példány létrehozása optimalizált beállításokkal
 */
export const createBrowser = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: {
        width: 1366,
        height: 768
      }
    });
    
    logger.info('Browser sikeresen elindítva');
    return browser;
  } catch (error) {
    logger.error('Hiba a browser indításakor:', error);
    throw error;
  }
};

/**
 * Új oldal megnyitása és navigálás
 * @param {Object} browser - Puppeteer browser példány
 * @param {string} url - Cél URL
 */
export const openPageAndNavigate = async (browser, url) => {
  const page = await browser.newPage();
  
  // User agent beállítása
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });
  
  try {
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.TIMEOUT 
    });
    
    logger.debug(`Navigálás sikeres: ${url}`);
    return page;
  } catch (error) {
    logger.error(`Navigálási hiba: ${url}`, error);
    await page.close();
    throw error;
  }
};

/**
 * Biztonságos selector várakozás
 * @param {Object} page - Puppeteer page példány
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout milliszekundumban
 */
export const waitForSelectorSafe = async (page, selector, timeout = CONFIG.TIMEOUT) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    logger.warn(`Selector nem található: ${selector}`);
    return false;
  }
};

/**
 * Biztonságos kattintás
 * @param {Object} page - Puppeteer page példány
 * @param {string} selector - CSS selector
 */
export const waitAndClick = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { timeout: CONFIG.TIMEOUT });
    await page.click(selector);
    return true;
  } catch (error) {
    logger.debug(`Kattintás sikertelen: ${selector}`);
    return false;
  }
};