// ESPN API Types and Interfaces
export interface ESPNApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  userAgent: string;
  cache: {
    enabled: boolean;
    ttl: number;
  };
}

export interface ESPNApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  timestamp: Date;
}

export interface ESPNApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: Date;
}

// League Types
export interface League {
  id: string;
  name: string;
  code: string;
  sport: string;
  season?: number;
  type?: number;
}

export interface LeagueStandings {
  league: League;
  season: number;
  type: number;
  groups: StandingGroup[];
}

export interface StandingGroup {
  id: string;
  name: string;
  standings: TeamStanding[];
}

export interface TeamStanding {
  team: Team;
  rank: number;
  wins: number;
  losses: number;
  ties?: number;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
  winPercentage: number;
  gamesBack: number;
  streak: string;
  lastFive: string[];
}

// Team Types
export interface Team {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  location: string;
  nickname: string;
  color: string;
  alternateColor?: string;
  logo: string;
  record?: TeamRecord;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties?: number;
  winPercentage: number;
  gamesPlayed: number;
}

// Event/Match Types
export interface Event {
  id: string;
  name: string;
  shortName: string;
  season: Season;
  competitions: Competition[];
  date: string;
  status: EventStatus;
  links: Link[];
}

export interface Season {
  year: number;
  startDate: string;
  endDate: string;
  displayName: string;
  types: SeasonType[];
}

export interface SeasonType {
  id: number;
  name: string;
  abbreviation: string;
  startDate: string;
  endDate: string;
  hasStandings: boolean;
}

export interface Competition {
  id: string;
  date: string;
  status: CompetitionStatus;
  competitors: Competitor[];
  venue?: Venue;
  odds?: Odds[];
  broadcasts?: Broadcast[];
  officials?: Official[];
  notes?: Note[];
}

export interface EventStatus {
  type: StatusType;
  name: string;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface StatusType {
  id: string;
  name: string;
  state: string;
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface Competitor {
  id: string;
  type: string;
  homeAway: 'home' | 'away';
  team: Team;
  score?: string;
  linescores?: LineScore[];
  statistics?: Statistic[];
  records?: Record[];
  leaders?: Leader[];
  probablePitcher?: Athlete;
  currentPitcher?: Athlete;
  note?: Note;
  errors?: number;
  leftOnBase?: number;
  battingOrder?: number[];
  seasonStats?: SeasonStats;
  gameStats?: GameStats;
  status?: AthleteStatus;
  parentTeamId?: string;
  starter?: boolean;
  eligiblePositions?: string[];
}

export interface LineScore {
  value: number;
  displayValue: string;
}

export interface Statistic {
  name: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  abbreviation: string;
  type: string;
  value: number;
  displayValue: string;
}

export interface Record {
  name: string;
  abbreviation: string;
  type: string;
  summary: string;
}

export interface Leader {
  name: string;
  leaders: LeaderEntry[];
}

export interface LeaderEntry {
  athlete: Athlete;
  value: number;
  displayValue: string;
}

export interface Athlete {
  id: string;
  uid: string;
  guid: string;
  type: string;
  firstName: string;
  lastName: string;
  displayName: string;
  shortName: string;
  weight: number;
  displayWeight: string;
  height: number;
  displayHeight: string;
  age: number;
  jersey: string;
  position: Position;
  college?: College;
  status?: AthleteStatus;
  team?: Team;
  statistics?: Statistic[];
  events?: Event[];
  leagues?: League[];
  notes?: Note[];
  contracts?: Contract[];
  experience?: Experience;
  highSchool?: HighSchool;
  birthPlace?: BirthPlace;
  salary?: Salary;
  lastModified?: string;
}

export interface Position {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  leaf: boolean;
  parent?: Position;
}

export interface AthleteStatus {
  id: string;
  name: string;
  type: string;
  state: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
}

export interface HighSchool {
  id: string;
  name: string;
  location: string;
}

export interface BirthPlace {
  city: string;
  country: string;
  state?: string;
}

export interface Salary {
  value: number;
  currency: string;
}

export interface Contract {
  id: string;
  type: string;
  year: number;
  value: number;
  currency: string;
}

export interface Experience {
  years: number;
  displayValue: string;
}

export interface Venue {
  id: string;
  fullName: string;
  address: Address;
  capacity: number;
  indoor: boolean;
}

export interface Address {
  city: string;
  state: string;
  country: string;
  zipCode?: string;
}

export interface Odds {
  provider: Provider;
  details: string;
  overUnder?: number;
  spread?: number;
  awayOdds?: number;
  homeOdds?: number;
  drawOdds?: number;
  moneyLine?: number;
  pointSpread?: number;
  total?: number;
  overOdds?: number;
  underOdds?: number;
}

export interface Provider {
  id: string;
  name: string;
  priority: number;
}

export interface Broadcast {
  market: string;
  names: string[];
  type: string;
  language: string;
  region: string;
}

export interface Official {
  position: string;
  firstName: string;
  lastName: string;
  title?: string;
}

export interface Note {
  type: string;
  headline: string;
  text: string;
}

export interface Link {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText?: string;
  isExternal: boolean;
  isPremium: boolean;
}

export interface CompetitionStatus {
  type: StatusType;
  name: string;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface SeasonStats {
  splits: Split[];
}

export interface GameStats {
  splits: Split[];
}

export interface Split {
  stat: Statistic;
  value: number;
  displayValue: string;
}

// Scoreboard Types
export interface Scoreboard {
  leagues: League[];
  season: Season;
  day: Day;
  events: Event[];
}

export interface Day {
  date: string;
  events: Event[];
}

// Odds Types
export interface OddsResponse {
  events: Event[];
  leagues: League[];
  season: Season;
}

export interface OddsHistory {
  provider: Provider;
  history: OddsHistoryEntry[];
}

export interface OddsHistoryEntry {
  timestamp: string;
  odds: Odds;
}

export interface Futures {
  league: League;
  season: number;
  futures: Future[];
}

export interface Future {
  id: string;
  name: string;
  description: string;
  odds: Odds[];
  lastUpdated: string;
}

// Statistics Types
export interface Statistics {
  splits: Split[];
  name: string;
  abbreviation: string;
  type: string;
  categories: StatisticCategory[];
}

export interface StatisticCategory {
  name: string;
  stats: Statistic[];
}

// News Types
export interface NewsResponse {
  articles: Article[];
  pagination: Pagination;
}

export interface Article {
  id: string;
  headline: string;
  description: string;
  type: string;
  published: string;
  lastModified: string;
  links: Link[];
  images: Image[];
  categories: Category[];
  tags: Tag[];
}

export interface Image {
  name: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  href: string;
}

export interface Category {
  id: string;
  description: string;
  type: string;
  sportId?: string;
  teamId?: string;
  athleteId?: string;
  leagueId?: string;
}

export interface Tag {
  name: string;
  type: string;
  value: string;
}

export interface Pagination {
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
}

// API Request Types
export interface ApiRequestOptions {
  params?: { [key: string]: any };
  headers?: { [key: string]: string };
  timeout?: number;
  retries?: number;
  cache?: boolean | number;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  burstLimit: number;
  windowMs: number;
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  ttl: number;
  key: string;
}

// Logger Types
export interface LogLevel {
  error: 0;
  warn: 1;
  info: 2;
  debug: 3;
}

export interface LoggerConfig {
  level: keyof LogLevel;
  format: 'json' | 'simple';
  transports: string[];
} 