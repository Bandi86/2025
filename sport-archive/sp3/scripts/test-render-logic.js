// Teljes frontend render logika teszt
const API_URL = "http://localhost:3001";
const DATE = "2025-07-04";

// Helper functions (copy from frontend)
function formatCompetitionName(name) {
  return name.replace(/[^\w\s\-áéíóöőúüű]/gi, '').trim();
}

function groupCompetitionsByCountry(competitions) {
  const groups = {};

  competitions.forEach(competition => {
    const name = competition.name.toLowerCase();
    let country = 'Egyéb';

    // Map competition names to countries/regions
    if (name.includes('argentin')) country = 'Argentína';
    else if (name.includes('brazil')) country = 'Brazília';
    else if (name.includes('perui')) country = 'Peru';
    else if (name.includes('paraguayi')) country = 'Paraguay';
    else if (name.includes('finn')) country = 'Finnország';
    else if (name.includes('ír')) country = 'Írország';
    else if (name.includes('mls')) country = 'USA';
    else if (name.includes('eb')) country = 'Válogatott';

    if (!groups[country]) groups[country] = [];
    groups[country].push(competition);
  });

  return groups;
}

async function testFullRenderLogic() {
  console.log("=== TELJES FRONTEND RENDER TESZT ===");

  try {
    // 1. API call (ahogy a useMatches csinálja)
    const response = await fetch(`${API_URL}/api/matches?page=1&limit=2000`);
    const data = await response.json();
    const matches = data.data;

    console.log(`1. Total matches: ${matches.length}`);

    // 2. Filter by date (ahogy page.tsx csinálja)
    const selectedDate = DATE;
    const selectedCompetitions = new Set(); // empty = all selected

    const filteredMatches = matches.filter(match => {
      const matchDate = new Date(match.date);
      const utcDateString = matchDate.toISOString().split('T')[0];
      const dateMatch = utcDateString === selectedDate;
      const competitionMatch = selectedCompetitions.size === 0 || selectedCompetitions.has(match.competition.id);
      return dateMatch && competitionMatch;
    });

    console.log(`2. Filtered matches for ${selectedDate}: ${filteredMatches.length}`);

    // 3. Group by competition (ahogy page.tsx csinálja)
    const grouped = {};
    filteredMatches.forEach((match) => {
      const comp = formatCompetitionName(match.competition.name);
      const date = new Date(match.date).toLocaleDateString('hu-HU');
      if (!grouped[comp]) grouped[comp] = {};
      if (!grouped[comp][date]) grouped[comp][date] = [];
      grouped[comp][date].push(match);
    });

    console.log(`3. Grouped competitions: ${Object.keys(grouped).length}`);
    console.log("   Competitions:", Object.keys(grouped));

    // 4. Get all competitions (ahogy MatchesList csinálja)
    const allCompetitions = Object.entries(grouped).map(([competitionName, dates]) => {
      const firstMatch = Object.values(dates).flat()[0];
      return firstMatch.competition;
    });

    console.log(`4. All competitions: ${allCompetitions.length}`);

    // 5. Group by country (ahogy MatchesList csinálja)
    const groupedCompetitions = groupCompetitionsByCountry(allCompetitions);

    console.log(`5. Countries: ${Object.keys(groupedCompetitions).length}`);

    // 6. Process each country (ahogy MatchesList csinálja)
    let totalRenderedMatches = 0;

    Object.entries(groupedCompetitions).forEach(([country, competitions]) => {
      console.log(`\n📍 Country: ${country}`);

      const countryMatches = competitions.reduce((acc, comp) => {
        const formattedCompName = formatCompetitionName(comp.name);
        const compMatches = grouped[formattedCompName];
        if (compMatches) {
          acc[formattedCompName] = compMatches;
        }
        return acc;
      }, {});

      const totalMatchesInCountry = Object.values(countryMatches)
        .flatMap(dates => Object.values(dates))
        .flat().length;

      console.log(`   Total matches in country: ${totalMatchesInCountry}`);
      totalRenderedMatches += totalMatchesInCountry;

      Object.entries(countryMatches).forEach(([competition, dates]) => {
        const competitionMatchCount = Object.values(dates).flat().length;
        console.log(`   - ${competition}: ${competitionMatchCount} meccs`);
      });
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total filtered matches: ${filteredMatches.length}`);
    console.log(`Total rendered matches: ${totalRenderedMatches}`);
    console.log(`Missing matches: ${filteredMatches.length - totalRenderedMatches}`);

  } catch (error) {
    console.error("Hiba:", error);
  }
}

// Node.js esetén
if (typeof require !== 'undefined') {
  const fetch = require('node-fetch');
  testFullRenderLogic();
} else {
  testFullRenderLogic();
}
