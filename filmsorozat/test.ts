import { chromium } from 'playwright';


const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://videa.hu/videok?search=teljes+film');

const videos = await page.$$eval('.video-card', cards =>
  cards.map(card => ({
    title: card.querySelector('.title')?.textContent ?? '',
    url: card.querySelector('a')?.href ?? ''
  }))
);

console.log(videos);
await browser.close();
