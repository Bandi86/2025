const DataValidator = require('../DataValidator');

describe('DataValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('Match Validation', () => {
    it('should validate valid match data', () => {
      const validMatch = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        matchDateTime: new Date('2024-01-15T15:00:00Z'),
        status: 'scheduled',
        leagueId: 'league_premier_league'
      };

      const result = validator.validateMatch(validMatch);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dataType).toBe('match');
    });

    it('should reject match with missing required fields', () => {
      const invalidMatch = {
        matchId: 'match_123'
        // Missing homeTeam and awayTeam
      };

      const result = validator.validateMatch(invalidMatch);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Home team is required and must be a string');
      expect(result.errors).toContain('Away team is required and must be a string');
    });

    it('should reject match with same home and away teams', () => {
      const invalidMatch = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Arsenal'
      };

      const result = validator.validateMatch(invalidMatch);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Home and away teams cannot be the same');
    });

    it('should validate score formats', () => {
      const matchWithValidScore = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        finalScore: '2-1'
      };

      const result = validator.validateMatch(matchWithValidScore);
      expect(result.warnings).not.toContain(expect.stringContaining('Invalid score format'));

      const matchWithInvalidScore = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        finalScore: 'invalid-score'
      };

      const result2 = validator.validateMatch(matchWithInvalidScore);
      expect(result2.warnings).toContain('Invalid score format: invalid-score');
    });

    it('should validate match status', () => {
      const validStatuses = ['scheduled', 'live', 'finished', 'postponed', 'cancelled', 'halftime'];
      
      validStatuses.forEach(status => {
        const match = {
          matchId: 'match_123',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          status: status
        };

        const result = validator.validateMatch(match);
        expect(result.warnings).not.toContain(expect.stringContaining('Unknown match status'));
      });

      const invalidStatusMatch = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'invalid_status'
      };

      const result = validator.validateMatch(invalidStatusMatch);
      expect(result.warnings).toContain('Unknown match status: invalid_status');
    });

    it('should validate date ranges', () => {
      const veryOldMatch = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        matchDateTime: new Date('2020-01-01T15:00:00Z')
      };

      const result = validator.validateMatch(veryOldMatch);
      expect(result.warnings).toContain('Match date is more than a year in the past');

      const veryFutureMatch = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        matchDateTime: new Date('2030-01-01T15:00:00Z')
      };

      const result2 = validator.validateMatch(veryFutureMatch);
      expect(result2.warnings).toContain('Match date is more than a year in the future');
    });

    it('should detect duplicate matches', () => {
      const match = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea'
      };

      // First validation should pass
      const result1 = validator.validateMatch(match);
      expect(result1.warnings).not.toContain(expect.stringContaining('Duplicate match'));

      // Second validation should detect duplicate
      const result2 = validator.validateMatch(match);
      expect(result2.warnings).toContain('Duplicate match detected: match_123');
    });

    it('should validate team name lengths', () => {
      const longNameMatch = {
        matchId: 'match_123',
        homeTeam: 'A'.repeat(300), // Exceeds 255 character limit
        awayTeam: 'Chelsea'
      };

      const result = validator.validateMatch(longNameMatch);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Home team name exceeds maximum length (255 characters)');
    });
  });

  describe('League Validation', () => {
    it('should validate valid league data', () => {
      const validLeague = {
        leagueId: 'league_premier_league',
        name: 'Premier League',
        country: 'England',
        season: '2023/24'
      };

      const result = validator.validateLeague(validLeague);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dataType).toBe('league');
    });

    it('should reject league with missing required fields', () => {
      const invalidLeague = {
        leagueId: 'league_123'
        // Missing name and country
      };

      const result = validator.validateLeague(invalidLeague);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('League name is required and must be a string');
      expect(result.errors).toContain('League country is required and must be a string');
    });

    it('should validate season formats', () => {
      const validSeasons = ['2023/24', '2023-24', '2023'];
      
      validSeasons.forEach(season => {
        const league = {
          leagueId: 'league_123',
          name: 'Test League',
          country: 'England',
          season: season
        };

        const result = validator.validateLeague(league);
        expect(result.warnings).not.toContain(expect.stringContaining('Unusual season format'));
      });

      const invalidSeasonLeague = {
        leagueId: 'league_123',
        name: 'Test League',
        country: 'England',
        season: 'invalid-season'
      };

      const result = validator.validateLeague(invalidSeasonLeague);
      expect(result.warnings).toContain('Unusual season format: invalid-season');
    });

    it('should validate field lengths', () => {
      const longFieldsLeague = {
        leagueId: 'league_123',
        name: 'A'.repeat(300), // Exceeds 255 character limit
        country: 'B'.repeat(150), // Exceeds 100 character limit
        season: 'C'.repeat(60) // Exceeds 50 character limit
      };

      const result = validator.validateLeague(longFieldsLeague);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('League name exceeds maximum length (255 characters)');
      expect(result.errors).toContain('Country name exceeds maximum length (100 characters)');
      expect(result.errors).toContain('Season exceeds maximum length (50 characters)');
    });

    it('should detect duplicate leagues', () => {
      const league = {
        leagueId: 'league_123',
        name: 'Premier League',
        country: 'England'
      };

      // First validation should pass
      const result1 = validator.validateLeague(league);
      expect(result1.warnings).not.toContain(expect.stringContaining('Duplicate league'));

      // Second validation should detect duplicate
      const result2 = validator.validateLeague(league);
      expect(result2.warnings).toContain('Duplicate league detected: league_123');
    });
  });

  describe('Event Validation', () => {
    it('should validate valid event data', () => {
      const validEvent = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'goal',
        minute: 45,
        playerName: 'Bukayo Saka',
        description: 'Right foot shot from the centre of the box'
      };

      const result = validator.validateEvent(validEvent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dataType).toBe('event');
    });

    it('should reject event with missing required fields', () => {
      const invalidEvent = {
        eventId: 'event_123'
        // Missing matchId and eventType
      };

      const result = validator.validateEvent(invalidEvent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Match ID is required and must be a string');
      expect(result.errors).toContain('Event type is required and must be a string');
    });

    it('should validate event types', () => {
      const validEventTypes = [
        'goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 
        'own_goal', 'var_decision', 'injury', 'other'
      ];
      
      validEventTypes.forEach(eventType => {
        const event = {
          eventId: 'event_123',
          matchId: 'match_123',
          eventType: eventType
        };

        const result = validator.validateEvent(event);
        expect(result.warnings).not.toContain(expect.stringContaining('Unknown event type'));
      });

      const invalidEventTypeEvent = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'invalid_type'
      };

      const result = validator.validateEvent(invalidEventTypeEvent);
      expect(result.warnings).toContain('Unknown event type: invalid_type');
    });

    it('should validate minute ranges', () => {
      const validMinutes = [0, 45, 90, 120];
      
      validMinutes.forEach(minute => {
        const event = {
          eventId: 'event_123',
          matchId: 'match_123',
          eventType: 'goal',
          minute: minute
        };

        const result = validator.validateEvent(event);
        expect(result.errors).not.toContain(expect.stringContaining('Event minute must be'));
      });

      const invalidMinuteEvent = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'goal',
        minute: 150 // Over limit
      };

      const result = validator.validateEvent(invalidMinuteEvent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event minute must be a number between 0 and 120');
    });

    it('should validate field lengths', () => {
      const longFieldsEvent = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'goal',
        playerName: 'A'.repeat(300), // Exceeds 255 character limit
        description: 'B'.repeat(1100) // Exceeds 1000 character limit
      };

      const result = validator.validateEvent(longFieldsEvent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player name exceeds maximum length (255 characters)');
      expect(result.errors).toContain('Event description exceeds maximum length (1000 characters)');
    });

    it('should provide business logic warnings', () => {
      const goalWithoutPlayer = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'goal'
        // Missing playerName
      };

      const result = validator.validateEvent(goalWithoutPlayer);
      expect(result.warnings).toContain('Goal events should typically have a player name');

      const substitutionWithoutPlayer = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'substitution'
        // Missing playerName
      };

      const result2 = validator.validateEvent(substitutionWithoutPlayer);
      expect(result2.warnings).toContain('Substitution events should typically have player information');
    });

    it('should detect duplicate events', () => {
      const event = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'goal'
      };

      // First validation should pass
      const result1 = validator.validateEvent(event);
      expect(result1.warnings).not.toContain(expect.stringContaining('Duplicate event'));

      // Second validation should detect duplicate
      const result2 = validator.validateEvent(event);
      expect(result2.warnings).toContain('Duplicate event detected: event_123');
    });
  });

  describe('Batch Validation', () => {
    it('should validate batch of matches', () => {
      const matches = [
        {
          matchId: 'match_1',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea'
        },
        {
          matchId: 'match_2',
          homeTeam: 'Liverpool',
          awayTeam: 'Manchester City'
        },
        {
          matchId: 'match_3',
          homeTeam: 'Invalid', // Missing awayTeam
        }
      ];

      const result = validator.validateBatch(matches, 'match');
      
      expect(result.totalItems).toBe(3);
      expect(result.validItems).toBe(2);
      expect(result.invalidItems).toBe(1);
      expect(result.isValid).toBe(false);
      expect(result.results).toHaveLength(3);
    });

    it('should handle invalid input for batch validation', () => {
      const result = validator.validateBatch('not-an-array', 'match');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input must be an array');
    });

    it('should handle unknown data type', () => {
      const data = [{ id: '123' }];
      const result = validator.validateBatch(data, 'unknown');
      
      expect(result.isValid).toBe(false);
      expect(result.results[0].errors).toContain('Unknown data type: unknown');
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicates across different checks', () => {
      const match = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea'
      };

      // First check should not find duplicates
      const result1 = validator.checkDuplicates(match, 'match');
      expect(result1.hasDuplicates).toBe(false);

      // Add to seen matches
      validator.validateMatch(match);

      // Second check should find duplicates
      const result2 = validator.checkDuplicates(match, 'match');
      expect(result2.hasDuplicates).toBe(true);
      expect(result2.duplicates[0].type).toBe('match');
      expect(result2.duplicates[0].id).toBe('match_123');
    });
  });

  describe('Data Integrity Checks', () => {
    it('should check match integrity', () => {
      const finishedMatchWithoutScore = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'finished'
        // Missing finalScore
      };

      const result = validator.checkDataIntegrity(finishedMatchWithoutScore, 'match');
      expect(result.hasIssues).toBe(true);
      expect(result.issues).toContain('Finished match should have a final score');
    });

    it('should check score consistency', () => {
      const inconsistentScoreMatch = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        halfTimeScore: '2-1',
        finalScore: '1-2' // Half-time home goals > full-time home goals
      };

      const result = validator.checkDataIntegrity(inconsistentScoreMatch, 'match');
      expect(result.hasIssues).toBe(true);
      expect(result.issues).toContain('Half-time score cannot be higher than full-time score');
    });

    it('should check event timing', () => {
      const lateEvent = {
        eventId: 'event_123',
        matchId: 'match_123',
        eventType: 'goal',
        minute: 95
        // No indication of extra time
      };

      const result = validator.checkDataIntegrity(lateEvent, 'event');
      expect(result.hasIssues).toBe(true);
      expect(result.issues).toContain('Event after 90 minutes should indicate extra/added time');
    });
  });

  describe('Utility Methods', () => {
    it('should reset deduplication tracking', () => {
      // Add some data
      validator.validateMatch({ matchId: 'match_1', homeTeam: 'A', awayTeam: 'B' });
      validator.validateEvent({ eventId: 'event_1', matchId: 'match_1', eventType: 'goal' });
      validator.validateLeague({ leagueId: 'league_1', name: 'League', country: 'Country' });

      let stats = validator.getValidationStats();
      expect(stats.seenMatches).toBe(1);
      expect(stats.seenEvents).toBe(1);
      expect(stats.seenLeagues).toBe(1);

      // Reset
      validator.resetDeduplication();

      stats = validator.getValidationStats();
      expect(stats.seenMatches).toBe(0);
      expect(stats.seenEvents).toBe(0);
      expect(stats.seenLeagues).toBe(0);
    });

    it('should provide validation statistics', () => {
      const stats = validator.getValidationStats();
      
      expect(stats).toHaveProperty('seenMatches');
      expect(stats).toHaveProperty('seenEvents');
      expect(stats).toHaveProperty('seenLeagues');
      expect(stats).toHaveProperty('options');
      expect(typeof stats.seenMatches).toBe('number');
    });
  });

  describe('Configuration Options', () => {
    it('should respect strictMode option', () => {
      const strictValidator = new DataValidator({ strictMode: true });
      
      // Test that strict mode affects validation behavior
      const stats = strictValidator.getValidationStats();
      expect(stats.options.strictMode).toBe(true);
    });

    it('should respect enableDeduplication option', () => {
      const noDupeValidator = new DataValidator({ enableDeduplication: false });
      
      const match = {
        matchId: 'match_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea'
      };

      // Should not track duplicates when disabled
      const result1 = noDupeValidator.validateMatch(match);
      const result2 = noDupeValidator.validateMatch(match);
      
      expect(result1.warnings).not.toContain(expect.stringContaining('Duplicate'));
      expect(result2.warnings).not.toContain(expect.stringContaining('Duplicate'));
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      // Test with malformed data that might cause errors
      const malformedData = {
        matchId: null,
        homeTeam: { invalid: 'object' },
        awayTeam: undefined
      };

      const result = validator.validateMatch(malformedData);
      
      // Should not throw, should return validation result
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result.isValid).toBe(false);
    });
  });
});