const DatabaseService = require('../src/storage/DatabaseService');
const path = require('path');
const fs = require('fs');

async function testDatabaseService() {
  console.log('Testing DatabaseService...\n');
  
  // Create a test database
  const testDbPath = path.join(__dirname, 'test-db-service.db');
  const dbService = new DatabaseService(testDbPath);
  
  try {
    // Initialize database
    await dbService.initialize();
    console.log('✓ Database initialized successfully');

    // Test health check
    const health = await dbService.healthCheck();
    console.log('✓ Health check passed:', health.status);

    // Test League operations
    console.log('\n--- Testing League Operations ---');
    const league = await dbService.createLeague({
      name: 'Premier League',
      country: 'England',
      season: '2023/24',
      flashscoreUrl: 'https://flashscore.com/football/england/premier-league/'
    });
    console.log('✓ League created:', league.name);

    const retrievedLeague = await dbService.getLeague(league.leagueId);
    console.log('✓ League retrieved:', retrievedLeague.name);

    // Test Match operations
    console.log('\n--- Testing Match Operations ---');
    const match = await dbService.createMatch({
      leagueId: league.leagueId,
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      status: 'finished',
      finalScore: '2-1',
      matchDateTime: new Date() // Use current date
    });
    console.log('✓ Match created:', match.getDisplayName());

    const updatedMatch = await dbService.updateMatch(match.matchId, {
      halfTimeScore: '1-0'
    });
    console.log('✓ Match updated with half-time score:', updatedMatch.halfTimeScore);

    // Test Match Events
    console.log('\n--- Testing Match Events ---');
    const event1 = await dbService.createMatchEvent({
      matchId: match.matchId,
      eventType: 'goal',
      minute: 25,
      playerName: 'Bukayo Saka',
      description: 'Great finish from close range'
    });
    console.log('✓ Match event created:', event1.getDisplayText());

    const event2 = await dbService.createMatchEvent({
      matchId: match.matchId,
      eventType: 'yellow_card',
      minute: 67,
      playerName: 'Thiago Silva'
    });
    console.log('✓ Match event created:', event2.getDisplayText());

    const events = await dbService.getMatchEvents(match.matchId);
    console.log('✓ Retrieved', events.length, 'events for match');

    // Test Match Stats
    console.log('\n--- Testing Match Stats ---');
    const stat1 = await dbService.createMatchStat({
      matchId: match.matchId,
      statName: 'possession',
      homeValue: '58',
      awayValue: '42'
    });
    console.log('✓ Match stat created:', stat1.getDisplayName(), '- Home:', stat1.getFormattedValue('home'));

    const stat2 = await dbService.createMatchStat({
      matchId: match.matchId,
      statName: 'shots',
      homeValue: '12',
      awayValue: '8'
    });
    console.log('✓ Match stat created:', stat2.getDisplayName(), '- Away:', stat2.getFormattedValue('away'));

    const stats = await dbService.getMatchStats(match.matchId);
    console.log('✓ Retrieved', stats.length, 'stats for match');

    // Test Transaction
    console.log('\n--- Testing Transactions ---');
    const transactionResult = await dbService.runTransaction(async (db) => {
      const newLeague = await db.createLeague({
        name: 'La Liga',
        country: 'Spain',
        season: '2023/24'
      });
      const newMatch = await db.createMatch({
        leagueId: newLeague.leagueId,
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        status: 'scheduled'
      });
      return { league: newLeague, match: newMatch };
    });
    console.log('✓ Transaction completed successfully');
    console.log('  - Created league:', transactionResult.league.name);
    console.log('  - Created match:', transactionResult.match.getDisplayName());

    // Test Scraping Logs
    console.log('\n--- Testing Scraping Logs ---');
    await dbService.logScrapingActivity('live_matches', 'success', null, 1250, 15);
    await dbService.logScrapingActivity('historical_data', 'error', 'Network timeout', 5000, 0);
    
    const logs = await dbService.getScrapingLogs({ limit: 10 });
    console.log('✓ Created and retrieved', logs.length, 'scraping logs');

    // Test utility methods
    console.log('\n--- Testing Utility Methods ---');
    const matchDetails = await dbService.getMatchWithDetails(match.matchId);
    console.log('✓ Match details retrieved:');
    console.log('  - Match:', matchDetails.match.getDisplayName());
    console.log('  - Events:', matchDetails.events.length);
    console.log('  - Stats:', matchDetails.stats.length);

    const leagueDetails = await dbService.getLeagueWithMatches(league.leagueId);
    console.log('✓ League details retrieved:');
    console.log('  - League:', leagueDetails.league.name);
    console.log('  - Matches:', leagueDetails.matches.length);

    // Test filtering
    console.log('\n--- Testing Filtering ---');
    const englishLeagues = await dbService.getLeagues({ country: 'England' });
    console.log('✓ Found', englishLeagues.length, 'English leagues');

    const finishedMatches = await dbService.getMatches({ status: 'finished' });
    console.log('✓ Found', finishedMatches.length, 'finished matches');

    console.log('\n🎉 All DatabaseService tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await dbService.close();
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('✓ Test database cleaned up');
    }
  }
}

// Run the test
testDatabaseService();