const Match = require('../storage/models/Match');
const League = require('../storage/models/League');
const MatchEvent = require('../storage/models/MatchEvent');
const logger = require('../utils/logger');

/**
 * APIParser class for processing JSON responses and WebSocket messages
 * Handles real-time data updates and API response transformation
 */
class APIParser {
  constructor(options = {}) {
    this.options = {
      strictValidation: false,
      enableTransformation: true,
      ...options
    };
    this.logger = logger;
  }

  /**
   * Parse JSON response from Flashscore API
   * @param {Object|string} response - JSON response or string to parse
   * @param {string} endpoint - API endpoint for context
   * @returns {Object} Parsed data with matches, leagues, or events
   */
  parseJSONResponse(response, endpoint = '') {
    try {
      let data;
      
      if (typeof response === 'string') {
        data = JSON.parse(response);
      } else if (typeof response === 'object' && response !== null) {
        data = response;
      } else {
        throw new Error('Invalid response format');
      }

      // Determine response type based on endpoint or data structure
      const responseType = this._detectResponseType(data, endpoint);
      
      switch (responseType) {
        case 'matches':
          return this._parseMatchesResponse(data);
        case 'match_detail':
          return this._parseMatchDetailResponse(data);
        case 'leagues':
          return this._parseLeaguesResponse(data);
        case 'events':
          return this._parseEventsResponse(data);
        case 'live_updates':
          return this._parseLiveUpdatesResponse(data);
        default:
          return this._parseGenericResponse(data);
      }
    } catch (error) {
      this.logger.error('Error parsing JSON response:', error);
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse WebSocket message for real-time updates
   * @param {string|Object} message - WebSocket message
   * @returns {Object} Parsed real-time update data
   */
  parseWebSocketMessage(message) {
    try {
      let data;
      
      if (typeof message === 'string') {
        data = JSON.parse(message);
      } else {
        data = message;
      }

      // WebSocket messages typically have a type field
      const messageType = data.type || data.event || 'unknown';
      
      switch (messageType) {
        case 'match_update':
        case 'score_change':
          return this._parseMatchUpdate(data);
        case 'match_event':
        case 'goal':
        case 'card':
        case 'substitution':
          return this._parseMatchEventUpdate(data);
        case 'match_status':
          return this._parseMatchStatusUpdate(data);
        case 'live_commentary':
          return this._parseLiveCommentary(data);
        default:
          this.logger.warn(`Unknown WebSocket message type: ${messageType}`);
          return this._parseGenericWebSocketMessage(data);
      }
    } catch (error) {
      this.logger.error('Error parsing WebSocket message:', error);
      throw new Error(`WebSocket parsing failed: ${error.message}`);
    }
  }

  /**
   * Transform raw API data into normalized format
   * @param {Object} rawData - Raw API response data
   * @param {string} dataType - Type of data (match, league, event)
   * @returns {Object} Transformed data
   */
  transformData(rawData, dataType) {
    if (!this.options.enableTransformation) {
      return rawData;
    }

    try {
      switch (dataType) {
        case 'match':
          return this._transformMatchData(rawData);
        case 'league':
          return this._transformLeagueData(rawData);
        case 'event':
          return this._transformEventData(rawData);
        default:
          return this._transformGenericData(rawData);
      }
    } catch (error) {
      this.logger.error(`Error transforming ${dataType} data:`, error);
      return rawData; // Return original data if transformation fails
    }
  }

  /**
   * Extract match updates from API response
   * @param {Object} data - API response containing match updates
   * @returns {Array} Array of match update objects
   */
  extractMatchUpdates(data) {
    try {
      const updates = [];
      
      if (data.matches && Array.isArray(data.matches)) {
        data.matches.forEach(match => {
          const update = this._extractSingleMatchUpdate(match);
          if (update) {
            updates.push(update);
          }
        });
      } else if (data.match) {
        const update = this._extractSingleMatchUpdate(data.match);
        if (update) {
          updates.push(update);
        }
      }

      return updates;
    } catch (error) {
      this.logger.error('Error extracting match updates:', error);
      return [];
    }
  }

  /**
   * Normalize event data from various API formats
   * @param {Array|Object} events - Event data from API
   * @returns {Array} Normalized event objects
   */
  normalizeEventData(events) {
    try {
      if (!events) return [];
      
      const eventArray = Array.isArray(events) ? events : [events];
      
      return eventArray.map(event => {
        return {
          eventId: event.id || event.event_id || this._generateEventId(event),
          matchId: event.match_id || event.matchId,
          eventType: this._normalizeEventType(event.type || event.event_type),
          minute: this._parseMinute(event.minute || event.time),
          playerName: event.player || event.player_name || '',
          description: event.description || event.text || '',
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          additionalData: this._extractAdditionalEventData(event)
        };
      }).filter(event => event.matchId && event.eventType);
    } catch (error) {
      this.logger.error('Error normalizing event data:', error);
      return [];
    }
  }

  // Private helper methods

  /**
   * Detect the type of API response based on structure and endpoint
   */
  _detectResponseType(data, endpoint) {
    if (endpoint.includes('/matches') || endpoint.includes('/fixtures')) {
      return 'matches';
    }
    if (endpoint.includes('/match/') && endpoint.includes('/detail')) {
      return 'match_detail';
    }
    if (endpoint.includes('/leagues') || endpoint.includes('/competitions')) {
      return 'leagues';
    }
    if (endpoint.includes('/events') || endpoint.includes('/timeline')) {
      return 'events';
    }
    if (endpoint.includes('/live') || data.live === true) {
      return 'live_updates';
    }

    // Fallback to structure-based detection
    if (data.matches || data.fixtures) return 'matches';
    if (data.leagues || data.competitions) return 'leagues';
    if (data.events || data.timeline) return 'events';
    if (data.match && data.match.id) return 'match_detail';
    
    return 'generic';
  }

  /**
   * Parse matches response from API
   */
  _parseMatchesResponse(data) {
    const matches = data.matches || data.fixtures || [];
    return {
      type: 'matches',
      count: matches.length,
      matches: matches.map(match => this._transformMatchData(match))
    };
  }

  /**
   * Parse match detail response from API
   */
  _parseMatchDetailResponse(data) {
    const match = data.match || data;
    const matchId = match.id || match.match_id || match.matchId;
    
    // Add match_id to events if missing
    const eventsWithMatchId = (match.events || []).map(event => ({
      ...event,
      match_id: event.match_id || event.matchId || matchId
    }));
    
    return {
      type: 'match_detail',
      match: this._transformMatchData(match),
      events: this.normalizeEventData(eventsWithMatchId),
      stats: match.stats || {}
    };
  }

  /**
   * Parse leagues response from API
   */
  _parseLeaguesResponse(data) {
    const leagues = data.leagues || data.competitions || [];
    return {
      type: 'leagues',
      count: leagues.length,
      leagues: leagues.map(league => this._transformLeagueData(league))
    };
  }

  /**
   * Parse events response from API
   */
  _parseEventsResponse(data) {
    const events = data.events || data.timeline || [];
    return {
      type: 'events',
      count: events.length,
      events: this.normalizeEventData(events)
    };
  }

  /**
   * Parse live updates response from API
   */
  _parseLiveUpdatesResponse(data) {
    return {
      type: 'live_updates',
      timestamp: new Date(),
      updates: this.extractMatchUpdates(data),
      events: this.normalizeEventData(data.events || [])
    };
  }

  /**
   * Parse generic response format
   */
  _parseGenericResponse(data) {
    return {
      type: 'generic',
      data: data,
      timestamp: new Date()
    };
  }

  /**
   * Parse match update from WebSocket message
   */
  _parseMatchUpdate(data) {
    return {
      type: 'match_update',
      matchId: data.match_id || data.id,
      score: data.score || data.result,
      status: data.status,
      minute: data.minute || data.time,
      timestamp: new Date()
    };
  }

  /**
   * Parse match event update from WebSocket message
   */
  _parseMatchEventUpdate(data) {
    return {
      type: 'match_event',
      matchId: data.match_id || data.id,
      event: this.normalizeEventData(data)[0] || data,
      timestamp: new Date()
    };
  }

  /**
   * Parse match status update from WebSocket message
   */
  _parseMatchStatusUpdate(data) {
    return {
      type: 'match_status',
      matchId: data.match_id || data.id,
      status: data.status,
      minute: data.minute || data.time,
      timestamp: new Date()
    };
  }

  /**
   * Parse live commentary from WebSocket message
   */
  _parseLiveCommentary(data) {
    return {
      type: 'live_commentary',
      matchId: data.match_id || data.id,
      commentary: data.text || data.commentary,
      minute: data.minute || data.time,
      timestamp: new Date()
    };
  }

  /**
   * Parse generic WebSocket message
   */
  _parseGenericWebSocketMessage(data) {
    return {
      type: 'generic_ws',
      data: data,
      timestamp: new Date()
    };
  }

  /**
   * Transform match data to normalized format
   */
  _transformMatchData(match) {
    return {
      matchId: match.id || match.match_id || match.matchId,
      leagueId: match.league_id || match.leagueId || match.competition_id,
      homeTeam: match.home_team || match.homeTeam || match.home,
      awayTeam: match.away_team || match.awayTeam || match.away,
      matchDateTime: match.date_time || match.datetime || match.kickoff,
      status: this._normalizeMatchStatus(match.status),
      finalScore: match.score || match.result || match.final_score,
      halfTimeScore: match.ht_score || match.halftime_score,
      flashscoreUrl: match.url || match.link,
      lastUpdated: new Date()
    };
  }

  /**
   * Transform league data to normalized format
   */
  _transformLeagueData(league) {
    return {
      leagueId: league.id || league.league_id || league.leagueId,
      name: league.name || league.title,
      country: league.country || league.nation,
      season: league.season || league.year,
      flashscoreUrl: league.url || league.link
    };
  }

  /**
   * Transform event data to normalized format
   */
  _transformEventData(event) {
    return {
      eventId: event.id || event.event_id || this._generateEventId(event),
      matchId: event.match_id || event.matchId,
      eventType: this._normalizeEventType(event.type || event.event_type),
      minute: this._parseMinute(event.minute || event.time),
      playerName: event.player || event.player_name || '',
      description: event.description || event.text || '',
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
    };
  }

  /**
   * Transform generic data
   */
  _transformGenericData(data) {
    return {
      ...data,
      transformed: true,
      timestamp: new Date()
    };
  }

  /**
   * Extract single match update
   */
  _extractSingleMatchUpdate(match) {
    if (!match || !match.id) return null;
    
    const matchId = match.id;
    
    // Add match_id to events if missing
    const eventsWithMatchId = (match.events || []).map(event => ({
      ...event,
      match_id: event.match_id || event.matchId || matchId
    }));
    
    return {
      matchId: matchId,
      score: match.score || match.result,
      status: match.status,
      minute: match.minute || match.time,
      events: this.normalizeEventData(eventsWithMatchId)
    };
  }

  /**
   * Normalize match status to standard format
   */
  _normalizeMatchStatus(status) {
    if (!status) return 'unknown';
    
    const statusMap = {
      'live': 'live',
      'finished': 'finished',
      'ft': 'finished',
      'scheduled': 'scheduled',
      'postponed': 'postponed',
      'cancelled': 'cancelled',
      'ht': 'halftime',
      'halftime': 'halftime'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }

  /**
   * Normalize event type to standard format
   */
  _normalizeEventType(type) {
    if (!type) return 'unknown';
    
    const typeMap = {
      'goal': 'goal',
      'yellow_card': 'yellow_card',
      'red_card': 'red_card',
      'substitution': 'substitution',
      'penalty': 'penalty',
      'own_goal': 'own_goal',
      'var': 'var_decision'
    };
    
    return typeMap[type.toLowerCase()] || type;
  }

  /**
   * Parse minute from various formats
   */
  _parseMinute(minute) {
    if (typeof minute === 'number') return minute;
    if (typeof minute === 'string') {
      const parsed = parseInt(minute.replace(/[^\d]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Generate event ID from event data
   */
  _generateEventId(event) {
    const matchId = event.match_id || event.matchId || 'unknown';
    const minute = event.minute || event.time || '0';
    const type = event.type || event.event_type || 'event';
    const timestamp = Date.now();
    
    return `${matchId}_${minute}_${type}_${timestamp}`;
  }

  /**
   * Extract additional event data
   */
  _extractAdditionalEventData(event) {
    const additional = {};
    
    // Extract any additional fields that might be useful
    if (event.assist) additional.assist = event.assist;
    if (event.card_type) additional.cardType = event.card_type;
    if (event.substitution_in) additional.substitutionIn = event.substitution_in;
    if (event.substitution_out) additional.substitutionOut = event.substitution_out;
    if (event.var_decision) additional.varDecision = event.var_decision;
    
    return Object.keys(additional).length > 0 ? additional : null;
  }
}

module.exports = APIParser;