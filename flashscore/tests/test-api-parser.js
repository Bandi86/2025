const { expect } = require('chai');
const APIParser = require('../src/parser/APIParser');

describe('APIParser', () => {
  let parser;

  beforeEach(() => {
    parser = new APIParser();
  });

  describe('parseJSONResponse', () => {
    it('should parse string JSON response', () => {
      const jsonString = '{"matches": [{"id": "123", "home_team": "Team A", "away_team": "Team B"}]}';
      const result = parser.parseJSONResponse(jsonString, '/matches');
      
      expect(result.type).to.equal('matches');
      expect(result.matches).to.have.length(1);
      expect(result.matches[0].matchId).to.equal('123');
    });

    it('should parse object JSON response', () => {
      const jsonObject = {
        matches: [
          {
            id: '456',
            home_team: 'Team C',
            away_team: 'Team D',
            status: 'live',
            score: '2-1'
          }
        ]
      };
      const result = parser.parseJSONResponse(jsonObject, '/matches');
      
      expect(result.type).to.equal('matches');
      expect(result.matches[0].matchId).to.equal('456');
      expect(result.matches[0].status).to.equal('live');
    });

    it('should handle match detail response', () => {
      const matchDetail = {
        match: {
          id: '789',
          home_team: 'Team E',
          away_team: 'Team F',
          events: [
            {
              id: 'event1',
              type: 'goal',
              minute: 25,
              player: 'Player A'
            }
          ]
        }
      };
      const result = parser.parseJSONResponse(matchDetail, '/match/789/detail');
      
      expect(result.type).to.equal('match_detail');
      expect(result.match.matchId).to.equal('789');
      expect(result.events).to.have.length(1);
      expect(result.events[0].eventType).to.equal('goal');
    });

    it('should handle leagues response', () => {
      const leaguesResponse = {
        leagues: [
          {
            id: 'league1',
            name: 'Premier League',
            country: 'England'
          }
        ]
      };
      const result = parser.parseJSONResponse(leaguesResponse, '/leagues');
      
      expect(result.type).to.equal('leagues');
      expect(result.leagues[0].leagueId).to.equal('league1');
      expect(result.leagues[0].name).to.equal('Premier League');
    });

    it('should throw error for invalid JSON string', () => {
      expect(() => {
        parser.parseJSONResponse('invalid json');
      }).to.throw('JSON parsing failed');
    });

    it('should throw error for null response', () => {
      expect(() => {
        parser.parseJSONResponse(null);
      }).to.throw('JSON parsing failed');
    });
  });

  describe('parseWebSocketMessage', () => {
    it('should parse match update WebSocket message', () => {
      const wsMessage = {
        type: 'match_update',
        match_id: '123',
        score: '3-1',
        status: 'live',
        minute: 67
      };
      const result = parser.parseWebSocketMessage(wsMessage);
      
      expect(result.type).to.equal('match_update');
      expect(result.matchId).to.equal('123');
      expect(result.score).to.equal('3-1');
      expect(result.minute).to.equal(67);
    });

    it('should parse match event WebSocket message', () => {
      const wsMessage = {
        type: 'goal',
        match_id: '456',
        player: 'Striker A',
        minute: 45,
        description: 'Great goal!'
      };
      const result = parser.parseWebSocketMessage(wsMessage);
      
      expect(result.type).to.equal('match_event');
      expect(result.matchId).to.equal('456');
      expect(result.event.playerName).to.equal('Striker A');
    });

    it('should parse string WebSocket message', () => {
      const wsString = '{"type": "match_status", "match_id": "789", "status": "finished"}';
      const result = parser.parseWebSocketMessage(wsString);
      
      expect(result.type).to.equal('match_status');
      expect(result.matchId).to.equal('789');
      expect(result.status).to.equal('finished');
    });

    it('should handle unknown WebSocket message type', () => {
      const wsMessage = {
        type: 'unknown_type',
        data: 'some data'
      };
      const result = parser.parseWebSocketMessage(wsMessage);
      
      expect(result.type).to.equal('generic_ws');
      expect(result.data.type).to.equal('unknown_type');
    });

    it('should throw error for invalid WebSocket JSON', () => {
      expect(() => {
        parser.parseWebSocketMessage('invalid json');
      }).to.throw('WebSocket parsing failed');
    });
  });

  describe('transformData', () => {
    it('should transform match data', () => {
      const rawMatch = {
        id: '123',
        home_team: 'Team A',
        away_team: 'Team B',
        date_time: '2024-01-15T15:00:00Z',
        status: 'live'
      };
      const result = parser.transformData(rawMatch, 'match');
      
      expect(result.matchId).to.equal('123');
      expect(result.homeTeam).to.equal('Team A');
      expect(result.awayTeam).to.equal('Team B');
      expect(result.status).to.equal('live');
    });

    it('should transform league data', () => {
      const rawLeague = {
        id: 'league1',
        name: 'La Liga',
        country: 'Spain',
        season: '2023-24'
      };
      const result = parser.transformData(rawLeague, 'league');
      
      expect(result.leagueId).to.equal('league1');
      expect(result.name).to.equal('La Liga');
      expect(result.country).to.equal('Spain');
      expect(result.season).to.equal('2023-24');
    });

    it('should transform event data', () => {
      const rawEvent = {
        id: 'event1',
        match_id: '123',
        type: 'yellow_card',
        minute: 30,
        player_name: 'Defender A'
      };
      const result = parser.transformData(rawEvent, 'event');
      
      expect(result.eventId).to.equal('event1');
      expect(result.matchId).to.equal('123');
      expect(result.eventType).to.equal('yellow_card');
      expect(result.minute).to.equal(30);
      expect(result.playerName).to.equal('Defender A');
    });

    it('should return original data if transformation disabled', () => {
      const parserNoTransform = new APIParser({ enableTransformation: false });
      const rawData = { id: '123', name: 'test' };
      const result = parserNoTransform.transformData(rawData, 'match');
      
      expect(result).to.deep.equal(rawData);
    });
  });

  describe('extractMatchUpdates', () => {
    it('should extract updates from matches array', () => {
      const data = {
        matches: [
          {
            id: '123',
            score: '2-0',
            status: 'live',
            minute: 45
          },
          {
            id: '456',
            score: '1-1',
            status: 'finished'
          }
        ]
      };
      const result = parser.extractMatchUpdates(data);
      
      expect(result).to.have.length(2);
      expect(result[0].matchId).to.equal('123');
      expect(result[0].score).to.equal('2-0');
      expect(result[1].matchId).to.equal('456');
    });

    it('should extract update from single match', () => {
      const data = {
        match: {
          id: '789',
          score: '3-2',
          status: 'finished',
          events: [
            { type: 'goal', minute: 10 }
          ]
        }
      };
      const result = parser.extractMatchUpdates(data);
      
      expect(result).to.have.length(1);
      expect(result[0].matchId).to.equal('789');
      expect(result[0].events).to.have.length(1);
    });

    it('should return empty array for invalid data', () => {
      const result = parser.extractMatchUpdates({});
      expect(result).to.have.length(0);
    });
  });

  describe('normalizeEventData', () => {
    it('should normalize single event', () => {
      const event = {
        id: 'event1',
        match_id: '123',
        type: 'goal',
        minute: 25,
        player_name: 'Striker A',
        description: 'Header goal'
      };
      const result = parser.normalizeEventData(event);
      
      expect(result).to.have.length(1);
      expect(result[0].eventId).to.equal('event1');
      expect(result[0].matchId).to.equal('123');
      expect(result[0].eventType).to.equal('goal');
      expect(result[0].minute).to.equal(25);
      expect(result[0].playerName).to.equal('Striker A');
    });

    it('should normalize array of events', () => {
      const events = [
        {
          id: 'event1',
          match_id: '123',
          type: 'goal',
          minute: 15
        },
        {
          id: 'event2',
          match_id: '123',
          type: 'yellow_card',
          minute: 30
        }
      ];
      const result = parser.normalizeEventData(events);
      
      expect(result).to.have.length(2);
      expect(result[0].eventType).to.equal('goal');
      expect(result[1].eventType).to.equal('yellow_card');
    });

    it('should filter out invalid events', () => {
      const events = [
        {
          id: 'event1',
          match_id: '123',
          type: 'goal',
          minute: 15
        },
        {
          // Missing match_id and type
          id: 'event2',
          minute: 30
        }
      ];
      const result = parser.normalizeEventData(events);
      
      expect(result).to.have.length(1);
      expect(result[0].eventId).to.equal('event1');
    });

    it('should handle null/undefined events', () => {
      expect(parser.normalizeEventData(null)).to.have.length(0);
      expect(parser.normalizeEventData(undefined)).to.have.length(0);
    });

    it('should generate event ID if missing', () => {
      const event = {
        match_id: '123',
        type: 'goal',
        minute: 25
      };
      const result = parser.normalizeEventData(event);
      
      expect(result[0].eventId).to.include('123_25_goal');
    });

    it('should parse minute from string format', () => {
      const event = {
        id: 'event1',
        match_id: '123',
        type: 'goal',
        minute: '45+2',
        player_name: 'Player A'
      };
      const result = parser.normalizeEventData(event);
      
      expect(result[0].minute).to.equal(452);
    });

    it('should extract additional event data', () => {
      const event = {
        id: 'event1',
        match_id: '123',
        type: 'substitution',
        minute: 60,
        substitution_in: 'Player A',
        substitution_out: 'Player B'
      };
      const result = parser.normalizeEventData(event);
      
      expect(result[0].additionalData).to.exist;
      expect(result[0].additionalData.substitutionIn).to.equal('Player A');
      expect(result[0].additionalData.substitutionOut).to.equal('Player B');
    });
  });

  describe('private helper methods', () => {
    it('should detect response type from endpoint', () => {
      expect(parser._detectResponseType({}, '/matches')).to.equal('matches');
      expect(parser._detectResponseType({}, '/leagues')).to.equal('leagues');
      expect(parser._detectResponseType({}, '/match/123/detail')).to.equal('match_detail');
      expect(parser._detectResponseType({}, '/events')).to.equal('events');
      expect(parser._detectResponseType({ live: true }, '')).to.equal('live_updates');
    });

    it('should normalize match status', () => {
      expect(parser._normalizeMatchStatus('LIVE')).to.equal('live');
      expect(parser._normalizeMatchStatus('FT')).to.equal('finished');
      expect(parser._normalizeMatchStatus('HT')).to.equal('halftime');
      expect(parser._normalizeMatchStatus('unknown_status')).to.equal('unknown_status');
    });

    it('should normalize event type', () => {
      expect(parser._normalizeEventType('GOAL')).to.equal('goal');
      expect(parser._normalizeEventType('YELLOW_CARD')).to.equal('yellow_card');
      expect(parser._normalizeEventType('RED_CARD')).to.equal('red_card');
      expect(parser._normalizeEventType('unknown_type')).to.equal('unknown_type');
    });

    it('should parse minute from various formats', () => {
      expect(parser._parseMinute(45)).to.equal(45);
      expect(parser._parseMinute('45')).to.equal(45);
      expect(parser._parseMinute('45+2')).to.equal(452);
      expect(parser._parseMinute('90+5')).to.equal(905);
      expect(parser._parseMinute('invalid')).to.equal(0);
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', () => {
      // Mock logger to avoid console output during tests
      parser.logger = { error: () => {}, warn: () => {} };
      
      expect(() => {
        parser.parseJSONResponse('invalid json');
      }).to.throw();
    });

    it('should return original data on transformation error', () => {
      // Mock logger
      parser.logger = { error: () => {} };
      
      const originalData = { invalid: 'data' };
      const result = parser.transformData(originalData, 'invalid_type');
      
      expect(result.transformed).to.be.true;
    });

    it('should return empty array on event normalization error', () => {
      // Mock logger
      parser.logger = { error: () => {} };
      
      const result = parser.normalizeEventData('invalid data');
      expect(result).to.have.length(0);
    });
  });
});