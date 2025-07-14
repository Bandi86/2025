import puppeteer from 'puppeteer';
import fs from 'fs';
import * as cheerio from 'cheerio';

type Match = {
  league: string;
  homeTeam: string;
  awayTeam: string;
  score?: string;
};

(async () => {
  console.log('[🚀] Böngésző indítása...');

  const browser = await puppeteer.launch({
    headless: true, // Állítsd false-ra, ha látni akarod
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  console.log('[🌍] Navigálás a FlashScore főoldalra...');
  await page.goto('https://www.flashscore.com/football/', {
    waitUntil: 'networkidle2', // akkor folytat, ha nincs több hálózati kérés
  });

  console.log('[🍪] Cookie hozzájárulás elfogadása...');
  try {
    await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
    await page.click('#onetrust-accept-btn-handler');
    console.log('[✅] Cookie elfogadva.');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 másodperc várakozás
  } catch (error) {
    console.log('[ℹ️] Nem található cookie ablak, vagy hiba történt a bezárásakor.');
  }

  console.log('[⏳] Várakozás a meccsek konténerének betöltődésére...');
  await page.waitForSelector('#live-table', { timeout: 15000 });
  console.log('[✅] Meccsek konténere betöltődött.');

  console.log('[⏳] Várakozás az első meccs megjelenésére...');
  await page.waitForSelector('[data-event-row="true"]', { timeout: 10000 });
  console.log('[✅] Első meccs megjelent.');

  console.log('[⏳] Várakozás a meccsek számának stabilizálódására...');
  await page.waitForFunction(() => {
    const liveTable = document.querySelector('#live-table');
    if (!liveTable) return false;
    const matchCount = liveTable.querySelectorAll('[data-event-row="true"]').length;
    // Store previous count and timestamp to check for stability
    // This requires a global variable or passing state, which is complex in waitForFunction.
    // For simplicity, we'll just wait for a reasonable number of matches to appear.
    return matchCount > 10; // Wait until at least 10 matches are loaded
  }, { timeout: 30000 }); // Max 30 seconds wait
  console.log('[✅] Meccsek száma stabilizálódott.');

  console.log('[🔍] Meccsek feldolgozása Cheerio segítségével...');

  const htmlContent = await page.content(); // Get the full HTML content from Puppeteer
  const $ = cheerio.load(htmlContent);

  console.log(`Cheerio: #live-table found: ${$('#live-table').length}`);
  console.log(`Cheerio: Total descendants of #live-table: ${$('#live-table').find('*').length}`);

  const matches: Match[] = [];
  let currentLeague = '';

  // Select all potential league headers and match rows within #live-table
  $('#live-table').find('.event__header, [data-event-row="true"]').each((index, element) => {
    const $element = $(element);

    if ($element.hasClass('event__header')) {
      const leagueEl = $element.find('.event__title--name');
      if (leagueEl.length) {
        currentLeague = leagueEl.text().trim();
      }
    } else if ($element.attr('data-event-row') === 'true') {
      const homeTeam = $element.find('.event__homeParticipant .wcl-name_3y6f5').text().trim();
      const awayTeam = $element.find('.event__awayParticipant .wcl-name_3y6f5').text().trim();
      const scoreHome = $element.find('.event__score--home').text().trim();
      const scoreAway = $element.find('.event__score--away').text().trim();
      const score = scoreHome && scoreAway ? `${scoreHome} - ${scoreAway}` : undefined;

      if (homeTeam && awayTeam) {
        matches.push({
          league: currentLeague,
          homeTeam,
          awayTeam,
          score,
        });
      }
    }
  });

  console.log(`[✅] Meccsek száma: ${matches.length}`);
  console.log('[📄] Az első 5 meccs:');
  console.log(matches.slice(0, 5));

  // Eredmény mentése JSON fájlba
  fs.writeFileSync('flashscore.json', JSON.stringify(matches, null, 2));
  console.log('[💾] Mentve: flashscore.json');

  await browser.close();
  console.log('[👋] Böngésző bezárva.');
})();