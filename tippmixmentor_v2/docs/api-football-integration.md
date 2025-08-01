# API-Football Integration Documentation

## Overview

The API-Football integration provides comprehensive football data from the API-Football service (https://www.api-football.com/). This integration includes smart rate limiting, caching, and data merging capabilities to work alongside the existing Football-Data.org integration.

## Features

### 🔥 **Key Features**
- **Multi-Source Data**: Combines data from both Football-Data.org and API-Football
- **Smart Rate Limiting**: Respects API limits (30 requests/minute, 100 requests/month)
- **Intelligent Caching**: Redis-based caching with 5-minute TTL
- **Data Merging**: Smart deduplication and confidence-based data selection
- **Database Integration**: Automatic data synchronization to PostgreSQL
- **Real-time Monitoring**: Rate limit status and service health monitoring

### 📊 **Data Coverage**
- **Leagues**: 6 major European leagues (Premier League, Champions League, Bundesliga, Serie A, La Liga, Ligue 1)
- **Matches**: Live and historical match data with detailed statistics
- **Standings**: Current league tables with team performance metrics
- **Scorers**: Top scorers and assist leaders with detailed player statistics
- **Teams**: Team information including venues and historical data

## Architecture

### Service Structure
```
backend/src/modules/football-data/
├── api-football.service.ts      # API-Football service with rate limiting
├── api-football.controller.ts   # REST API endpoints
├── unified-football.service.ts  # Data merging and unification
├── unified-football.controller.ts # Unified API endpoints
└── football-data.module.ts      # Module configuration
```

### Data Flow
```
API-Football API → Rate Limiting → Caching → Data Processing → Database → Frontend
     ↓
Football-Data.org API → Data Merging → Unified Response
```

## Configuration

### Environment Variables
```bash
# API-Football Configuration
API_FOOTBALL_KEY=your-api-football-key
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
```

### Rate Limiting Configuration
```typescript
private readonly rateLimitPerMinute = 30;
private readonly rateLimitPerMonth = 100;
private readonly cacheTtl = 300; // 5 minutes
```

## API Endpoints

### API-Football Direct Endpoints

#### Get Available Leagues
```http
GET /api-football/leagues?country=England&season=2024
```

#### Get Teams for League
```http
GET /api-football/teams?league=39&season=2024
```

#### Get Matches
```http
GET /api-football/matches?league=39&season=2024&round=Regular Season - 1
```

#### Get Live Matches
```http
GET /api-football/matches/live
```

#### Get Standings
```http
GET /api-football/standings?league=39&season=2024
```

#### Get Top Scorers
```http
GET /api-football/scorers?league=39&season=2024
```

#### Sync League Data to Database
```http
POST /api-football/sync/39/2024
```

#### Get Rate Limit Status
```http
GET /api-football/rate-limit
```

#### Get Service Status
```http
GET /api-football/status
```

### Unified Football Data Endpoints

#### Get Unified Matches
```http
GET /unified-football/matches?competition=PL&limit=20
```

#### Get Unified Standings
```http
GET /unified-football/standings?competition=PL
```

#### Get Unified Scorers
```http
GET /unified-football/scorers?competition=PL&limit=10
```

#### Get Data Quality Report
```http
GET /unified-football/quality-report
```

#### Get Unified Service Status
```http
GET /unified-football/status
```

## Data Models

### API-Football Match
```typescript
interface ApiFootballMatch {
  fixture: {
    id: number;
    referee: string;
    date: string;
    status: { long: string; short: string; elapsed: number };
    venue: { id: number; name: string; city: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean };
    away: { id: number; name: string; logo: string; winner: boolean };
  };
  goals: { home: number; away: number };
  score: {
    halftime: { home: number; away: number };
    fulltime: { home: number; away: number };
  };
}
```

### Unified Match
```typescript
interface UnifiedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  date: string;
  league: string;
  source: 'football-data' | 'api-football' | 'merged';
  confidence: number;
}
```

## Rate Limiting Strategy

### Implementation
- **Redis-based tracking**: Uses Redis to track request counts
- **Minute-level limits**: Tracks requests per minute with automatic reset
- **Month-level limits**: Tracks monthly usage with calendar month boundaries
- **Graceful degradation**: Returns cached data when limits are exceeded

### Rate Limit Headers
```typescript
{
  minuteRemaining: 25,
  monthRemaining: 85,
  minuteReset: 1640995200000,
  monthReset: 1643673600000
}
```

## Caching Strategy

### Cache Keys
```typescript
// League data
`api_football:leagues:${country}:${season}`

// Team data
`api_football:teams:${league}:${season}`

// Match data
`api_football:matches:${league}:${season}:${round}`

// Standings
`api_football:standings:${league}:${season}`

// Rate limiting
`api_football:rate_limit:minute:${timestamp}`
`api_football:rate_limit:month:${year}-${month}`
```

### Cache TTL
- **Data cache**: 5 minutes (300 seconds)
- **Rate limit cache**: 60 seconds for minute limits, 30 days for month limits

## Data Merging Logic

### Match Merging
```typescript
// Key generation for deduplication
const key = `${match.homeTeam}_${match.awayTeam}_${match.date.split('T')[0]}`;

// Confidence-based selection
if (match.confidence > existing.confidence) {
  // Replace with higher confidence data
}
```

### Confidence Scoring
- **API-Football**: 0.9 (higher confidence due to comprehensive data)
- **Football-Data.org**: 0.8 (good quality but less comprehensive)
- **Merged data**: Maximum of source confidences

## Database Integration

### Automatic Sync
```typescript
async syncLeagueData(leagueId: number, season: number): Promise<void> {
  // 1. Get league information
  // 2. Create/update league record
  // 3. Sync teams
  // 4. Sync matches
  // 5. Sync standings
}
```

### Database Tables
- **leagues**: League information and metadata
- **teams**: Team details and relationships
- **matches**: Match data with scores and status
- **standings**: Current league positions

## Frontend Integration

### Enhanced Dashboard
The frontend includes an enhanced dashboard that can:
- Switch between data sources (Unified, Football-Data.org, API-Football)
- Display data source indicators
- Show rate limit status
- Monitor data quality
- Compare data from different sources

### API Routes
```typescript
// Frontend API routes
/api/api-football/leagues
/api/api-football/matches
/api/api-football/standings
/api/api-football/status
/api/unified-football/matches
/api/unified-football/standings
/api/unified-football/status
```

## Error Handling

### Rate Limit Errors
```typescript
throw new HttpException(
  'Rate limit exceeded: too many requests per minute',
  HttpStatus.TOO_MANY_REQUESTS,
);
```

### API Errors
```typescript
catch (error) {
  this.logger.error(`Error making request to API-Football: ${error.message}`);
  throw new HttpException(
    `Failed to fetch API-Football data: ${error.message}`,
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
```

## Monitoring and Health Checks

### Health Check Endpoints
- `/api-football/status` - Service status with rate limit info
- `/unified-football/status` - Unified service status with quality report
- `/api-football/rate-limit` - Current rate limit status

### Quality Metrics
- Data source availability
- Response times
- Cache hit rates
- Error rates
- Rate limit utilization

## Usage Examples

### Basic Usage
```typescript
// Get Premier League matches
const matches = await apiFootballService.getMatches(39, 2024);

// Get live matches
const liveMatches = await apiFootballService.getLiveMatches();

// Sync data to database
await apiFootballService.syncLeagueData(39, 2024);
```

### Frontend Usage
```typescript
// Fetch unified matches
const response = await fetch('/api/unified-football/matches?competition=PL');
const data = await response.json();

// Check rate limit status
const status = await fetch('/api/api-football/rate-limit');
const rateLimit = await status.json();
```

## Best Practices

### Rate Limit Management
1. **Monitor usage**: Regularly check rate limit status
2. **Cache aggressively**: Use cached data when possible
3. **Batch requests**: Group related requests together
4. **Plan ahead**: Schedule data syncs during off-peak hours

### Data Quality
1. **Validate responses**: Check data integrity
2. **Handle missing data**: Provide fallbacks for incomplete data
3. **Monitor confidence**: Track data quality metrics
4. **Regular syncs**: Keep database updated with fresh data

### Error Handling
1. **Graceful degradation**: Return cached data on API failures
2. **Retry logic**: Implement exponential backoff for transient errors
3. **Logging**: Comprehensive error logging for debugging
4. **User feedback**: Inform users of data source issues

## Troubleshooting

### Common Issues

#### Rate Limit Exceeded
```bash
# Check current usage
curl /api/api-football/rate-limit

# Wait for reset or use cached data
```

#### API Key Issues
```bash
# Verify API key in environment
echo $API_FOOTBALL_KEY

# Check API key validity
curl -H "x-rapidapi-key: YOUR_KEY" /api-football/status
```

#### Data Sync Issues
```bash
# Check database connection
# Verify league IDs
# Check API responses
```

### Debug Commands
```bash
# Check service status
curl /api/api-football/status

# Check unified service
curl /api/unified-football/status

# Test rate limiting
curl /api/api-football/rate-limit

# Sync specific league
curl -X POST /api/api-football/sync/39/2024
```

## Future Enhancements

### Planned Features
- **WebSocket integration**: Real-time match updates
- **Advanced analytics**: Statistical analysis and insights
- **Historical data**: Extended historical data access
- **Player statistics**: Detailed player performance data
- **Prediction integration**: ML model integration with live data

### Performance Optimizations
- **Background sync**: Automated data synchronization
- **Smart caching**: Adaptive cache TTL based on data volatility
- **Load balancing**: Multiple API key support
- **CDN integration**: Global data distribution

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at https://www.api-football.com/documentation-v3
3. Monitor application logs
4. Check rate limit status
5. Verify environment configuration 