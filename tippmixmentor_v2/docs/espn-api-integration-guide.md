# 🏈 ESPN API Integration Guide

## 📋 Overview

This guide documents the integration of the ESPN API with the existing Football-Data.org and API-Football services in the TippMixMentor system. The integration provides comprehensive football data coverage with real-time updates, live match data, and betting odds.

## 🎯 Integration Goals

- **Combine 3 APIs**: ESPN, Football-Data.org, and API-Football
- **Real-time Data**: Live match updates every 30 seconds
- **Comprehensive Coverage**: 8 major championships
- **Betting Data**: Odds from multiple providers
- **Database Integration**: Unified data storage
- **Frontend Display**: Live data on the website

## 🏆 Supported Championships

### ESPN API Coverage
1. **Premier League** (`eng.1`) - England
2. **La Liga** (`esp.1`) - Spain  
3. **Serie A** (`ita.1`) - Italy
4. **Bundesliga** (`ger.1`) - Germany
5. **Ligue 1** (`fra.1`) - France
6. **UEFA Champions League** (`uefa.champions`) - Europe
7. **UEFA Europa League** (`uefa.europa`) - Europe
8. **Major League Soccer** (`usa.1`) - USA

### API Comparison

| Feature | ESPN | Football-Data.org | API-Football |
|---------|------|-------------------|--------------|
| **Authentication** | ❌ None required | ✅ API Key | ✅ API Key |
| **Rate Limits** | ⚠️ Conservative | ⚠️ Free tier limits | ⚠️ Free tier limits |
| **Live Data** | ✅ Real-time | ❌ Limited | ⚠️ Basic |
| **Odds Data** | ✅ Comprehensive | ❌ None | ⚠️ Limited |
| **Coverage** | ✅ 8 leagues | ✅ 5 leagues | ✅ 5 leagues |
| **Reliability** | ✅ High | ⚠️ Medium | ⚠️ Medium |

## ⚡ Update Frequencies

### Recommended Schedule
- **Live Matches**: Every 30 seconds during live games
- **Odds Data**: Every 2-5 minutes
- **Standings**: Every hour
- **Team Data**: Daily
- **League Data**: Weekly

### Implementation
```typescript
// Cron jobs in FootballDataSyncService
@Cron('*/30 * * * * *') // Every 30 seconds
async syncLiveMatches()

@Cron('0 */2 * * * *') // Every 2 minutes
async syncOddsData()

@Cron('0 0 * * * *') // Every hour
async syncStandingsData()

@Cron('0 0 0 * * *') // Daily at midnight
async syncTeamData()

@Cron('0 0 0 * * 0') // Weekly on Sunday
async syncLeagueData()
```

## 🗄️ Database Integration

### New Services Created
1. **ESPNFootballService**: ESPN API integration
2. **ESPNFootballController**: API endpoints
3. **FootballDataSyncService**: Scheduled synchronization
4. **Updated UnifiedFootballService**: Combined data from all 3 APIs

### Database Schema Updates
The existing schema supports ESPN data through:
- **Leagues table**: ESPN league codes
- **Teams table**: ESPN team data
- **Matches table**: ESPN match events
- **Standings table**: ESPN standings
- **Odds table**: ESPN betting odds

## 🔗 API Endpoints

### ESPN API Endpoints
```
GET /api/v1/espn-football/leagues
GET /api/v1/espn-football/scoreboard/:leagueCode
GET /api/v1/espn-football/standings/:leagueCode
GET /api/v1/espn-football/teams/:leagueCode
GET /api/v1/espn-football/live-matches
GET /api/v1/espn-football/odds/:eventId/:competitionId
GET /api/v1/espn-football/sync/:leagueCode
GET /api/v1/espn-football/rate-limit
GET /api/v1/espn-football/health
```

### Sync Endpoints
```
GET /api/v1/football-data-sync/status
GET /api/v1/football-data-sync/quality-report
POST /api/v1/football-data-sync/sync/:leagueCode
POST /api/v1/football-data-sync/sync-all
```

### Unified Endpoints (Updated)
```
GET /api/v1/unified-football/matches/:competition
GET /api/v1/unified-football/standings/:competition
GET /api/v1/unified-football/scorers/:competition
```

## 📊 Data Quality Strategy

### Confidence Scoring
- **ESPN**: 0.95 (real-time data, comprehensive coverage)
- **API-Football**: 0.9 (detailed data, good coverage)
- **Football-Data.org**: 0.8 (basic data, limited coverage)

### Data Merging Logic
```typescript
// Priority order for data sources
1. ESPN (highest confidence, real-time)
2. API-Football (detailed, reliable)
3. Football-Data.org (backup, basic)
```

### Quality Monitoring
- **Health Checks**: All APIs monitored
- **Rate Limit Tracking**: Usage monitoring
- **Data Validation**: Consistency checks
- **Fallback Strategy**: Multiple sources

## 🚀 Implementation Phases

### Phase 1: Basic Integration ✅
- [x] ESPN API service implementation
- [x] Database integration
- [x] Basic data synchronization
- [x] Premier League testing

### Phase 2: Live Data & WebSocket ⏳
- [ ] Live match updates
- [ ] WebSocket integration
- [ ] Real-time frontend updates
- [ ] Live dashboard

### Phase 3: Odds Integration ⏳
- [ ] Betting odds synchronization
- [ ] Odds comparison features
- [ ] Betting analysis tools
- [ ] ML model integration

### Phase 4: Advanced Features ⏳
- [ ] All 8 championships
- [ ] Historical data analysis
- [ ] Advanced prediction features
- [ ] Performance optimization

## 🔧 Configuration

### Environment Variables
```env
# ESPN API (no key required)
ESPN_API_BASE_URL=https://site.api.espn.com

# Football-Data.org API
FOOTBALL_DATA_API_KEY=your-football-data-api-key
FOOTBALL_DATA_API_BASE_URL=https://api.football-data.org/v4

# API-Football
API_FOOTBALL_KEY=your-api-football-key
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
```

### Rate Limiting
```typescript
// ESPN API (conservative limits)
requestsPerSecond: 2
requestsPerMinute: 60

// API-Football (free tier)
requestsPerMinute: 30
requestsPerMonth: 100

// Football-Data.org (free tier)
requestsPerMinute: 10
```

## 📈 Performance Optimization

### Caching Strategy
- **Redis Cache**: 5-minute TTL for most data
- **Odds Cache**: 1-minute TTL (frequent updates)
- **Standings Cache**: 1-hour TTL (stable data)
- **Team Cache**: 24-hour TTL (rarely changes)

### Database Optimization
- **Indexes**: On league codes, team IDs, match dates
- **Batch Operations**: Bulk inserts/updates
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Efficient data retrieval

## 🛡️ Error Handling

### API Failures
```typescript
// Graceful degradation
1. Try ESPN API first (highest priority)
2. Fallback to API-Football
3. Fallback to Football-Data.org
4. Return cached data if available
5. Return error with details
```

### Rate Limiting
- **Automatic Retry**: Exponential backoff
- **Queue Management**: Request queuing
- **Load Balancing**: Distribute requests
- **Monitoring**: Track usage patterns

## 🧪 Testing

### API Health Checks
```bash
# Test ESPN API
curl http://localhost:3001/api/v1/espn-football/health

# Test sync status
curl http://localhost:3001/api/v1/football-data-sync/status

# Test data quality
curl http://localhost:3001/api/v1/football-data-sync/quality-report
```

### Manual Sync Testing
```bash
# Sync Premier League
curl -X POST http://localhost:3001/api/v1/football-data-sync/sync/PL

# Sync all leagues
curl -X POST http://localhost:3001/api/v1/football-data-sync/sync-all
```

## 📱 Frontend Integration

### Live Data Display
```typescript
// Real-time match updates
const liveMatches = await fetch('/api/v1/espn-football/live-matches');

// Live standings
const standings = await fetch('/api/v1/unified-football/standings/PL');

// Live odds
const odds = await fetch('/api/v1/espn-football/odds/eventId/competitionId');
```

### WebSocket Integration
```typescript
// Live updates via WebSocket
const ws = new WebSocket('ws://localhost:3001/ws/football-data');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI with live data
};
```

## 🔍 Monitoring & Analytics

### Metrics to Track
- **API Response Times**: Performance monitoring
- **Success Rates**: Reliability tracking
- **Data Quality**: Accuracy metrics
- **Rate Limit Usage**: API quota monitoring
- **Cache Hit Rates**: Performance optimization

### Logging
```typescript
// Structured logging
logger.log('ESPN API sync completed', {
  league: 'PL',
  matches: 10,
  duration: '2.5s',
  success: true
});
```

## 🚨 Troubleshooting

### Common Issues
1. **Rate Limit Exceeded**: Reduce request frequency
2. **API Timeout**: Increase timeout values
3. **Data Inconsistency**: Check data validation
4. **Cache Issues**: Clear Redis cache
5. **Database Errors**: Check connection pool

### Debug Commands
```bash
# Check API health
docker-compose logs backend | grep "ESPN"

# Monitor sync jobs
docker-compose logs backend | grep "sync"

# Check Redis cache
docker-compose exec redis redis-cli KEYS "*espn*"
```

## 📚 Resources

### Documentation
- [ESPN API Analysis](./api/espn-api-test/FOOTBALL_DATA_ANALYSIS.md)
- [ESPN API Module](./api/espn-api-test/README.md)
- [Backend Documentation](./docs/backend.md)
- [Frontend Documentation](./docs/frontend.md)

### API References
- [ESPN API](https://site.api.espn.com/apis/site/v2/sports/soccer)
- [Football-Data.org API](https://www.football-data.org/documentation)
- [API-Football](https://www.api-football.com/documentation)

## 🎯 Next Steps

1. **Test Integration**: Verify all APIs work together
2. **Frontend Updates**: Add live data display
3. **WebSocket Setup**: Real-time updates
4. **Performance Tuning**: Optimize for production
5. **Monitoring**: Set up alerts and dashboards

---

**Status**: ✅ Phase 1 Complete - Basic Integration  
**Next Phase**: ⏳ Phase 2 - Live Data & WebSocket Integration 