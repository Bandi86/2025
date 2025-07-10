import {
  Competition,
  Team,
  Match,
  MatchStatus,
  DataSource,
  CompetitionType,
} from '@prisma/client';

// ========================================
// BASIC TYPES
// ========================================

export type MatchWithTeams = Match & {
  homeTeam: Team;
  awayTeam: Team;
  competition: Competition;
};

export type TeamWithMatches = Team & {
  homeMatches: Match[];
  awayMatches: Match[];
};

export type CompetitionWithMatches = Competition & {
  matches: Match[];
  teams: { team: Team }[];
};

// ========================================
// DTOs - DATA TRANSFER OBJECTS
// ========================================

export interface CreateMatchDto {
  date: string; // ISO date string
  homeTeamId: string;
  awayTeamId: string;
  competitionId: string;
  round?: number;
  matchday?: number;
  season: string;
  venue?: string;

  // Eredmények (opcionális)
  homeScore?: number;
  awayScore?: number;
  status?: MatchStatus;

  // Metadata
  sourceType?: DataSource;
  sourcePath?: string;
  extractionConfidence?: number;
  notes?: string;
}

export interface UpdateMatchDto {
  date?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  competitionId?: string;
  round?: number;
  matchday?: number;
  season?: string;
  venue?: string;

  homeScore?: number;
  awayScore?: number;
  status?: MatchStatus;

  statistics?: any; // JSON object
  prediction?: any; // JSON object
  confidence?: number;

  sourceType?: DataSource;
  sourcePath?: string;
  extractionConfidence?: number;
  manualVerified?: boolean;
  notes?: string;
}

export interface CreateTeamDto {
  name: string;
  fullName?: string;
  shortName?: string;
  alternativeNames?: string[]; // Will be stored as JSON
  city?: string;
  country: string;
  founded?: number;
  stadium?: string;
}

export interface UpdateTeamDto {
  name?: string;
  shortName?: string;
  alternativeNames?: string[];
  city?: string;
  country?: string;
  founded?: number;
  stadium?: string;
  isActive?: boolean;
}

export interface CreateCompetitionDto {
  name: string;
  shortName?: string;
  country: string;
  type?: CompetitionType;
  tier?: number;
  season: string;
}

export interface UpdateCompetitionDto {
  name?: string;
  shortName?: string;
  country?: string;
  type?: CompetitionType;
  tier?: number;
  season?: string;
  isActive?: boolean;
}

// ========================================
// QUERY FILTERS
// ========================================

export interface MatchFilters {
  competitionId?: string;
  teamId?: string; // Matches where this team plays (home or away)
  season?: string;
  status?: MatchStatus;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  date?: string; // Single date filter (YYYY-MM-DD)
  round?: number;
  matchday?: number;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: 'date' | 'createdAt' | 'homeTeam' | 'awayTeam';
  sortOrder?: 'asc' | 'desc';
}

export interface TeamFilters {
  competitionId?: string;
  country?: string;
  season?: string;
  isActive?: boolean;
  search?: string; // Search by name

  page?: number;
  limit?: number;
  sortBy?: 'name' | 'country' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CompetitionFilters {
  country?: string;
  type?: CompetitionType;
  season?: string;
  tier?: number;
  isActive?: boolean;

  page?: number;
  limit?: number;
  sortBy?: 'name' | 'country' | 'tier' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// RESPONSE TYPES
// ========================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MatchResponse {
  id: string;
  date: string;
  homeTeam: {
    id: string;
    name: string;
    shortName?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName?: string;
  };
  competition: {
    id: string;
    name: string;
    shortName?: string;
    country: string;
  };
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  round?: number;
  matchday?: number;
  season: string;
  venue?: string;
  prediction?: any;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
  markets?: Array<{
    id: string;
    name: string;
    origName?: string;
    odds1?: number;
    oddsX?: number;
    odds2?: number;
    createdAt: string;
    updatedAt: string;
  }>;
  timeZone?: string;
}

export interface TeamResponse {
  id: string;
  name: string;
  shortName?: string;
  alternativeNames?: string[];
  city?: string;
  country: string;
  founded?: number;
  stadium?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  competitions?: Array<{
    id: string;
    name: string;
    season: string;
    isActive: boolean;
  }>;
  matchesCount?: {
    home: number;
    away: number;
    total: number;
  };
}

export interface CompetitionResponse {
  id: string;
  name: string;
  shortName?: string;
  country: string;
  type: CompetitionType;
  tier: number;
  season: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    matchesCount: number;
    teamsCount: number;
  };
}

// ========================================
// PDF EXTRACTION TYPES
// ========================================

export interface PdfMatchData {
  date: string;
  time?: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  round?: number;
  matchday?: number;
  season: string;
  venue?: string;
  sport?: string;

  // Eredmények ha van
  homeScore?: number;
  awayScore?: number;
  status?: 'SCHEDULED' | 'FINISHED';

  // Betting markets (new structure)
  markets?: BettingMarket[];

  // Metadata
  extractionConfidence: number;
  sourcePath: string;
}

export interface BulkCreateMatchesDto {
  matches: PdfMatchData[];
  competitionMapping?: { [key: string]: string }; // Competition name -> Competition ID
  teamMapping?: { [key: string]: string }; // Team name -> Team ID
  autoCreateMissingTeams?: boolean;
  autoCreateMissingCompetitions?: boolean;
  defaultSeason?: string;
}

// ========================================
// BETTING MARKET TYPES
// ========================================

export interface BettingMarket {
  market_type: string; // "1X2", "Both Teams To Score", "Over/Under", etc.
  odds: { [key: string]: number }; // {"home": 1.83, "draw": 3.95, "away": 2.87}
  market_line?: string; // "2.5" for over/under, "+1" for handicap
}

// ========================================
