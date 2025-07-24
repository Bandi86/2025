export const BASE_URL = 'https://www.flashscore.com';
export const OUTPUT_PATH = './data';
export const TIMEOUT = 5000;
export const TIMEOUT_FAST = 2000;

// Browser configuration
export const BROWSER_CONFIG = {
  headless: true,
  viewport: {
    width: 1920,
    height: 1080
  },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Scraping delays
export const DELAYS = {
  CLICK: 500,
  NAVIGATION: 1000,
  RETRY: 2000
};