// espn-soccer-details.js
import fetch from 'node-fetch';
import { DateTime } from 'luxon';
import fs from 'fs';

const leagues = [
  { name: 'Premier League', code: 'eng.1' },
  { name: 'La Liga', code: 'esp.1' },
  { name: 'Serie A', code: 'ita.1' },
  { name: 'Bundesliga', code: 'ger.1' },
  { name: 'UEFA Champions League', code: 'uefa.champions' },
];

async function fetchLeagueData(league) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const events = data.events ?? [];

    return {
      league: league.name,
      code: league.code,
      matches: events.map((event) => {
        const comp = event.competitions?.[0];
        const status = comp?.status?.type?.description || 'unknown';
        const home = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || 'N/A';
        const away = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || 'N/A';

        const startTimeUTC = event.date;
        const startTimeLocal = DateTime.fromISO(startTimeUTC).setZone('Europe/Budapest').toFormat('yyyy-MM-dd HH:mm');

        const odds = comp?.odds?.map(o => ({
          provider: o.provider?.name,
          details: o.details,
          overUnder: o.overUnder,
        })) ?? [];

        return {
          match: `${home} vs ${away}`,
          status,
          startTimeUTC,
          startTimeLocal,
          odds,
        };
      }),
    };

  } catch (err) {
    console.error(`❌ ${league.name}: ${err.message}`);
    return { league: league.name, code: league.code, error: err.message, matches: [] };
  }
}

async function main() {
  const allData = [];

  for (const league of leagues) {
    console.log(`🔍 Lekérdezés: ${league.name}`);
    const data = await fetchLeagueData(league);
    allData.push(data);
  }

  const timestamp = DateTime.now().toFormat('yyyyMMdd-HHmm');
  const filename = `espn_soccer_data_${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(allData, null, 2), 'utf-8');

  console.log(`✅ Mentve: ${filename}`);
}

main();
