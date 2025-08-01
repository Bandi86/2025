# 🏈 Modern ESPN API Module v2.0

A comprehensive, TypeScript-based ESPN API client with intelligent rate limiting, caching, and support for multiple sports and endpoints. Built with modern JavaScript practices and designed for production use.

## 🚀 Features

- **🔄 Intelligent Rate Limiting**: Prevents API bans with configurable request limits
- **💾 Smart Caching**: Reduces API calls with TTL-based caching
- **🛡️ Robust Error Handling**: Comprehensive error management with retry logic
- **📊 Multiple Sports Support**: Soccer, Football, Basketball, Baseball, Hockey
- **🎯 Comprehensive Endpoints**: Scoreboards, standings, teams, athletes, odds, news
- **⚡ TypeScript**: Full type safety and IntelliSense support
- **🔧 Configurable**: Flexible configuration for different use cases
- **📈 Performance Optimized**: Concurrent requests and efficient data handling

## 📦 Installation

```bash
npm install
npm run build
```

## 🎯 Quick Start

```typescript
import { ESPNApiClient, LEAGUES } from './dist/index.js';

// Initialize the client
const espnClient = new ESPNApiClient({
  rateLimit: {
    requestsPerSecond: 2,
    requestsPerMinute: 100,
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
  },
});

// Get Premier League scoreboard
const scoreboard = await espnClient.getScoreboard(
  'soccer', 
  LEAGUES.SOCCER.PREMIER_LEAGUE.code
);

console.log(scoreboard.data);
```

## 🏆 Supported Leagues

### Soccer/Football
- **Premier League** (`eng.1`)
- **La Liga** (`esp.1`)
- **Serie A** (`ita.1`)
- **Bundesliga** (`ger.1`)
- **Ligue 1** (`fra.1`)
- **UEFA Champions League** (`uefa.champions`)
- **UEFA Europa League** (`uefa.europa`)
- **Major League Soccer** (`usa.1`)

### American Football
- **NFL** (`nfl`)
- **NCAA Football** (`college-football`)

### Basketball
- **NBA** (`nba`)
- **NCAA Basketball** (`mens-college-basketball`)
- **WNBA** (`wnba`)

### Baseball
- **MLB** (`mlb`)
- **NCAA Baseball** (`mens-college-baseball`)

### Hockey
- **NHL** (`nhl`)

## 🔧 API Methods

### Site API (Basic Data)
```typescript
// Scoreboards and live data
await espnClient.getScoreboard(sport, league)
await espnClient.getStandings(sport, league)
await espnClient.getTeams(sport, league)
await espnClient.getTeam(sport, teamId)
await espnClient.getAthlete(sport, athleteId)
await espnClient.getNews(sport)
await espnClient.getArticles(sport)
```

### Core API (Detailed Data)
```typescript
// Events and competitions
await espnClient.getEvents(sport, league)
await espnClient.getEvent(sport, league, eventId)

// Team and athlete details
await espnClient.getTeamRoster(sport, league, teamId)
await espnClient.getTeamStats(sport, league, teamId)
await espnClient.getAthleteStats(sport, league, athleteId)

// Odds and betting
await espnClient.getOdds(sport, league, eventId, competitionId)
await espnClient.getOddsProvider(sport, league, eventId, competitionId, providerId)
await espnClient.getOddsHistory(sport, league, eventId, competitionId, providerId)
await espnClient.getFutures(sport, league, season)

// Predictions and analysis
await espnClient.getPredictor(sport, league, eventId, competitionId)
await espnClient.getPowerIndex(sport, league, eventId, competitionId, teamId)

// Utility data
await espnClient.getTransactions(sport, league)
await espnClient.getTalentPicks(sport, league)
await espnClient.getWeeklyTalentPicks(sport, league, season, type, week)
```

### Batch Operations
```typescript
// Multiple leagues at once
const leagues = [
  { sport: 'soccer', league: LEAGUES.SOCCER.PREMIER_LEAGUE.code },
  { sport: 'soccer', league: LEAGUES.SOCCER.LA_LIGA.code },
];
const results = await espnClient.getMultipleLeagues(leagues);

// Multiple teams at once
const teamIds = ['1', '2', '3'];
const teams = await espnClient.getMultipleTeams('soccer', 'eng.1', teamIds);
```

## ⚙️ Configuration

### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  baseUrl: 'https://site.api.espn.com',
  timeout: 30000, // 30 seconds
  retries: 3,
  rateLimit: {
    requestsPerSecond: 2,
    requestsPerMinute: 100,
  },
  userAgent: 'TippMixMentor-ESPN-API/2.0.0',
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
  },
};
```

### Custom Configuration
```typescript
const espnClient = new ESPNApiClient({
  rateLimit: {
    requestsPerSecond: 1, // More conservative
    requestsPerMinute: 50,
  },
  cache: {
    enabled: true,
    ttl: 600000, // 10 minutes
  },
  timeout: 45000, // 45 seconds
  retries: 5,
});
```

## 🎲 Cache Management

```typescript
// Get cache statistics
const stats = espnClient.getCacheStats();
console.log(`Cache size: ${stats.size} entries`);

// Clear cache
espnClient.clearCache();

// Disable cache for specific request
const data = await espnClient.getScoreboard('soccer', 'eng.1', { cache: false });
```

## 🛡️ Error Handling

The module includes comprehensive error handling:

```typescript
try {
  const data = await espnClient.getScoreboard('soccer', 'eng.1');
} catch (error) {
  if (error.status === 404) {
    console.log('Endpoint not found');
  } else if (error.status === 429) {
    console.log('Rate limit exceeded');
  } else {
    console.log('API error:', error.message);
  }
}
```

## 📊 Data Examples

### Scoreboard Response
```typescript
{
  data: {
    events: [
      {
        id: "123456",
        name: "Liverpool vs AFC Bournemouth",
        date: "2025-08-15T19:00Z",
        status: { type: { description: "Scheduled" } },
        competitions: [
          {
            competitors: [
              {
                homeAway: "home",
                team: { displayName: "Liverpool", abbreviation: "LIV" },
                score: "0"
              },
              {
                homeAway: "away", 
                team: { displayName: "AFC Bournemouth", abbreviation: "BOU" },
                score: "0"
              }
            ],
            odds: [
              {
                provider: { name: "ESPN BET" },
                details: "LIV -290",
                overUnder: 3.5
              }
            ]
          }
        ]
      }
    ]
  },
  status: 200,
  timestamp: "2025-08-01T12:00:00.000Z"
}
```

### Standings Response
```typescript
{
  data: {
    groups: [
      {
        name: "Premier League",
        standings: [
          {
            rank: 1,
            team: { displayName: "Manchester City", abbreviation: "MCI" },
            wins: 25,
            losses: 3,
            ties: 6,
            winPercentage: 0.735,
            gamesPlayed: 34
          }
        ]
      }
    ]
  }
}
```

## 🧪 Testing

Run the comprehensive example:

```bash
npm run build
node dist/example.js
```

This will test:
- ✅ Health check
- ✅ Multiple leagues
- ✅ Standings and teams
- ✅ Rate limiting
- ✅ Caching
- ✅ Error handling
- ✅ Performance

## 📈 Performance

The module is optimized for performance:

- **Concurrent Requests**: Batch operations for multiple leagues/teams
- **Smart Caching**: Reduces API calls by 80%+ in typical usage
- **Rate Limiting**: Prevents API bans while maximizing throughput
- **Retry Logic**: Automatic retry with exponential backoff
- **Memory Efficient**: Minimal memory footprint

## 🔒 Rate Limiting

The module implements intelligent rate limiting:

- **Per-second limits**: Configurable requests per second
- **Per-minute limits**: Configurable requests per minute
- **Automatic queuing**: Requests wait for available slots
- **Burst protection**: Prevents overwhelming the API

## 🚨 Important Notes

1. **Unofficial API**: This uses ESPN's undocumented API endpoints
2. **Rate Limiting**: Always use conservative rate limits to avoid bans
3. **Caching**: Enable caching to reduce API calls and improve performance
4. **Error Handling**: Always implement proper error handling
5. **Monitoring**: Monitor your usage and adjust rate limits as needed

## 🔄 Migration from v1.0

If you're upgrading from the old JavaScript version:

1. **Install dependencies**: `npm install`
2. **Update imports**: Use the new TypeScript exports
3. **Configure client**: Use the new configuration options
4. **Update error handling**: Use the new error types
5. **Test thoroughly**: Run the example to verify functionality

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the example code
- Review the error handling
- Test with different rate limits
- Monitor API responses

---

**Built with ❤️ for the TippMixMentor project** 