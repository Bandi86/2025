/**
 * Tests for type compatibility between legacy and new interfaces
 * Ensures that refactored types maintain backward compatibility
 */

import { describe, it, expect } from "vitest";
import {
  FootballMatches,
  convertLegacyToNew,
  convertNewToLegacy,
} from "../data-types";
import { FootballMatchData, FootballMatch, MatchOdds, Market } from "../types";

describe("Type Compatibility Tests", () => {
  // Sample legacy data
  const sampleLegacyData: FootballMatches = {
    match_1: [
      {
        matchid: "test-match-1",
        home_team: "Manchester United",
        away_team: "Liverpool",
        date: "2025-01-20",
        time: "15:00",
        country: "England",
        league: "Premier League",
        round: 20,
        odss: [
          {
            id: "odds-1",
            home_win_odds: 2.1,
            draw_odds: 3.2,
            away_win_odds: 2.8,
          },
        ],
        market: [
          {
            id: "market-1",
            name: "Match Result",
            odds: [
              {
                id: "odds-1",
                home_win_odds: 2.1,
                draw_odds: 3.2,
                away_win_odds: 2.8,
              },
            ],
          },
        ],
      },
    ],
    match_2: [
      {
        matchid: "test-match-2",
        home_team: "Arsenal",
        away_team: "Chelsea",
        date: "2025-01-21",
        time: "17:30",
        country: "England",
        league: "Premier League",
        round: 20,
        odss: [
          {
            id: "odds-2",
            home_win_odds: 1.9,
            draw_odds: 3.5,
            away_win_odds: 3.1,
          },
        ],
        market: [
          {
            id: "market-2",
            name: "Both Teams to Score",
            odds: [
              {
                id: "odds-2",
                home_win_odds: 1.5,
                draw_odds: 2.5,
                away_win_odds: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  // Sample new format data
  const sampleNewData: FootballMatchData = {
    matches: [
      {
        matchId: "test-match-1",
        homeTeam: "Manchester United",
        awayTeam: "Liverpool",
        date: "2025-01-20",
        time: "15:00",
        country: "England",
        league: "Premier League",
        round: 20,
        odds: [
          {
            id: "odds-1",
            homeWin: 2.1,
            draw: 3.2,
            awayWin: 2.8,
          },
        ],
        markets: [
          {
            id: "market-1",
            name: "Match Result",
            odds: [2.1],
          },
        ],
      },
      {
        matchId: "test-match-2",
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        date: "2025-01-21",
        time: "17:30",
        country: "England",
        league: "Premier League",
        round: 20,
        odds: [
          {
            id: "odds-2",
            homeWin: 1.9,
            draw: 3.5,
            awayWin: 3.1,
          },
        ],
        markets: [
          {
            id: "market-2",
            name: "Both Teams to Score",
            odds: [1.5],
          },
        ],
      },
    ],
    totalMatches: 2,
  };

  describe("Legacy to New Format Conversion", () => {
    it("should convert legacy FootballMatches to new FootballMatchData", () => {
      const converted = convertLegacyToNew(sampleLegacyData);

      expect(converted).toBeDefined();
      expect(converted.matches).toHaveLength(2);
      expect(converted.totalMatches).toBe(2);

      // Check first match conversion
      const firstMatch = converted.matches[0];
      expect(firstMatch.matchId).toBe("test-match-1");
      expect(firstMatch.homeTeam).toBe("Manchester United");
      expect(firstMatch.awayTeam).toBe("Liverpool");
      expect(firstMatch.date).toBe("2025-01-20");
      expect(firstMatch.time).toBe("15:00");
      expect(firstMatch.country).toBe("England");
      expect(firstMatch.league).toBe("Premier League");
      expect(firstMatch.round).toBe(20);

      // Check odds conversion
      expect(firstMatch.odds).toHaveLength(1);
      expect(firstMatch.odds[0].id).toBe("odds-1");
      expect(firstMatch.odds[0].homeWin).toBe(2.1);
      expect(firstMatch.odds[0].draw).toBe(3.2);
      expect(firstMatch.odds[0].awayWin).toBe(2.8);

      // Check markets conversion
      expect(firstMatch.markets).toHaveLength(1);
      expect(firstMatch.markets[0].id).toBe("market-1");
      expect(firstMatch.markets[0].name).toBe("Match Result");
      expect(firstMatch.markets[0].odds).toHaveLength(1);
    });

    it("should handle empty legacy data", () => {
      const emptyLegacy: FootballMatches = {};
      const converted = convertLegacyToNew(emptyLegacy);

      expect(converted.matches).toHaveLength(0);
      expect(converted.totalMatches).toBe(0);
    });

    it("should handle legacy data with empty match arrays", () => {
      const legacyWithEmpty: FootballMatches = {
        match_1: [],
        match_2: [],
      };
      const converted = convertLegacyToNew(legacyWithEmpty);

      expect(converted.matches).toHaveLength(0);
      expect(converted.totalMatches).toBe(0);
    });
  });

  describe("New to Legacy Format Conversion", () => {
    it("should convert new FootballMatchData to legacy FootballMatches", () => {
      const converted = convertNewToLegacy(sampleNewData);

      expect(converted).toBeDefined();
      expect(Object.keys(converted)).toHaveLength(2);

      // Check that keys are generated correctly
      const keys = Object.keys(converted);
      expect(keys).toContain("match_0");
      expect(keys).toContain("match_1");

      // Check first match conversion
      const firstMatch = converted["match_0"][0];
      expect(firstMatch.matchid).toBe("test-match-1");
      expect(firstMatch.home_team).toBe("Manchester United");
      expect(firstMatch.away_team).toBe("Liverpool");
      expect(firstMatch.date).toBe("2025-01-20");
      expect(firstMatch.time).toBe("15:00");
      expect(firstMatch.country).toBe("England");
      expect(firstMatch.league).toBe("Premier League");
      expect(firstMatch.round).toBe(20);

      // Check odds conversion
      expect(firstMatch.odss).toHaveLength(1);
      expect(firstMatch.odss[0].id).toBe("odds-1");
      expect(firstMatch.odss[0].home_win_odds).toBe(2.1);
      expect(firstMatch.odss[0].draw_odds).toBe(3.2);
      expect(firstMatch.odss[0].away_win_odds).toBe(2.8);

      // Check markets conversion
      expect(firstMatch.market).toHaveLength(1);
      expect(firstMatch.market[0].id).toBe("market-1");
      expect(firstMatch.market[0].name).toBe("Match Result");
      expect(firstMatch.market[0].odds).toHaveLength(1);
    });

    it("should handle empty new data", () => {
      const emptyNew: FootballMatchData = {
        matches: [],
        totalMatches: 0,
      };
      const converted = convertNewToLegacy(emptyNew);

      expect(Object.keys(converted)).toHaveLength(0);
    });

    it("should handle matches with no odds or markets", () => {
      const minimalNew: FootballMatchData = {
        matches: [
          {
            matchId: "minimal-match",
            homeTeam: "Team A",
            awayTeam: "Team B",
            date: "2025-01-22",
            time: "20:00",
            country: "Test Country",
            league: "Test League",
            round: 1,
            odds: [],
            markets: [],
          },
        ],
        totalMatches: 1,
      };

      const converted = convertNewToLegacy(minimalNew);

      expect(Object.keys(converted)).toHaveLength(1);
      const match = converted["match_0"][0];
      expect(match.matchid).toBe("minimal-match");
      expect(match.odss).toHaveLength(0);
      expect(match.market).toHaveLength(0);
    });
  });

  describe("Round-trip Conversion", () => {
    it("should maintain data integrity through legacy -> new -> legacy conversion", () => {
      const convertedToNew = convertLegacyToNew(sampleLegacyData);
      const convertedBackToLegacy = convertNewToLegacy(convertedToNew);

      // Check that we have the same number of matches
      expect(Object.keys(convertedBackToLegacy)).toHaveLength(2);

      // Check that basic match data is preserved
      const originalMatch = sampleLegacyData.match_1[0];
      const roundTripMatch = convertedBackToLegacy.match_0[0];

      expect(roundTripMatch.matchid).toBe(originalMatch.matchid);
      expect(roundTripMatch.home_team).toBe(originalMatch.home_team);
      expect(roundTripMatch.away_team).toBe(originalMatch.away_team);
      expect(roundTripMatch.date).toBe(originalMatch.date);
      expect(roundTripMatch.time).toBe(originalMatch.time);
      expect(roundTripMatch.country).toBe(originalMatch.country);
      expect(roundTripMatch.league).toBe(originalMatch.league);
      expect(roundTripMatch.round).toBe(originalMatch.round);
    });

    it("should maintain data integrity through new -> legacy -> new conversion", () => {
      const convertedToLegacy = convertNewToLegacy(sampleNewData);
      const convertedBackToNew = convertLegacyToNew(convertedToLegacy);

      // Check that we have the same number of matches
      expect(convertedBackToNew.matches).toHaveLength(2);
      expect(convertedBackToNew.totalMatches).toBe(2);

      // Check that basic match data is preserved
      const originalMatch = sampleNewData.matches[0];
      const roundTripMatch = convertedBackToNew.matches[0];

      expect(roundTripMatch.matchId).toBe(originalMatch.matchId);
      expect(roundTripMatch.homeTeam).toBe(originalMatch.homeTeam);
      expect(roundTripMatch.awayTeam).toBe(originalMatch.awayTeam);
      expect(roundTripMatch.date).toBe(originalMatch.date);
      expect(roundTripMatch.time).toBe(originalMatch.time);
      expect(roundTripMatch.country).toBe(originalMatch.country);
      expect(roundTripMatch.league).toBe(originalMatch.league);
      expect(roundTripMatch.round).toBe(originalMatch.round);
    });
  });

  describe("Type Safety", () => {
    it("should ensure FootballMatch interface compatibility", () => {
      const newMatch: FootballMatch = {
        matchId: "type-test",
        homeTeam: "Type Team A",
        awayTeam: "Type Team B",
        date: "2025-01-23",
        time: "19:00",
        country: "Type Country",
        league: "Type League",
        round: 1,
        odds: [],
        markets: [],
      };

      // Should be able to use in FootballMatchData
      const matchData: FootballMatchData = {
        matches: [newMatch],
        totalMatches: 1,
      };

      expect(matchData.matches).toHaveLength(1);
      expect(matchData.totalMatches).toBe(1);
    });

    it("should ensure MatchOdds interface compatibility", () => {
      const odds: MatchOdds = {
        id: "odds-test",
        homeWin: 1.5,
        draw: 3.0,
        awayWin: 4.0,
      };

      expect(odds.id).toBe("odds-test");
      expect(odds.homeWin).toBe(1.5);
      expect(odds.draw).toBe(3.0);
      expect(odds.awayWin).toBe(4.0);
    });

    it("should ensure Market interface compatibility", () => {
      const market: Market = {
        id: "market-test",
        name: "Test Market",
        odds: [1.5, 2.0, 3.0],
      };

      expect(market.id).toBe("market-test");
      expect(market.name).toBe("Test Market");
      expect(market.odds).toHaveLength(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed legacy data gracefully", () => {
      const malformedLegacy: any = {
        match_1: [
          {
            // Missing required fields
            matchid: "malformed",
            home_team: "Team A",
            // away_team missing
            date: "2025-01-24",
          },
        ],
      };

      expect(() => convertLegacyToNew(malformedLegacy)).not.toThrow();
      const result = convertLegacyToNew(malformedLegacy);
      expect(result.matches).toHaveLength(1);
    });

    it("should handle malformed new data gracefully", () => {
      const malformedNew: any = {
        matches: [
          {
            // Missing required fields
            matchId: "malformed",
            homeTeam: "Team A",
            // awayTeam missing
            date: "2025-01-24",
          },
        ],
        totalMatches: 1,
      };

      expect(() => convertNewToLegacy(malformedNew)).not.toThrow();
      const result = convertNewToLegacy(malformedNew);
      expect(Object.keys(result)).toHaveLength(1);
    });
  });
});
