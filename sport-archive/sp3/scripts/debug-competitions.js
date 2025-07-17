// Debug competition mapping
const API_URL = "http://localhost:3001";
const DATE = "2025-07-04";

async function debugCompetitionMapping() {
  console.log("=== COMPETITION MAPPING DEBUG ===");

  try {
    // Get all matches for July 4
    const response = await fetch(`${API_URL}/api/matches?page=1&limit=2000`);
    const data = await response.json();

    const july4Matches = data.data.filter(match => {
      const matchDate = new Date(match.date);
      const utcDateString = matchDate.toISOString().split('T')[0];
      return utcDateString === DATE;
    });

    console.log(`Found ${july4Matches.length} matches for ${DATE}`);

    // Get unique competitions
    const competitions = Array.from(
      new Map(july4Matches.map(match => [match.competition.id, match.competition])).values()
    );

    console.log("\nUnique competitions:");
    competitions.forEach((comp, index) => {
      console.log(`${index + 1}. "${comp.name}" (country: ${comp.country})`);
    });

    // Test the mapping logic manually
    console.log("\nMapping test:");
    competitions.forEach(comp => {
      const name = comp.name.toLowerCase();
      let country = 'Egyéb';

      if (name.includes('argentin')) country = 'Argentína';
      else if (name.includes('brazil')) country = 'Brazília';
      else if (name.includes('chilei')) country = 'Chile';
      else if (name.includes('kolumbiai')) country = 'Kolumbia';
      else if (name.includes('perui')) country = 'Peru';
      else if (name.includes('uruguayi')) country = 'Uruguay';
      else if (name.includes('ecuadori')) country = 'Ecuador';
      else if (name.includes('bolíviai')) country = 'Bolívia';
      else if (name.includes('venezuelai')) country = 'Venezuela';
      else if (name.includes('paraguayi')) country = 'Paraguay';
      else if (name.includes('japán')) country = 'Japán';
      else if (name.includes('dél-koreai')) country = 'Dél-Korea';
      else if (name.includes('kínai')) country = 'Kína';
      else if (name.includes('svéd')) country = 'Svédország';
      else if (name.includes('norvég')) country = 'Norvégország';
      else if (name.includes('finn')) country = 'Finnország';
      else if (name.includes('izlandi')) country = 'Izland';
      else if (name.includes('dán')) country = 'Dánia';
      else if (name.includes('ír')) country = 'Írország';
      else if (name.includes('feröer')) country = 'Feröer-szigetek';
      else if (name.includes('algériai')) country = 'Algéria';
      else if (name.includes('spanyol')) country = 'Spanyolország';
      else if (name.includes('olasz')) country = 'Olaszország';
      else if (name.includes('mls') || name.includes('usl') || name.includes('usa')) country = 'USA';
      else if (name.includes('nwsl')) country = 'USA (női)';
      else if (name.includes('válogatott') || name.includes('vb-selejtező') || name.includes('eb')) country = 'Válogatott';
      else if (name.includes('u21') || name.includes('u19') || name.includes('touloni')) country = 'Ifjúsági';
      else if (name.includes('klubcsapat vb')) country = 'Klubcsapat VB';
      else if (name.includes('gold cup') || name.includes('concacaf')) country = 'CONCACAF';
      else if (name.includes('ázsia') || name.includes('cosafa')) country = 'Nemzetközi kupák';

      const status = country === 'Egyéb' ? '❌ UNMATCHED' : '✅ MATCHED';
      console.log(`${status} "${comp.name}" -> ${country}`);
    });

    // Count matches per mapped country
    console.log("\nMatches per country after mapping:");
    const countryMatches = {};
    july4Matches.forEach(match => {
      const name = match.competition.name.toLowerCase();
      let country = 'Egyéb';

      if (name.includes('argentin')) country = 'Argentína';
      else if (name.includes('brazil')) country = 'Brazília';
      else if (name.includes('perui')) country = 'Peru';
      else if (name.includes('paraguayi')) country = 'Paraguay';
      else if (name.includes('finn')) country = 'Finnország';
      else if (name.includes('ír')) country = 'Írország';
      else if (name.includes('mls')) country = 'USA';
      else if (name.includes('eb')) country = 'Válogatott';

      if (!countryMatches[country]) countryMatches[country] = 0;
      countryMatches[country]++;
    });

    Object.entries(countryMatches).forEach(([country, count]) => {
      console.log(`${country}: ${count} meccs`);
    });

  } catch (error) {
    console.error("Hiba:", error);
  }
}

// Node.js esetén
if (typeof require !== 'undefined') {
  const fetch = require('node-fetch');
  debugCompetitionMapping();
} else {
  debugCompetitionMapping();
}
