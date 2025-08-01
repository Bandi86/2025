// test-espn.js
import fetch from 'node-fetch';
import { DateTime } from 'luxon';

const leagues = [
  { name: 'Premier League', code: 'eng.1' },
  { name: 'La Liga', code: 'esp.1' },
  { name: 'Serie A', code: 'ita.1' },
  { name: 'Bundesliga', code: 'ger.1' },
  { name: 'UEFA Champions League', code: 'uefa.champions' },
];

async function testESPNAPI() {
  console.log('🧪 Testing ESPN API Integration...\n');
  
  let totalMatches = 0;
  let successfulLeagues = 0;
  let failedLeagues = 0;

  for (const league of leagues) {
    console.log(`🔍 Testing: ${league.name} (${league.code})`);
    
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.events ?? [];
      
      console.log(`   ✅ Success: ${events.length} matches found`);
      totalMatches += events.length;
      successfulLeagues++;

      // Show sample match data
      if (events.length > 0) {
        const sampleEvent = events[0];
        const comp = sampleEvent.competitions?.[0];
        const home = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || 'N/A';
        const away = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || 'N/A';
        const status = comp?.status?.type?.description || 'unknown';
        
        console.log(`   📊 Sample: ${home} vs ${away} (${status})`);
      }

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedLeagues++;
    }
    
    console.log('');
  }

  // Summary
  console.log('📈 Test Summary:');
  console.log(`   ✅ Successful leagues: ${successfulLeagues}/${leagues.length}`);
  console.log(`   ❌ Failed leagues: ${failedLeagues}/${leagues.length}`);
  console.log(`   📊 Total matches found: ${totalMatches}`);
  
  if (failedLeagues === 0) {
    console.log('\n🎉 All tests passed! ESPN API integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Test data structure validation
function validateDataStructure(data) {
  console.log('\n🔍 Validating data structure...');
  
  const requiredFields = ['league', 'code', 'matches'];
  const matchFields = ['match', 'status', 'startTimeUTC', 'startTimeLocal', 'odds'];
  
  let isValid = true;
  
  for (const leagueData of data) {
    // Check league data structure
    for (const field of requiredFields) {
      if (!(field in leagueData)) {
        console.log(`   ❌ Missing field '${field}' in league data`);
        isValid = false;
      }
    }
    
    // Check match data structure
    for (const match of leagueData.matches) {
      for (const field of matchFields) {
        if (!(field in match)) {
          console.log(`   ❌ Missing field '${field}' in match data`);
          isValid = false;
        }
      }
    }
  }
  
  if (isValid) {
    console.log('   ✅ Data structure validation passed');
  }
  
  return isValid;
}

// Run tests
testESPNAPI().then(() => {
  console.log('\n🏁 ESPN API testing completed!');
}); 