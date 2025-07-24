const { League, Match, MatchEvent, MatchStat } = require('../src/storage/models');

console.log('Testing League model...');
const league = new League({
  name: 'Premier League',
  country: 'England',
  season: '2023/24'
});

console.log('League validation:', league.validate());
if (league.hasErrors()) {
  console.log('League errors:', league.getErrors());
} else {
  console.log('✓ League model validation passed');
}

console.log('\nTesting Match model...');
const match = new Match({
  leagueId: league.leagueId,
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  status: 'scheduled'
});

console.log('Match validation:', match.validate());
if (match.hasErrors()) {
  console.log('Match errors:', match.getErrors());
} else {
  console.log('✓ Match model validation passed');
}

console.log('\nTesting MatchEvent model...');
const event = new MatchEvent({
  matchId: match.matchId,
  eventType: 'goal',
  minute: 45,
  playerName: 'Bukayo Saka'
});

console.log('Event validation:', event.validate());
if (event.hasErrors()) {
  console.log('Event errors:', event.getErrors());
} else {
  console.log('✓ MatchEvent model validation passed');
}

console.log('\nTesting MatchStat model...');
const stat = new MatchStat({
  matchId: match.matchId,
  statName: 'possession',
  homeValue: '65',
  awayValue: '35'
});

console.log('Stat validation:', stat.validate());
if (stat.hasErrors()) {
  console.log('Stat errors:', stat.getErrors());
} else {
  console.log('✓ MatchStat model validation passed');
}

console.log('\nTesting invalid data...');
const invalidMatch = new Match({
  homeTeam: 'Arsenal',
  awayTeam: 'Arsenal', // Same team - should fail
  status: 'invalid_status' // Invalid status
});

console.log('Invalid match validation:', invalidMatch.validate());
if (invalidMatch.hasErrors()) {
  console.log('✓ Invalid match correctly failed validation');
  console.log('Errors:', invalidMatch.getErrors().map(e => `${e.field}: ${e.message}`));
} else {
  console.log('✗ Invalid match should have failed validation');
}

console.log('\nAll model tests completed!');