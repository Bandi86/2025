import { scrapeLeague } from './src/scraper.js';
import { closeBrowser } from './src/browser.js';
import { saveDataToFile } from './src/fileManager.js';

const testUrl = 'https://www.flashscore.com/football/england/premier-league-2023-2024/results/';

(async () => {
  console.log(`Testing scraper with URL: ${testUrl}`);
  const allMatchData = await scrapeLeague(testUrl);
  console.log(`Found data for ${Object.keys(allMatchData).length} matches.`);
  
  await saveDataToFile(allMatchData, 'england', 'premier-league', '2023-2024', 'test_matches');

  await closeBrowser();
})();