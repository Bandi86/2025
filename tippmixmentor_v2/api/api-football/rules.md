## DOCS: https://www.api-football.com/documentation-v3

## API KEY: .env available

# RULES
CARE of rate limits by min and month

## Rate Limits
- **Free Plan**: 30 requests per minute, 100 requests per month
- **Paid Plans**: Higher limits available

## Implementation Status
✅ **COMPLETED** - Full integration with smart rate limiting and data merging

### Features Implemented
- ✅ Rate limiting with Redis tracking
- ✅ Smart caching (5-minute TTL)
- ✅ Data merging with Football-Data.org
- ✅ Database synchronization
- ✅ Frontend dashboard integration
- ✅ Real-time monitoring
- ✅ Error handling and fallbacks

### API Endpoints Available
- `/api-football/leagues` - Get available leagues
- `/api-football/teams` - Get teams for league
- `/api-football/matches` - Get matches (including live)
- `/api-football/standings` - Get league standings
- `/api-football/scorers` - Get top scorers
- `/api-football/sync/:leagueId/:season` - Sync data to database
- `/api-football/rate-limit` - Check rate limit status
- `/api-football/status` - Service health check

### Unified Endpoints
- `/unified-football/matches` - Merged match data
- `/unified-football/standings` - Merged standings
- `/unified-football/scorers` - Merged scorers
- `/unified-football/quality-report` - Data quality metrics

### League Mappings
- Premier League: ID 39
- Champions League: ID 2
- Bundesliga: ID 78
- Serie A: ID 135
- La Liga: ID 140
- Ligue 1: ID 61

## Usage Examples
```bash
# Get Premier League matches
curl "http://localhost:3001/api-football/matches?league=39&season=2024"

# Check rate limit status
curl "http://localhost:3001/api-football/rate-limit"

# Sync data to database
curl -X POST "http://localhost:3001/api-football/sync/39/2024"
```

## Documentation
See `docs/api-football-integration.md` for comprehensive documentation.