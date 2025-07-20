/**
 * Cache frissítése
 */
async refreshCache() {
  console.log('🔄 Cache frissítése...');
  
  try {
    const { createBrowser } = await import('./scraper/browser.js');
    const browser = await createBrowser();
    
    await cacheManager.refreshCache(browser);
    
    await browser.close();
    console.log('✅ Cache frissítése befejezve!');
  } catch (error) {
    console.error('❌ Hiba a cache frissítésekor:', error.message);
  }
}

/**
 * Cache állapot megjelenítése
 */
async showCacheStatus() {
  console.log('📋 CACHE ÁLLAPOT');
  console.log('===============');
  
  try {
    const status = await cacheManager.checkCacheStatus();
    
    if (status.hasCountriesCache) {
      console.log(`🌍 Országok cache: ✅ (${status.countriesCacheAge} napos)`);
    } else {
      console.log('🌍 Országok cache: ❌ (nem található)');
    }
    
    console.log(`🏆 Ligák cache: ${status.leaguesCacheCount} ország`);
    
    if (status.leaguesCacheCount > 0) {
      console.log(`   - Legrégebbi: ${status.oldestLeagueCache} napos`);
      console.log(`   - Legújabb: ${status.newestLeagueCache} napos`);
    }
    
    // Cache érvényesség ellenőrzése
    const cacheValidDays = 7; // Ugyanaz, mint a CacheManager osztályban
    
    if (status.hasCountriesCache && status.countriesCacheAge > cacheValidDays) {
      console.log('\n⚠️  Az országok cache elavult, frissítés javasolt!');
    }
    
    if (status.leaguesCacheCount > 0 && status.oldestLeagueCache > cacheValidDays) {
      console.log('⚠️  Néhány liga cache elavult, frissítés javasolt!');
    }
    
    console.log('\nCache frissítése:');
    console.log('  npm run refresh-cache');
    
  } catch (error) {
    console.error('❌ Hiba a cache állapot ellenőrzésekor:', error.message);
  }
}