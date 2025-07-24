// the goal is to scrap tipplap url and save data.
import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://www.tipplap.hu/kalkulator';
const dataDir = path.join(__dirname, 'data');

/**
 * Scrapes match data from tipplap.hu
 */
async function scrapeTipplap() {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    try {
        console.log(`🌍 Navigating to ${baseUrl}...`);
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });

        console.log('⏳ Waiting for match data to load...');
        await page.waitForSelector('.match-row');

        console.log('🔍 Scraping match data...');
        const matches = await page.evaluate(() => {
            const scrapedData = [];
            const matchRows = document.querySelectorAll('.match-row');

            matchRows.forEach(row => {
                const homeTeam = row.querySelector('.home-team')?.innerText.trim();
                const awayTeam = row.querySelector('.away-team')?.innerText.trim();
                const matchDate = row.querySelector('.match-date')?.innerText.trim();

                if (homeTeam && awayTeam) {
                    const odds = {};
                    const oddsItems = row.querySelectorAll('.odds-item');
                    oddsItems.forEach(item => {
                        const name = item.querySelector('.odds-name')?.innerText.trim();
                        const value = item.querySelector('.odds-value')?.innerText.trim();
                        if (name && value) {
                            odds[name] = parseFloat(value.replace(',', '.'));
                        }
                    });

                    scrapedData.push({
                        id: `${matchDate}-${homeTeam}-${awayTeam}`.replace(/\s/g, '_').replace(/[.:]/g, ''),
                        homeTeam,
                        awayTeam,
                        matchDate,
                        odds
                    });
                }
            });

            return scrapedData;
        });

        console.log(`✅ Scraped ${matches.length} matches.`);

        if (matches.length > 0) {
            await mkdir(dataDir, { recursive: true });
            const today = new Date().toISOString().split('T')[0];
            const filePath = path.join(dataDir, `tipplap_data_${today}.json`);

            await writeFile(filePath, JSON.stringify(matches, null, 2));
            console.log(`💾 Data saved to ${filePath}`);
        } else {
            console.log('No matches found to save.');
        }

    } catch (error) {
        console.error('❌ An error occurred during scraping:', error);
    } finally {
        console.log('🚪 Closing browser...');
        await browser.close();
    }
}

scrapeTipplap();

