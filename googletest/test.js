"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
async function googleSearchAndScreenshot(query, screenshotPath) {
    const browser = await puppeteer_1.default.launch({ headless: false, slowMo: 100 }); // headless: false, slowMo: 100
    const page = await browser.newPage();
    await page.goto('https://www.google.com/ncr', { waitUntil: 'domcontentloaded' }); // /ncr megakadályozza a régió szerinti átirányítást
    // Cookie popup elfogadása, ha van
    try {
        await page.waitForSelector('button[aria-label="Elfogadom mindet"], button[aria-label="Accept all"]', { timeout: 5000 });
        await page.click('button[aria-label="Elfogadom mindet"], button[aria-label="Accept all"]');
        await new Promise(res => setTimeout(res, 1000));
    }
    catch (e) {
        // Ha nincs ilyen gomb, nem baj
    }
    // Várunk a keresőmezőre
    await page.waitForSelector('input[name="q"]', { timeout: 15000 });
    await page.type('input[name="q"]', query);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    // Várunk az eredményekre
    await page.waitForSelector('#search', { timeout: 10000 });
    // Screenshot az eredményekről
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await browser.close();
    console.log(`Screenshot saved to ${screenshotPath}`);
}
// Példa használat:
googleSearchAndScreenshot('foci eredmények', 'google_results.png');
