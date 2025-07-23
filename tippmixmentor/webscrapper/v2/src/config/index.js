export const CONFIG = {
    // Rate limiting beállítások - konzervatívabb értékek
    DELAY_BETWEEN_MATCHES: 2000, // 2 másodperc
    DELAY_BETWEEN_LEAGUES: 8000, // 8 másodperc
    DELAY_BETWEEN_COUNTRIES: 20000, // 20 másodperc
    DELAY_BETWEEN_LOAD_MORE: 1500, // 1.5 másodperc load more gombok között

    // Scraping beállítások
    BASE_URL: 'https://www.flashscore.com',
    TIMEOUT: 45000, // Növelt timeout
    HEADLESS: true,
    
    // Load more kezelés
    MAX_LOAD_MORE_ATTEMPTS: 200, // Maximum load more kattintások
    MAX_NO_NEW_MATCHES_ATTEMPTS: 5, // Hányszor próbálja újra ha nincs új meccs
    LOAD_MORE_WAIT_TIME: 3000, // Várakozás load more után

    // Fájl szervezés
    OUTPUT_BASE_PATH: './data',
    FILE_FORMAT: 'json',
    
    // Logging
    LOG_LEVEL: 'info', // debug, info, warn, error
    LOG_FILE: './logs/scraper.log',
    
    // Browser beállítások
    BROWSER_ARGS: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
    ],

    // Célországok és ligák (alapértelmezett)
    TARGET_LEAGUES: [
        { country: 'hungary', leagues: ['nb-i', 'nb-ii'] },
        { country: 'england', leagues: ['premier-league', 'championship'] },
        { country: 'spain', leagues: ['laliga', 'laliga2'] },
        { country: 'italy', leagues: ['serie-a', 'serie-b'] },
        { country: 'germany', leagues: ['bundesliga', '2-bundesliga'] },
        { country: 'france', leagues: ['ligue-1', 'ligue-2'] }
    ],

    // Selectors - ezeket az LLM adapter is használhatja
    SELECTORS: {
        MATCH_ELEMENT: '.event__match--static[id^="g_1_"]',
        SHOW_MORE_BUTTON: '.event__more.event__more--static',
        SEASON_ARCHIVE: 'div.archive__season > a',
        MATCH_DATE: '.duelParticipant__startTime',
        MATCH_STATUS: '.fixedHeaderDuel__detailStatus',
        HOME_TEAM: '.duelParticipant__home .participant__participantName.participant__overflow',
        AWAY_TEAM: '.duelParticipant__away .participant__participantName.participant__overflow',
        MATCH_SCORE: '.detailScore__wrapper span:not(.detailScore__divider)',
        MATCH_INFO: "div[data-testid='wcl-summaryMatchInformation'] > div",
        MATCH_STATS: "div[data-testid='wcl-statistics']"
    }
};