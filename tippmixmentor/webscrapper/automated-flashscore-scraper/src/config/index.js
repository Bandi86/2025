export const CONFIG = {
    // Rate limiting beállítások
    DELAY_BETWEEN_MATCHES: 3000, // 3 másodperc késleltetés meccsek között
    DELAY_BETWEEN_LEAGUES: 10000, // 10 másodperc késleltetés ligák között
    DELAY_BETWEEN_COUNTRIES: 30000,
    // 30 másodperc késleltetés országok között

    // Scraping beállítások
    BASE_URL: 'https://www.flashscore.com',
    TIMEOUT: 30000,
    HEADLESS: true,

    // Fájl szervezés
    OUTPUT_BASE_PATH: './scraped_data',
    FILE_FORMAT: 'json',
    // 'json' vagy 'csv'

    // Logging
    LOG_LEVEL: 'info',
    LOG_FILE: './logs/scraper.log',

    // Cron beállítások (opcionális automatikus futtatáshoz)
    CRON_SCHEDULE: '0 2 * * *',
    // Minden nap hajnali 2-kor

    // Célországok és ligák
    TARGET_LEAGUES: [
        { country: 'england', leagues: ['premier-league', 'championship', 'league-one', 'league-two'] },
        { country: 'spain', leagues: ['laliga', 'laliga2'] },
        { country: 'italy', leagues: ['serie-a', 'serie-b'] },
        { country: 'germany', leagues: ['bundesliga', '2-bundesliga'] },
        { country: 'france', leagues: ['ligue-1', 'ligue-2'] },
        { country: 'netherlands', leagues: ['eredivisie'] },
        { country: 'portugal', leagues: ['primeira-liga'] },
        { country: 'turkey', leagues: ['super-lig'] }
    ]
};
