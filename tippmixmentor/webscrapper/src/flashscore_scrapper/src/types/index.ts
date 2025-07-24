// Type definitions for the Flashscore scraper

export interface ScrapingOptions {
  country: string | null;
  league: string | null;
  headless: boolean | 'shell';
  fileType: 'json' | 'csv' | null;
}

export interface Country {
  id: string;
  name: string;
  url: string;
}

export interface League {
  id: string;
  name: string;
  url: string;
}

export interface Season {
  id: string;
  name: string;
  url: string;
}

export interface Team {
  name: string;
  image?: string;
}

export interface MatchResult {
  home: string;
  away: string;
  regulationTime?: string;
  penalties?: string;
}

export interface MatchInformation {
  category: string;
  value: string;
}

export interface MatchStatistic {
  category: string;
  homeValue: string;
  awayValue: string;
}

export interface MatchData {
  stage: string;
  date: string;
  status: string;
  home: Team;
  away: Team;
  result: MatchResult;
  information: MatchInformation[];
  statistics: MatchStatistic[];
}

export interface MatchDataCollection {
  [matchId: string]: MatchData;
}

export interface ProgressBarOptions {
  total: number;
  format?: string;
  width?: number;
}

export interface FileWriteOptions {
  data: MatchDataCollection;
  fileType: 'json' | 'csv';
  fileName: string;
  outputPath: string;
}