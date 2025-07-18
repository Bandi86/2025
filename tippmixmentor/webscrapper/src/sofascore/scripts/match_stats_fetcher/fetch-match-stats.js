const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const matchUrl = process.argv[2]; // Get match URL from command line argument
  if (!matchUrl) {
    console.error('Usage: node fetch-match-stats.js <match_url>');
    process.exit(1);
  }

  const matchId = matchUrl.split('/').pop(); // Extract match ID from URL
  const outputDir = path.join(__dirname, '../../data/match_stats'); // Output to data/match_stats
  const outputFile = path.join(outputDir, `${matchId}.json`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    console.log(`Navigating to ${matchUrl}...`);
    // Increase timeout and wait for network to be idle
    await page.goto(matchUrl, { waitUntil: 'networkidle0', timeout: 90000 }); 
    console.log('Page loaded. Attempting to extract data...');

    const stats = await page.evaluate(() => {
      const data = {};
      // Try to find JSON data embedded in script tags
      const scriptTags = Array.from(document.querySelectorAll('script'));
      for (const script of scriptTags) {
        try {
          // Look for script tags that might contain JSON data (e.g., window.__INITIAL_STATE__)
          if (script.textContent.includes('__INITIAL_STATE__')) {
            const jsonText = script.textContent.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
            if (jsonText && jsonText[1]) {
              return JSON.parse(jsonText[1]);
            }
          }
          // More general attempt to parse any JSON-like content
          if (script.textContent.trim().startsWith('{') && script.textContent.trim().endsWith('}')) {
            return JSON.parse(script.textContent);
          }
        } catch (e) {
          // Ignore parsing errors for non-JSON script tags
        }
      }

      // Fallback: try to extract from known selectors if direct JSON not found
      // This part is highly dependent on SofaScore's DOM structure and might need frequent updates.
      const statSections = document.querySelectorAll('.stat-rows'); 
      if (statSections.length > 0) {
        statSections.forEach((section, index) => {
          const category = section.querySelector('.stat-category')?.innerText.trim() || `Category ${index}`;
          const statsList = [];
          section.querySelectorAll('.stat-row').forEach(row => {
            const label = row.querySelector('.stat-label')?.innerText.trim();
            const homeValue = row.querySelector('.stat-home-value')?.innerText.trim();
            const awayValue = row.querySelector('.stat-away-value')?.innerText.trim();
            if (label) {
              statsList.push({ label, homeValue, awayValue });
            }
          });
          data[category] = statsList;
        });
        return data;
      }

      return null; // No data found
    });

    if (stats) {
      fs.writeFileSync(outputFile, JSON.stringify(stats, null, 2));
      console.log(`✅ Match statistics saved to ${outputFile}`);
    } else {
      console.warn(`⚠️ No statistics found for ${matchUrl}.`);
    }

  } catch (err) {
    console.error(`❌ Fetch failed for ${matchUrl}:`, err);
  } finally {
    await browser.close();
  }
})();