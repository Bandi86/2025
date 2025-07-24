// Manual test to verify parser implementations
const DataParser = require('../src/parser/DataParser');
const APIParser = require('../src/parser/APIParser');
const DataValidator = require('../src/parser/DataValidator');

console.log('Testing DataParser...');

// Test DataParser
const dataParser = new DataParser();

const testHtml = `
<div class="event__match">
  <div class="team-home">
    <span class="team-name">Arsenal</span>
  </div>
  <div class="team-away">
    <span class="team-name">Chelsea</span>
  </div>
  <div class="score">2-1</div>
  <div class="status">finished</div>
</div>
`;

try {
  const matches = dataParser.parseMatchData(testHtml, 'https://flashscore.com/test');
  console.log('✓ DataParser.parseMatchData works:', matches.length > 0 ? 'PASS' : 'FAIL');
  if (matches.length > 0) {
    console.log('  - Match:', matches[0].homeTeam, 'vs', matches[0].awayTeam, matches[0].finalScore);
  }
} catch (error) {
  console.log('✗ DataParser.parseMatchData failed:', error.message);
}

console.log('\nTesting APIParser...');

// Test APIParser
const apiParser = new APIParser();

const testApiResponse = {
  matches: [
    {
      id: '123',
      home_team: 'Barcelona',
      away_team: 'Real Madrid',
      score: '2-1',
      status: 'finished'
    }
  ]
};

try {
  const result = apiParser.parseJSONResponse(testApiResponse, '/matches');
  console.log('✓ APIParser.parseJSONResponse works:', result.type === 'matches' ? 'PASS' : 'FAIL');
  if (result.matches && result.matches.length > 0) {
    console.log('  - Match:', result.matches[0].homeTeam, 'vs', result.matches[0].awayTeam);
  }
} catch (error) {
  console.log('✗ APIParser.parseJSONResponse failed:', error.message);
}

console.log('\nTesting DataValidator...');

// Test DataValidator
const validator = new DataValidator();

const testMatch = {
  matchId: 'match_123',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  status: 'finished',
  finalScore: '2-1'
};

try {
  const validation = validator.validateMatch(testMatch);
  console.log('✓ DataValidator.validateMatch works:', validation.isValid ? 'PASS' : 'FAIL');
  if (!validation.isValid) {
    console.log('  - Errors:', validation.errors);
  }
} catch (error) {
  console.log('✗ DataValidator.validateMatch failed:', error.message);
}

// Test duplicate detection
try {
  const validation1 = validator.validateMatch(testMatch);
  const validation2 = validator.validateMatch(testMatch); // Should detect duplicate
  
  const hasDuplicateWarning = validation2.warnings.some(w => w.includes('Duplicate'));
  console.log('✓ DataValidator duplicate detection works:', hasDuplicateWarning ? 'PASS' : 'FAIL');
} catch (error) {
  console.log('✗ DataValidator duplicate detection failed:', error.message);
}

console.log('\nAll parser implementations tested!');