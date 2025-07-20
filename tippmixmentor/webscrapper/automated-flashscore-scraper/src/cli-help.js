/**
 * Súgó megjelenítése
 */
showHelp() {
  console.log('🎯 BettingMentor Automatizált Flashscore Scraper');
  console.log('================================================\n');
  
  console.log('HASZNÁLAT:');
  console.log('  node src/cli.js <parancs>\n');
  
  console.log('PARANCSOK:');
  console.log('  start         🚀 Scraping indítása (konfigurált ligák)');
  console.log('  select        🎯 Interaktív ország/liga kiválasztás');
  console.log('  comprehensive 🌟 MINDEN elérhető adat letöltése');
  console.log('  discover      🔍 Elérhető országok/ligák felfedezése');
  console.log('  ml-dataset    🤖 ML datasetek generálása (JSON→CSV)');
  console.log('  refresh-cache 🔄 Országok és ligák cache frissítése');
  console.log('  cache-status  📋 Cache állapot megjelenítése');
  console.log('  status        📊 Aktuális státusz');
  console.log('  config        ⚙️  Konfiguráció megjelenítése');
  console.log('  stats         📈 Adatgyűjtési statisztikák');
  console.log('  clean         🧹 Összes adat törlése');
  console.log('  help          ❓ Ez a súgó\n');
  
  console.log('PÉLDÁK:');
  console.log('  node src/cli.js start');
  console.log('  node src/cli.js select');
  console.log('  node src/cli.js refresh-cache\n');
}