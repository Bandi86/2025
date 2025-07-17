// Frontend működés szimuláció - JavaScript/Node.js kód

const API_URL = "http://localhost:3001";
const DATE = "2025-07-04";

async function simulateFrontendLogic() {
  console.log("=== FRONTEND MŰKÖDÉS SZIMULÁLÁSA ===");

  try {
    // 1. First API call - get total count
    console.log("1. Első API hívás - total count...");
    const firstResponse = await fetch(`${API_URL}/api/matches?page=1&limit=1`);
    const firstData = await firstResponse.json();
    const totalMatches = firstData.pagination?.total || 0;
    console.log(`   Total meccsek: ${totalMatches}`);

    // 2. Second API call - get all matches
    console.log("2. Második API hívás - összes meccs...");
    const response = await fetch(`${API_URL}/api/matches?page=1&limit=${totalMatches}`);
    const data = await response.json();

    if (Array.isArray(data?.data)) {
      console.log(`   Betöltött meccsek: ${data.data.length}`);

      // 3. UTC Date grouping (ahogy a useMatches csinálja)
      console.log("3. UTC dátum csoportosítás...");
      const utcDateGroups = {};
      data.data.forEach((match) => {
        const matchDate = new Date(match.date);
        const utcDateString = matchDate.toISOString().split('T')[0];

        if (!utcDateGroups[utcDateString]) {
          utcDateGroups[utcDateString] = 0;
        }
        utcDateGroups[utcDateString]++;
      });

      console.log("   UTC Date Groups:", utcDateGroups);
      console.log(`   Július 4-es meccsek: ${utcDateGroups[DATE] || 0}`);

      // 4. Szűrés a kiválasztott dátumra (ahogy a page.tsx csinálja)
      console.log("4. Szűrés a kiválasztott dátumra...");
      const selectedDate = DATE;
      const filteredMatches = data.data.filter(match => {
        const matchDate = new Date(match.date);
        const utcDateString = matchDate.toISOString().split('T')[0];
        return utcDateString === selectedDate;
      });

      console.log(`   Szűrt meccsek: ${filteredMatches.length}`);

      // 5. Csoportosítás bajnokság szerint (ahogy a page.tsx csinálja)
      console.log("5. Csoportosítás bajnokság szerint...");
      const grouped = {};
      filteredMatches.forEach((match) => {
        const comp = match.competition.name;
        const date = new Date(match.date).toLocaleDateString('hu-HU');
        if (!grouped[comp]) grouped[comp] = {};
        if (!grouped[comp][date]) grouped[comp][date] = [];
        grouped[comp][date].push(match);
      });

      console.log("   Csoportosított bajnokságok:", Object.keys(grouped));
      console.log(`   Összes csoportosított meccs: ${Object.values(grouped).flatMap(dates => Object.values(dates)).flat().length}`);

      // 6. Részletes meccs lista
      console.log("6. Részletes meccs lista:");
      filteredMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.competition.name})`);
      });

    } else {
      console.log("   ❌ Nincs data.data tömb!");
    }

  } catch (error) {
    console.error("Hiba:", error);
  }
}

// Node.js esetén
if (typeof require !== 'undefined') {
  // Install node-fetch if not available
  const fetch = require('node-fetch');
  simulateFrontendLogic();
} else {
  // Browser esetén
  simulateFrontendLogic();
}
