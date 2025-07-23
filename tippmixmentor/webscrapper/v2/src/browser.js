
import { chromium } from 'playwright';
import { CONFIG } from './config/index.js';
import { logger } from './utils/logger.js';

/**
 * Browser létrehozása optimalizált beállításokkal
 */
export async function createBrowser() {
    try {
        const browser = await chromium.launch({
            headless: CONFIG.HEADLESS,
            args: CONFIG.BROWSER_ARGS,
            timeout: CONFIG.TIMEOUT
        });
        
        logger.info('🌐 Browser sikeresen elindítva');
        return browser;
    } catch (error) {
        logger.error('❌ Browser indítási hiba:', error);
        throw error;
    }
}

/**
 * Új oldal létrehozása és navigálás
 */
export async function createPageAndNavigate(browser, url) {
    const page = await browser.newPage();
    
    // Alapvető beállítások
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    try {
        logger.debug(`🔗 Navigálás: ${url}`);
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: CONFIG.TIMEOUT 
        });
        
        return page;
    } catch (error) {
        logger.error(`❌ Navigálási hiba: ${url}`, error);
        await page.close();
        throw error;
    }
}

/**
 * Biztonságos selector várakozás
 */
export async function waitForSelectorSafe(page, selector, timeout = CONFIG.TIMEOUT) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        logger.warn(`⚠️ Selector nem található: ${selector}`);
        return false;
    }
}

/**
 * Biztonságos kattintás
 */
export async function clickSafe(page, selector, timeout = 5000) {
    try {
        const element = await page.waitForSelector(selector, { timeout });
        if (element) {
            await element.click();
            return true;
        }
        return false;
    } catch (error) {
        logger.debug(`⚠️ Kattintás sikertelen: ${selector}`);
        return false;
    }
}
