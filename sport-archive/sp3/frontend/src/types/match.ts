export interface Market {
  id: string;
  name: string;
  origName?: string;
  odds1?: number;
  oddsX?: number;
  odds2?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  shortName?: string;
}

export interface Competition {
  id: string;
  name: string;
  shortName?: string;
  country: string;
}

export interface Match {
  id: string;
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  competition: Competition;
  homeScore?: number;
  awayScore?: number;
  status: string;
  round?: number;
  matchday?: number;
  season: string;
  venue?: string;
  createdAt: string;
  updatedAt: string;
  markets?: Market[];
  timeZone?: string; // e.g., 'Europe/Budapest'
}

export interface MatchStatus {
  type: 'live' | 'soon' | 'finished' | 'upcoming';
  label: string;
}

export interface DateNavigation {
  prev: string;
  next: string;
  current: string;
}
