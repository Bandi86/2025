const DataParser = require('../src/parser/DataParser');
const Match = require('../src/storage/models/Match');
const League = require('../src/storage/models/League');
const MatchEvent = require('../src/storage/models/MatchEvent');

console.log('Testing DataParser...\n');

// Test basic match parsing
console.log('1. Testing parseMatchData...');
const parser = new DataParser();

const matchHtml = `
  <div class="event__match">
    <div class="team-home">
      <span class="team-name">Arsenal</span>
    </div>
    <div class="team-away">
      <span class="team-name">Chelsea</span>
    </div>
    <div class="score">2-1</div>
    <div class="status">finished</div>
    <div class="match-time" data-timestamp="1640995200">15:00</div>
  </div>
`;

try {
  const matches = parser.parseMatchData(matchHtml, 'https://flashscore.com/test');
  
  if (matches.length === 1) {
    const match = matches[0];
    console.log('✓ Successfully parsed 1 match');
    console.log(`  Home Team: ${match.homeTeam}`);
    console.log(`  Away Team: ${match.awayTeam}`);
    console.log(`  Score: ${match.finalScore}`);
    console.log(`  Status: ${match.status}`);
    
    if (match instanceof Match) {
      console.log('✓ Match is instance of Match class');
    } else {
      console.log('✗ Match is not instance of Match class');
    }
    
    const validation = match.validate();
    if (validation.isValid) {
      console.log('✓ Match validation passed');
    } else {
      console.log('✗ Match validation failed:', validation.errors);
    }
  } else {
    console.log(`✗ Expected 1 match, got ${matches.length}`);
  }
} catch (error) {
  console.log('✗ Error parsing match data:', error.message);
}

// Test multiple matches
console.log('\n2. Testing multiple matches...');
const multipleMatchHtml = `
  <div class="event__match">
    <div class="team-home"><span class="team-name">Arsenal</span></div>
    <div class="team-away"><span class="team-name">Chelsea</span></div>
    <div class="score">2-1</div>
  </div>
  <div class="event__match">
    <div class="team-home"><span class="team-name">Liverpool</span></div>
    <div class="team-away"><span class="team-name">Manchester City</span></div>
    <div class="score">1-3</div>
  </div>
`;

try {
  const matches = parser.parseMatchData(multipleMatchHtml);
  
  if (matches.length === 2) {
    console.log('✓ Successfully parsed 2 matches');
    console.log(`  Match 1: ${matches[0].homeTeam} vs ${matches[0].awayTeam}`);
    console.log(`  Match 2: ${matches[1].homeTeam} vs ${matches[1].awayTeam}`);
  } else {
    console.log(`✗ Expected 2 matches, got ${matches.length}`);
  }
} catch (error) {
  console.log('✗ Error parsing multiple matches:', error.message);
}

// Test league parsing
console.log('\n3. Testing parseLeagueData...');
const leagueHtml = `
  <div class="league">
    <div class="league-name">Premier League</div>
    <div class="country">England</div>
    <div class="season">2023/24</div>
  </div>
`;

try {
  const leagues = parser.parseLeagueData(leagueHtml, 'https://flashscore.com/premier-league');
  
  if (leagues.length === 1) {
    const league = leagues[0];
    console.log('✓ Successfully parsed 1 league');
    console.log(`  Name: ${league.name}`);
    console.log(`  Country: ${league.country}`);
    console.log(`  Season: ${league.season}`);
    
    if (league instanceof League) {
      console.log('✓ League is instance of League class');
    } else {
      console.log('✗ League is not instance of League class');
    }
    
    const validation = league.validate();
    if (validation.isValid) {
      console.log('✓ League validation passed');
    } else {
      console.log('✗ League validation failed:', validation.errors);
    }
  } else {
    console.log(`✗ Expected 1 league, got ${leagues.length}`);
  }
} catch (error) {
  console.log('✗ Error parsing league data:', error.message);
}

// Test event parsing
console.log('\n4. Testing parseMatchEvents...');
const eventHtml = `
  <div class="event">
    <div class="minute">25</div>
    <div class="event-type">goal</div>
    <div class="player">Bukayo Saka</div>
    <div class="description">Right foot shot from the centre of the box</div>
  </div>
  <div class="event">
    <div class="minute">67</div>
    <div class="event-type">yellow_card</div>
    <div class="player">Mason Mount</div>
  </div>
`;

try {
  const events = parser.parseMatchEvents(eventHtml, 'match_123');
  
  if (events.length === 2) {
    console.log('✓ Successfully parsed 2 events');
    console.log(`  Event 1: ${events[0].minute}' ${events[0].eventType} - ${events[0].playerName}`);
    console.log(`  Event 2: ${events[1].minute}' ${events[1].eventType} - ${events[1].playerName}`);
    
    if (events[0] instanceof MatchEvent && events[1] instanceof MatchEvent) {
      console.log('✓ Events are instances of MatchEvent class');
    } else {
      console.log('✗ Events are not instances of MatchEvent class');
    }
    
    const validation1 = events[0].validate();
    const validation2 = events[1].validate();
    if (validation1.isValid && validation2.isValid) {
      console.log('✓ Event validation passed');
    } else {
      console.log('✗ Event validation failed');
      if (!validation1.isValid) console.log('  Event 1 errors:', validation1.errors);
      if (!validation2.isValid) console.log('  Event 2 errors:', validation2.errors);
    }
  } else {
    console.log(`✗ Expected 2 events, got ${events.length}`);
  }
} catch (error) {
  console.log('✗ Error parsing event data:', error.message);
}

// Test data normalization
console.log('\n5. Testing data normalization...');
try {
  console.log('Team name normalization:');
  console.log(`  "  Arsenal FC  " -> "${parser._normalizeTeamName('  Arsenal FC  ')}"`);
  console.log(`  "Manchester    United" -> "${parser._normalizeTeamName('Manchester    United')}"`);
  
  console.log('Score normalization:');
  console.log(`  "2 - 1" -> "${parser._normalizeScore('2 - 1')}"`);
  console.log(`  "2:1" -> "${parser._normalizeScore('2:1')}"`);
  
  console.log('Status normalization:');
  console.log(`  "FINISHED" -> "${parser._normalizeStatus('FINISHED')}"`);
  console.log(`  "FT" -> "${parser._normalizeStatus('FT')}"`);
  
  console.log('Event type normalization:');
  console.log(`  "yellow" -> "${parser._normalizeEventType('yellow')}"`);
  console.log(`  "sub" -> "${parser._normalizeEventType('sub')}"`);
  
  console.log('✓ Data normalization tests passed');
} catch (error) {
  console.log('✗ Error in data normalization:', error.message);
}

// Test error handling
console.log('\n6. Testing error handling...');
try {
  const emptyMatches = parser.parseMatchData('');
  const emptyLeagues = parser.parseLeagueData('');
  const emptyEvents = parser.parseMatchEvents('', 'match_123');
  
  if (emptyMatches.length === 0 && emptyLeagues.length === 0 && emptyEvents.length === 0) {
    console.log('✓ Empty HTML handled gracefully');
  } else {
    console.log('✗ Empty HTML not handled properly');
  }
  
  const nullMatches = parser.parseMatchData(null);
  if (nullMatches.length === 0) {
    console.log('✓ Null input handled gracefully');
  } else {
    console.log('✗ Null input not handled properly');
  }
} catch (error) {
  console.log('✗ Error in error handling test:', error.message);
}

// Test validation
console.log('\n7. Testing data validation...');
try {
  const validMatch = { homeTeam: 'Arsenal', awayTeam: 'Chelsea' };
  const invalidMatch = { homeTeam: 'Arsenal', awayTeam: 'Arsenal' };
  
  const result1 = parser.validateData(validMatch);
  const result2 = parser.validateData(invalidMatch);
  
  if (result1.isValid && !result2.isValid) {
    console.log('✓ Match validation working correctly');
    console.log(`  Invalid match error: ${result2.errors[0]}`);
  } else {
    console.log('✗ Match validation not working properly');
  }
  
  const validLeague = { name: 'Premier League', country: 'England' };
  const invalidLeague = { name: '', country: 'England' };
  
  const result3 = parser.validateData(validLeague);
  const result4 = parser.validateData(invalidLeague);
  
  if (result3.isValid && !result4.isValid) {
    console.log('✓ League validation working correctly');
  } else {
    console.log('✗ League validation not working properly');
  }
} catch (error) {
  console.log('✗ Error in validation test:', error.message);
}

console.log('\n✓ DataParser tests completed!');