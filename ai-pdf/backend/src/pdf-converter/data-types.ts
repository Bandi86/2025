/**
 * Legacy data types - maintained for backward compatibility
 * These interfaces are kept to ensure existing code continues to work
 * New code should use the interfaces from types.ts
 */

// Legacy interface for ollama - kept for backward compatibility
export interface FootballMatches {
  [key: string]: Array<FootballMatch>;
}

// Legacy interfaces - kept for backward compatibility
interface Odds {
  id: string;
  home_win_odds: number;
  draw_odds: number;
  away_win_odds: number;
}

interface Market {
  id: string;
  name: string;
  odds: Array<Odds>;
}

interface FootballMatch {
  matchid: string; //cripto id;
  home_team: string;
  away_team: string;
  date: string;
  time: string;
  country: string;
  league: string;
  round: number;
  market: Array<Market>;
  odss: Array<Odds>;
}

// Re-export new types for compatibility
export * from "./types";

// Type mapping functions to convert between legacy and new formats
export function convertLegacyToNew(
  legacy: FootballMatches
): import("./types").FootballMatchData {
  const matches: import("./types").FootballMatch[] = [];

  try {
    Object.entries(legacy || {}).forEach(([key, matchArray]) => {
      if (Array.isArray(matchArray)) {
        matchArray.forEach((match) => {
          if (match && typeof match === "object") {
            matches.push({
              matchId: match.matchid || "",
              homeTeam: match.home_team || "",
              awayTeam: match.away_team || "",
              date: match.date || "",
              time: match.time || "",
              country: match.country || "",
              league: match.league || "",
              round: match.round || 0,
              odds: (match.odss || []).map((odds) => ({
                id: odds?.id || "",
                homeWin: odds?.home_win_odds || 0,
                draw: odds?.draw_odds || 0,
                awayWin: odds?.away_win_odds || 0,
              })),
              markets: (match.market || []).map((market) => ({
                id: market?.id || "",
                name: market?.name || "",
                odds: (market?.odds || []).map((o) => o?.home_win_odds || 0), // Simplified mapping
              })),
            });
          }
        });
      }
    });
  } catch (error) {
    console.warn("Error converting legacy to new format:", error);
  }

  return {
    matches,
    totalMatches: matches.length,
  };
}

export function convertNewToLegacy(
  newData: import("./types").FootballMatchData
): FootballMatches {
  const legacy: FootballMatches = {};

  try {
    (newData?.matches || []).forEach((match, index) => {
      if (match && typeof match === "object") {
        const key = `match_${index}`;
        legacy[key] = [
          {
            matchid: match.matchId || "",
            home_team: match.homeTeam || "",
            away_team: match.awayTeam || "",
            date: match.date || "",
            time: match.time || "",
            country: match.country || "",
            league: match.league || "",
            round: match.round || 0,
            odss: (match.odds || []).map((odds) => ({
              id: odds?.id || "",
              home_win_odds: odds?.homeWin || 0,
              draw_odds: odds?.draw || 0,
              away_win_odds: odds?.awayWin || 0,
            })),
            market: (match.markets || []).map((market) => ({
              id: market?.id || "",
              name: market?.name || "",
              odds: (market?.odds || []).map((odd) => ({
                id: `${market?.id || "unknown"}_${odd || 0}`,
                home_win_odds: odd || 0,
                draw_odds: 0,
                away_win_odds: 0,
              })),
            })),
          },
        ];
      }
    });
  } catch (error) {
    console.warn("Error converting new to legacy format:", error);
  }

  return legacy;
}
