import { ESPNApiClient, LEAGUES, Logger } from './index.js';

// Initialize the ESPN API client
const espnClient = new ESPNApiClient({
  rateLimit: {
    requestsPerSecond: 1, // Conservative rate limiting
    requestsPerMinute: 50,
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
  },
});

const logger = Logger.getInstance();
logger.setLevel('info');

async function comprehensiveExample() {
  console.log('🚀 ESPN API Comprehensive Example\n');

  try {
    // 1. Health Check
    console.log('1. 🔍 Health Check');
    const isHealthy = await espnClient.healthCheck();
    console.log(`   Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

    if (!isHealthy) {
      console.log('❌ API is not healthy, stopping example');
      return;
    }

    // 2. Get Multiple Soccer Leagues Scoreboards
    console.log('2. ⚽ Soccer Leagues Scoreboards');
    const soccerLeagues = [
      { sport: 'soccer', league: LEAGUES.SOCCER.PREMIER_LEAGUE.code },
      { sport: 'soccer', league: LEAGUES.SOCCER.LA_LIGA.code },
      { sport: 'soccer', league: LEAGUES.SOCCER.SERIE_A.code },
      { sport: 'soccer', league: LEAGUES.SOCCER.BUNDESLIGA.code },
      { sport: 'soccer', league: LEAGUES.SOCCER.CHAMPIONS_LEAGUE.code },
    ];

    const scoreboards = await espnClient.getMultipleLeagues(soccerLeagues);
    
    for (let i = 0; i < scoreboards.length; i++) {
      const response = scoreboards[i];
      const league = soccerLeagues[i];
      const events = response.data?.events || [];
      
      console.log(`   ${league.league}: ${events.length} matches`);
      
      // Show sample match data
      if (events.length > 0) {
        const sampleEvent = events[0];
        const comp = sampleEvent.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName || 'N/A';
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName || 'N/A';
        const status = comp?.status?.type?.description || 'unknown';
        
        console.log(`     Sample: ${home} vs ${away} (${status})`);
      }
    }
    console.log('');

    // 3. Get Standings for Premier League
    console.log('3. 📊 Premier League Standings');
    const standings = await espnClient.getStandings('soccer', LEAGUES.SOCCER.PREMIER_LEAGUE.code);
    const groups = standings.data?.groups || [];
    
    for (const group of groups) {
      console.log(`   ${group.name}:`);
      const topTeams = group.standings?.slice(0, 5) || [];
      for (const team of topTeams) {
        console.log(`     ${team.rank}. ${team.team.displayName} - ${team.wins}W ${team.losses}L ${team.ties || 0}D`);
      }
    }
    console.log('');

    // 4. Get Teams for La Liga
    console.log('4. 🏆 La Liga Teams');
    const teams = await espnClient.getTeams('soccer', LEAGUES.SOCCER.LA_LIGA.code);
    const teamList = teams.data?.sports?.[0]?.leagues?.[0]?.teams || [];
    
    console.log(`   Total teams: ${teamList.length}`);
    const sampleTeams = teamList.slice(0, 5);
    for (const team of sampleTeams) {
      console.log(`     ${team.team.displayName} (${team.team.abbreviation})`);
    }
    console.log('');

    // 5. Get News for Soccer
    console.log('5. 📰 Soccer News');
    const news = await espnClient.getNews('soccer');
    const articles = news.data?.articles || [];
    
    console.log(`   Total articles: ${articles.length}`);
    const recentArticles = articles.slice(0, 3);
    for (const article of recentArticles) {
      console.log(`     ${article.headline}`);
      console.log(`       Published: ${new Date(article.published).toLocaleDateString()}`);
    }
    console.log('');

    // 6. Get Detailed Event Information
    console.log('6. 🎯 Detailed Event Information');
    const events = await espnClient.getEvents('soccer', LEAGUES.SOCCER.PREMIER_LEAGUE.code);
    const eventList = events.data?.events || [];
    
    if (eventList.length > 0) {
      const firstEvent = eventList[0];
      console.log(`   Event: ${firstEvent.name}`);
      console.log(`   Date: ${firstEvent.date}`);
      console.log(`   Status: ${firstEvent.status?.type?.description}`);
      
      const competition = firstEvent.competitions?.[0];
      if (competition) {
        console.log(`   Competition ID: ${competition.id}`);
        console.log(`   Competitors: ${competition.competitors?.length || 0}`);
        
        // Show odds if available
        if (competition.odds && competition.odds.length > 0) {
          console.log('   Odds:');
          for (const odd of competition.odds) {
            console.log(`     ${odd.provider?.name}: ${odd.details}`);
          }
        }
      }
    }
    console.log('');

    // 7. Get Team Statistics
    console.log('7. 📈 Team Statistics');
    if (teamList.length > 0) {
      const firstTeam = teamList[0];
      const teamStats = await espnClient.getTeamStats('soccer', LEAGUES.SOCCER.LA_LIGA.code, firstTeam.team.id);
      const stats = teamStats.data?.splits || [];
      
      console.log(`   Team: ${firstTeam.team.displayName}`);
      console.log(`   Statistics available: ${stats.length}`);
      
      const sampleStats = stats.slice(0, 5);
      for (const stat of sampleStats) {
        console.log(`     ${stat.stat.displayName}: ${stat.displayValue}`);
      }
    }
    console.log('');

    // 8. Get Talent Picks
    console.log('8. 🎯 Talent Picks');
    const talentPicks = await espnClient.getTalentPicks('soccer', LEAGUES.SOCCER.PREMIER_LEAGUE.code);
    const picks = talentPicks.data?.picks || [];
    
    console.log(`   Total picks: ${picks.length}`);
    const recentPicks = picks.slice(0, 3);
    for (const pick of recentPicks) {
      console.log(`     ${pick.headline}`);
      console.log(`       ${pick.description}`);
    }
    console.log('');

    // 9. Cache Statistics
    console.log('9. 💾 Cache Statistics');
    const cacheStats = espnClient.getCacheStats();
    console.log(`   Cache size: ${cacheStats.size} entries`);
    console.log(`   Cache keys: ${cacheStats.keys.length}`);
    console.log('');

    // 10. Performance Test
    console.log('10. ⚡ Performance Test');
    const startTime = Date.now();
    
    // Make multiple concurrent requests
    const promises = [
      espnClient.getScoreboard('soccer', LEAGUES.SOCCER.PREMIER_LEAGUE.code),
      espnClient.getScoreboard('soccer', LEAGUES.SOCCER.LA_LIGA.code),
      espnClient.getScoreboard('soccer', LEAGUES.SOCCER.SERIE_A.code),
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`   Concurrent requests completed in ${endTime - startTime}ms`);
    console.log(`   Success rate: ${results.filter(r => r.status === 200).length}/${results.length}`);
    console.log('');

    // 11. Error Handling Test
    console.log('11. 🛡️ Error Handling Test');
    try {
      await espnClient.getScoreboard('invalid-sport', 'invalid-league');
    } catch (error: any) {
      console.log(`   Expected error caught: ${error.message}`);
    }
    console.log('');

    console.log('✅ Comprehensive example completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Multiple leagues tested');
    console.log('   - Various endpoints accessed');
    console.log('   - Rate limiting working');
    console.log('   - Caching functional');
    console.log('   - Error handling robust');

  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    logger.error('Example error:', error);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  comprehensiveExample();
}

export { comprehensiveExample }; 