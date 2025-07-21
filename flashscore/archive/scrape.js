// scrape.js
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.flashscore.com');

  // várj, míg betölt minden
  await page.waitForTimeout(5000);
  await page.mouse.wheel(0, 2000); // görgetés
  await page.screenshot({ path: 'page.png', fullPage: true });

  const content = await page.content(); // teljes HTML
  const text = await page.innerText('body'); // csak szöveg

  fs.writeFileSync('page.html', content);
  fs.writeFileSync('page.txt', text);

  await browser.close();
})();
