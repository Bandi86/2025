# Design Document

## Overview

This design establishes a comprehensive backend architecture for the Bet Mentor application, focusing on database schema design, API structure, and user management system. The design builds upon the existing Express.js/TypeScript foundation and extends it to support the full sports betting prediction functionality outlined in the project plan.

## Architecture

### Database Layer
- **Technology**: SQLite3 with sqlite package for Node.js
- **Schema Management**: SQL files with programmatic initialization
- **Connection Management**: Singleton pattern for database connections
- **Migration Strategy**: Version-controlled schema updates

### API Layer
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling middleware
- **CORS**: Configured for frontend integration

### Security
- **Password Storage**: bcrypt with salt rounds (12)
- **JWT Tokens**: Signed with secret key, 24-hour expiration
- **Input Validation**: Comprehensive validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries only

## Components and Interfaces

### Database Schema

#### Updated Schema Structure
```sql
-- Users table (existing, enhanced)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    league TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_date DATETIME NOT NULL,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Match statistics table
CREATE TABLE match_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    stat_name TEXT NOT NULL,
    home_value REAL,
    away_value REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id)
);

-- Predictions table
CREATE TABLE predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    model_version TEXT NOT NULL,
    predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('1', 'X', '2')),
    probability REAL NOT NULL CHECK (probability >= 0 AND probability <= 1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

### API Endpoints Design

#### User Management Endpoints
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)

#### Sports Data Endpoints
- `GET /api/teams` - List all teams with pagination
- `POST /api/teams` - Create new team (admin only)
- `GET /api/teams/:id` - Get team details
- `GET /api/matches` - List matches with filtering (date, status, team)
- `GET /api/matches/:id` - Get match details with stats and predictions
- `GET /api/matches/history` - List completed matches
- `POST /api/matches` - Create new match (admin only)
- `GET /api/stats/teams/:id` - Get team historical statistics
- `GET /api/predictions/:matchId` - Get predictions for a match

### Request/Response Models

#### User Models
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: User;
}
```

#### Sports Data Models
```typescript
interface Team {
  id: number;
  name: string;
  country: string;
  league: string;
  created_at: string;
  updated_at: string;
}

interface Match {
  id: number;
  match_date: string;
  home_team: Team;
  away_team: Team;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface MatchWithDetails extends Match {
  stats: MatchStat[];
  predictions: Prediction[];
}

interface MatchStat {
  id: number;
  stat_name: string;
  home_value?: number;
  away_value?: number;
}

interface Prediction {
  id: number;
  model_version: string;
  predicted_outcome: '1' | 'X' | '2';
  probability: number;
  created_at: string;
}
```

## Data Models

### Database Connection Management
- Singleton database connection pattern
- Connection pooling for concurrent requests
- Graceful connection handling and cleanup
- Transaction support for complex operations

### Model Layer Architecture
- Repository pattern for data access
- Service layer for business logic
- Model classes with validation
- Type-safe database operations

### Data Validation
- Zod schemas for all API inputs
- Database constraint validation
- Business rule validation in service layer
- Sanitization of user inputs

## Error Handling

### Error Response Structure
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Error Categories
- **Validation Errors (400)**: Invalid input data
- **Authentication Errors (401)**: Invalid or missing tokens
- **Authorization Errors (403)**: Insufficient permissions
- **Not Found Errors (404)**: Resource not found
- **Conflict Errors (409)**: Duplicate data
- **Server Errors (500)**: Internal server errors

### Error Handling Middleware
- Centralized error handling
- Proper error logging
- Development vs production error responses
- Error tracking and monitoring

## Testing Strategy

### Unit Testing
- Controller function testing
- Service layer testing
- Model validation testing
- Utility function testing

### Integration Testing
- API endpoint testing
- Database operation testing
- Authentication flow testing
- Error handling testing

### Test Database
- Separate test database
- Database seeding for tests
- Test data cleanup
- Isolated test environments

### Testing Tools
- Jest for test framework
- Supertest for API testing
- Test database setup/teardown
- Mock data generation

### Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for critical paths
- Integration test coverage for all endpoints
- Error path testing coverage