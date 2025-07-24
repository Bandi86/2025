const { expect } = require('chai');
const APIParser = require('../APIParser');

describe('APIParser', () => {
  let parser;

  beforeEach(() => {
    parser = new APIParser();
  });

  describe('JSON Response Parsing', () => {
    it('should parse various API response formats', () => {
      const matchesResponse = {
        matches: [
          { id: '1', home_team: 'Team A', away_team: 'Team B', status: 'live' }
        ]
      };
      
      const result = parser.parseJSONResponse(matchesResponse, '/matches');
      expect(result.type).to.equal('matches');
      expect(result.matches).to.have.length(1);
    });

    it('should handle live updates with real-time data', () => {
      const liveData = {
        live: true,
        matches: [
          { id: '1', score: '2-1', minute: 67, status: 'live' }
        ],
        events: [
          { match_id: '1', type: 'goal', minute: 65, player: 'Scorer' }
        ]
      };
      
      const result = parser.parseJSONResponse(liveData);
      expect(result.type).to.equal('live_updates');
      expect(result.updates).to.have.length(1);
      expect(result.events).to.have.length(1);
    });
  });

  describe('WebSocket Message Parsing', () => {
    it('should parse real-time match updates', () => {
      const wsUpdate = {
        type: 'score_change',
        match_id: '123',
        score: '2-1',
        minute: 78
      };
      
      const result = parser.parseWebSocketMessage(wsUpdate);
      expect(result.type).to.equal('match_update');
      expect(result.matchId).to.equal('123');
      expect(result.score).to.equal('2-1');
    });

    it('should handle live commentary messages', () => {
      const commentary = {
        type: 'live_commentary',
        match_id: '456',
        text: 'Great save by the goalkeeper!',
        minute: 82
      };
      
      const result = parser.parseWebSocketMessage(commentary);
      expect(result.type).to.equal('live_commentary');
      expect(result.commentary).to.equal('Great save by the goalkeeper!');
    });
  });

  describe('Data Transformation', () => {
    it('should normalize different API field formats', () => {
      const apiMatch = {
        id: '123',
        home: 'Barcelona',
        away: 'Real Madrid',
        datetime: '2024-01-15T20:00:00Z',
        result: '2-1'
      };
      
      const normalized = parser.transformData(apiMatch, 'match');
      expect(normalized.homeTeam).to.equal('Barcelona');
      expect(normalized.awayTeam).to.equal('Real Madrid');
      expect(normalized.finalScore).to.equal('2-1');
    });

    it('should handle complex event data with additional fields', () => {
      const complexEvent = {
        id: 'sub_1',
        match_id: '123',
        type: 'substitution',
        minute: 75,
        substitution_in: 'Player In',
        substitution_out: 'Player Out',
        var_decision: 'confirmed'
      };
      
      const normalized = parser.normalizeEventData(complexEvent);
      expect(normalized[0].additionalData.substitutionIn).to.equal('Player In');
      expect(normalized[0].additionalData.substitutionOut).to.equal('Player Out');
      expect(normalized[0].additionalData.varDecision).to.equal('confirmed');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed minute formats', () => {
      const event = {
        match_id: '123',
        type: 'goal',
        minute: '90+5\''
      };
      
      const normalized = parser.normalizeEventData(event);
      expect(normalized[0].minute).to.equal(905);
    });

    it('should gracefully handle missing required fields', () => {
      const incompleteEvent = {
        type: 'goal',
        minute: 45
        // Missing match_id
      };
      
      const normalized = parser.normalizeEventData(incompleteEvent);
      expect(normalized).to.have.length(0);
    });

    it('should generate fallback IDs when missing', () => {
      const eventWithoutId = {
        match_id: '123',
        type: 'card',
        minute: 30
      };
      
      const normalized = parser.normalizeEventData(eventWithoutId);
      expect(normalized[0].eventId).to.include('123_30_card');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large arrays of events efficiently', () => {
      const largeEventArray = Array.from({ length: 100 }, (_, i) => ({
        id: `event_${i}`,
        match_id: '123',
        type: 'goal',
        minute: i + 1,
        player: `Player ${i}`
      }));
      
      const start = Date.now();
      const normalized = parser.normalizeEventData(largeEventArray);
      const duration = Date.now() - start;
      
      expect(normalized).to.have.length(100);
      expect(duration).to.be.lessThan(100); // Should process quickly
    });

    it('should handle multiple concurrent parsing operations', () => {
      const responses = Array.from({ length: 10 }, (_, i) => ({
        matches: [{ id: `match_${i}`, home_team: 'A', away_team: 'B' }]
      }));
      
      const results = responses.map(response => 
        parser.parseJSONResponse(response, '/matches')
      );
      
      expect(results).to.have.length(10);
      results.forEach((result, i) => {
        expect(result.matches[0].matchId).to.equal(`match_${i}`);
      });
    });
  });
});