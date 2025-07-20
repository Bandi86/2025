export const CONFIG = {
  // Rate limiting beállítások
  DELAY_BETWEEN_MATCHES: 3000, // 3 másodperc késleltetés meccsek között
  DELAY_BETWEEN_LEAGUES: 10000, // 10 másodperc késleltetés ligák között
  DELAY_BETWEEN_COUNTRIES: 30000, // 30 másodperc késleltetés országok között
  
  // Scraping beállítások
  BASE_URL: 'https://www.flashscore.com',
  TIMEOUT: 10000,
  HEADLESS: true,
  
  // Fájl szervezés
  OUTPUT_BASE_PATH: './scraped_data',
  FILE_FORMAT: 'json', // 'json' vagy 'csv'
  
  // Logging
  LOG_LEVEL: 'info',
  LOG_FILE: './logs/scraper.log',
  
  // Cron beállítások (opcionális automatikus futtatáshoz)
  CRON_SCHEDULE: '0 2 * * *', // Minden nap hajnali 2-kor
  
  // Célországok és ligák
  TARGET_LEAGUES: [
    {
      country: 'hungary',
      leagues: ['nb-i-2024-2025', 'nb-i-2023-2024']
    },
    {
      country: 'czech-republic',
      leagues: ['fortuna-liga-2024-2025']
    },
    {
      country: 'spain',
      leagues: ['laliga-2023-2024', 'laliga-2024-2025']
    },
    {
      country: 'germany',
      leagues: ['bundesliga-2022-2023', 'bundesliga-2023-2024', 'bundesliga-2024-2025']
    },
    {
      country: 'france',
      leagues: ['ligue-1-2023-2024', 'ligue-1-2024-2025']
    },
    {
      country: 'italy',
      leagues: ['serie-a-2023-2024', 'serie-a-2024-2025']
    },
    {
      country: 'england',
      leagues: ['premier-league-2023-2024', 'premier-league-2024-2025']
    }
  ]
};