const cheerio = require('cheerio');
const Match = require('../storage/models/Match');
const League = require('../storage/models/League');
const MatchEvent = require('../storage/models/MatchEvent');
const logger = require('../utils/logger');

/**
 * DataParser class for extracting match, league, and event data from HTML
 * Implements robust selector strategies with fallbacks and data normalization
 */
class DataParser {
  constructor(options = {}) {
    this.options = {
      enableFallbacks: true,
      strictValidation: false,
      ...options
    };
    this.logger = logger;
  }

  /**
   * Parse match data from HTML content
   * @param {string} html - HTML content to parse
   * @param {string} url - Source URL for context
   * @returns {Array<Match>} Array of parsed Match objects
   */
  parseMatchData(html, url = '') {
    try {
      const $ = cheerio.load(html);
      const matches = [];

      // Primary selectors for match data
      const matchSelectors = [
        '.event__match',
        '.match',
        '[data-testid="match"]',
        '.fixture',
        '.game'
      ];

      let matchElements = null;
      
      // Try each selector until we find matches
      for (const selector of matchSelectors) {
        matchElements = $(selector);
        if (matchElements.length > 0) {
          this.logger.debug(`Found ${matchElements.length} matches using selector: ${selector}`);
          break;
        }
      }

      if (!matchElements || matchElements.length === 0) {
        this.logger.warn('No match elements found in HTML', { url });
        return matches;
      }

      matchElements.each((index, element) => {
        try {
          const matchData = this._extractMatchFromElement($, element, url);
          if (matchData) {
            const match = new Match(matchData);
            const validation = match.validate();
            
            if (validation.isValid || !this.options.strictValidation) {
              matches.push(match);
              if (!validation.isValid) {
                this.logger.warn('Match validation warnings', {
                  matchId: match.matchId,
                  errors: validation.errors
                });
              }
            } else {
              this.logger.error('Match validation failed', {
                errors: validation.errors,
                matchData
              });
            }
          }
        } catch (error) {
          this.logger.error('Error parsing individual match', {
            error: error.message,
            index,
            url
          });
        }
      });

      this.logger.info(`Successfully parsed ${matches.length} matches from HTML`, { url });
      return matches;

    } catch (error) {
      this.logger.error('Error parsing match data from HTML', {
        error: error.message,
        url
      });
      return [];
    }
  }

  /**
   * Parse league data from HTML content
   * @param {string} html - HTML content to parse
   * @param {string} url - Source URL for context
   * @returns {Array<League>} Array of parsed League objects
   */
  parseLeagueData(html, url = '') {
    try {
      const $ = cheerio.load(html);
      const leagues = [];

      // Primary selectors for league data
      const leagueSelectors = [
        '.league',
        '.tournament',
        '.competition',
        '[data-testid="tournament"]',
        '.event__header'
      ];

      let leagueElements = null;
      
      for (const selector of leagueSelectors) {
        leagueElements = $(selector);
        if (leagueElements.length > 0) {
          this.logger.debug(`Found ${leagueElements.length} leagues using selector: ${selector}`);
          break;
        }
      }

      if (!leagueElements || leagueElements.length === 0) {
        this.logger.warn('No league elements found in HTML', { url });
        return leagues;
      }

      leagueElements.each((index, element) => {
        try {
          const leagueData = this._extractLeagueFromElement($, element, url);
          if (leagueData) {
            const league = new League(leagueData);
            const validation = league.validate();
            
            if (validation.isValid || !this.options.strictValidation) {
              leagues.push(league);
              if (!validation.isValid) {
                this.logger.warn('League validation warnings', {
                  leagueId: league.leagueId,
                  errors: validation.errors
                });
              }
            } else {
              this.logger.error('League validation failed', {
                errors: validation.errors,
                leagueData
              });
            }
          }
        } catch (error) {
          this.logger.error('Error parsing individual league', {
            error: error.message,
            index,
            url
          });
        }
      });

      this.logger.info(`Successfully parsed ${leagues.length} leagues from HTML`, { url });
      return leagues;

    } catch (error) {
      this.logger.error('Error parsing league data from HTML', {
        error: error.message,
        url
      });
      return [];
    }
  }

  /**
   * Parse match events from HTML content
   * @param {string} html - HTML content to parse
   * @param {string} matchId - Match ID to associate events with
   * @param {string} url - Source URL for context
   * @returns {Array<MatchEvent>} Array of parsed MatchEvent objects
   */
  parseMatchEvents(html, matchId, url = '') {
    try {
      const $ = cheerio.load(html);
      const events = [];

      // Primary selectors for match events
      const eventSelectors = [
        '.event',
        '.match-event',
        '.incident',
        '[data-testid="event"]',
        '.timeline-item'
      ];

      let eventElements = null;
      
      for (const selector of eventSelectors) {
        eventElements = $(selector);
        if (eventElements.length > 0) {
          this.logger.debug(`Found ${eventElements.length} events using selector: ${selector}`);
          break;
        }
      }

      if (!eventElements || eventElements.length === 0) {
        this.logger.warn('No event elements found in HTML', { url, matchId });
        return events;
      }

      eventElements.each((index, element) => {
        try {
          const eventData = this._extractEventFromElement($, element, matchId, url);
          if (eventData) {
            const event = new MatchEvent(eventData);
            const validation = event.validate();
            
            if (validation.isValid || !this.options.strictValidation) {
              events.push(event);
              if (!validation.isValid) {
                this.logger.warn('Event validation warnings', {
                  eventId: event.eventId,
                  errors: validation.errors
                });
              }
            } else {
              this.logger.error('Event validation failed', {
                errors: validation.errors,
                eventData
              });
            }
          }
        } catch (error) {
          this.logger.error('Error parsing individual event', {
            error: error.message,
            index,
            matchId,
            url
          });
        }
      });

      this.logger.info(`Successfully parsed ${events.length} events from HTML`, { url, matchId });
      return events;

    } catch (error) {
      this.logger.error('Error parsing match events from HTML', {
        error: error.message,
        matchId,
        url
      });
      return [];
    }
  }

  /**
   * Extract match data from a single HTML element
   * @private
   */
  _extractMatchFromElement($, element, url) {
    const $el = $(element);
    
    // Extract teams with fallback selectors
    const homeTeam = this._extractTextWithFallbacks($, $el, [
      '.team-home .team-name',
      '.home-team',
      '.team:first-child',
      '[data-testid="home-team"]'
    ]);

    const awayTeam = this._extractTextWithFallbacks($, $el, [
      '.team-away .team-name',
      '.away-team',
      '.team:last-child',
      '[data-testid="away-team"]'
    ]);

    if (!homeTeam || !awayTeam) {
      this.logger.debug('Could not extract team names from match element');
      return null;
    }

    // Extract match time/date
    const matchDateTime = this._extractDateTimeWithFallbacks($, $el, [
      '[data-testid="match-time"]',
      '.match-time',
      '.time',
      '.date-time'
    ]);

    // Extract score
    const score = this._extractTextWithFallbacks($, $el, [
      '.score',
      '.result',
      '[data-testid="score"]',
      '.match-score'
    ]);

    // Extract status
    const status = this._extractStatusWithFallbacks($, $el, [
      '.status',
      '.match-status',
      '[data-testid="status"]'
    ]);

    // Generate match ID from teams and date
    const matchId = this._generateMatchId(homeTeam, awayTeam, matchDateTime);

    // Extract league ID from parent elements or URL
    const leagueId = this._extractLeagueIdFromContext($, $el, url);

    return {
      matchId,
      leagueId,
      homeTeam: this._normalizeTeamName(homeTeam),
      awayTeam: this._normalizeTeamName(awayTeam),
      matchDateTime,
      status: this._normalizeStatus(status),
      finalScore: this._normalizeScore(score),
      flashscoreUrl: url
    };
  }

  /**
   * Extract league data from a single HTML element
   * @private
   */
  _extractLeagueFromElement($, element, url) {
    const $el = $(element);
    
    const name = this._extractTextWithFallbacks($, $el, [
      '.league-name',
      '.tournament-name',
      '.competition-name',
      'h1', 'h2', 'h3'
    ]);

    if (!name) {
      this.logger.debug('Could not extract league name from element');
      return null;
    }

    const country = this._extractTextWithFallbacks($, $el, [
      '.country',
      '.league-country',
      '.flag + span',
      '[data-testid="country"]'
    ]);

    const season = this._extractTextWithFallbacks($, $el, [
      '.season',
      '.league-season',
      '[data-testid="season"]'
    ]);

    const leagueId = this._generateLeagueId(name, country, season);

    return {
      leagueId,
      name: this._normalizeLeagueName(name),
      country: this._normalizeCountryName(country || 'Unknown'),
      season: this._normalizeSeason(season),
      flashscoreUrl: url
    };
  }

  /**
   * Extract event data from a single HTML element
   * @private
   */
  _extractEventFromElement($, element, matchId, url) {
    const $el = $(element);
    
    const eventType = this._extractEventTypeWithFallbacks($, $el, [
      '.event-type',
      '.incident-type',
      '[data-testid="event-type"]',
      '.icon'
    ]);

    if (!eventType) {
      this.logger.debug('Could not extract event type from element');
      return null;
    }

    const minute = this._extractMinuteWithFallbacks($, $el, [
      '.minute',
      '.time',
      '[data-testid="minute"]'
    ]);

    const playerName = this._extractTextWithFallbacks($, $el, [
      '.player',
      '.player-name',
      '[data-testid="player"]'
    ]);

    const description = this._extractTextWithFallbacks($, $el, [
      '.description',
      '.event-description',
      '.details'
    ]);

    const eventId = this._generateEventId(matchId, eventType, minute, playerName);

    return {
      eventId,
      matchId,
      eventType: this._normalizeEventType(eventType),
      minute: this._normalizeMinute(minute),
      playerName: this._normalizePlayerName(playerName),
      description: this._normalizeDescription(description)
    };
  }  /**

   * Extract text using multiple fallback selectors
   * @private
   */
  _extractTextWithFallbacks($, $parent, selectors) {
    for (const selector of selectors) {
      const text = $parent.find(selector).first().text().trim();
      if (text) {
        return text;
      }
    }
    return null;
  }

  /**
   * Extract datetime with fallback selectors
   * @private
   */
  _extractDateTimeWithFallbacks($, $parent, selectors) {
    for (const selector of selectors) {
      const $element = $parent.find(selector).first();
      
      // Try data attributes first
      const timestamp = $element.attr('data-timestamp') || $element.attr('timestamp');
      if (timestamp) {
        const date = new Date(parseInt(timestamp) * 1000);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try text content
      const text = $element.text().trim();
      if (text) {
        const date = this._parseDateTime(text);
        if (date) {
          return date;
        }
      }
    }
    return null;
  }

  /**
   * Extract status with fallback selectors
   * @private
   */
  _extractStatusWithFallbacks($, $parent, selectors) {
    for (const selector of selectors) {
      const $element = $parent.find(selector).first();
      
      // Try data attributes
      const status = $element.attr('data-status');
      if (status) {
        return status;
      }

      // Try class names for status indicators
      const classes = $element.attr('class') || '';
      if (classes.includes('live')) return 'live';
      if (classes.includes('finished')) return 'finished';
      if (classes.includes('scheduled')) return 'scheduled';

      // Try text content
      const text = $element.text().trim().toLowerCase();
      if (text) {
        if (text.includes('live') || text.includes("'")) return 'live';
        if (text.includes('ft') || text.includes('finished')) return 'finished';
        if (text.includes('scheduled') || text.match(/\d{2}:\d{2}/)) return 'scheduled';
      }
    }
    return 'scheduled'; // default
  }

  /**
   * Extract event type with fallback selectors
   * @private
   */
  _extractEventTypeWithFallbacks($, $parent, selectors) {
    for (const selector of selectors) {
      const $element = $parent.find(selector).first();
      
      // Try data attributes
      const eventType = $element.attr('data-event-type') || $element.attr('data-type');
      if (eventType) {
        return eventType;
      }

      // Try class names for event type indicators
      const classes = $element.attr('class') || '';
      if (classes.includes('goal')) return 'goal';
      if (classes.includes('yellow')) return 'yellow_card';
      if (classes.includes('red')) return 'red_card';
      if (classes.includes('substitution')) return 'substitution';

      // Try text content or title attributes
      const text = ($element.text() || $element.attr('title') || '').toLowerCase();
      if (text.includes('goal')) return 'goal';
      if (text.includes('yellow')) return 'yellow_card';
      if (text.includes('red')) return 'red_card';
      if (text.includes('substitution') || text.includes('sub')) return 'substitution';
    }
    return 'other';
  }

  /**
   * Extract minute with fallback selectors
   * @private
   */
  _extractMinuteWithFallbacks($, $parent, selectors) {
    for (const selector of selectors) {
      const text = $parent.find(selector).first().text().trim();
      if (text) {
        const minute = this._parseMinute(text);
        if (minute !== null) {
          return minute;
        }
      }
    }
    return null;
  }

  /**
   * Parse datetime from various text formats
   * @private
   */
  _parseDateTime(text) {
    // Try various date/time formats
    const patterns = [
      /(\d{1,2}):(\d{2})/,  // HH:MM
      /(\d{1,2})\.(\d{1,2})\.\s*(\d{2}):(\d{2})/,  // DD.MM. HH:MM
      /(\d{1,2})\/(\d{1,2})\s*(\d{2}):(\d{2})/,   // MM/DD HH:MM
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match.length === 3) {
            // Just time, assume today
            const now = new Date();
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          } else if (match.length === 5) {
            // Date and time
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // JS months are 0-based
            const hours = parseInt(match[3]);
            const minutes = parseInt(match[4]);
            const year = new Date().getFullYear();
            return new Date(year, month, day, hours, minutes);
          }
        } catch (error) {
          this.logger.debug('Error parsing datetime', { text, error: error.message });
        }
      }
    }

    // Try ISO format
    try {
      const date = new Date(text);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      // Ignore
    }

    return null;
  }

  /**
   * Parse minute from text
   * @private
   */
  _parseMinute(text) {
    const match = text.match(/(\d+)/);
    if (match) {
      const minute = parseInt(match[1]);
      return minute >= 0 && minute <= 120 ? minute : null;
    }
    return null;
  }

  /**
   * Generate match ID from components
   * @private
   */
  _generateMatchId(homeTeam, awayTeam, matchDateTime) {
    const dateStr = matchDateTime ? matchDateTime.toISOString().split('T')[0] : 'unknown';
    const teams = `${homeTeam}-${awayTeam}`.replace(/[^a-zA-Z0-9-]/g, '');
    return `match_${teams}_${dateStr}`.toLowerCase();
  }

  /**
   * Generate league ID from components
   * @private
   */
  _generateLeagueId(name, country, season) {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanCountry = (country || 'unknown').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanSeason = (season || 'current').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `league_${cleanCountry}_${cleanName}_${cleanSeason}`;
  }

  /**
   * Generate event ID from components
   * @private
   */
  _generateEventId(matchId, eventType, minute, playerName) {
    const minuteStr = minute !== null ? minute.toString() : 'unknown';
    const playerStr = playerName ? playerName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'unknown';
    return `event_${matchId}_${eventType}_${minuteStr}_${playerStr}`;
  }

  /**
   * Extract league ID from context (parent elements or URL)
   * @private
   */
  _extractLeagueIdFromContext($, $element, url) {
    // Try to find league context in parent elements
    const $league = $element.closest('[data-league-id]');
    if ($league.length) {
      return $league.attr('data-league-id');
    }

    // Try to extract from URL
    const urlMatch = url.match(/\/([^\/]+)\/matches/);
    if (urlMatch) {
      return `league_${urlMatch[1]}`;
    }

    return 'unknown_league';
  }

  // Data normalization methods

  /**
   * Normalize team name
   * @private
   */
  _normalizeTeamName(name) {
    if (!name) return '';
    return name.trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\.]/g, '')
      .substring(0, 255);
  }

  /**
   * Normalize league name
   * @private
   */
  _normalizeLeagueName(name) {
    if (!name) return '';
    return name.trim()
      .replace(/\s+/g, ' ')
      .substring(0, 255);
  }

  /**
   * Normalize country name
   * @private
   */
  _normalizeCountryName(country) {
    if (!country) return 'Unknown';
    return country.trim()
      .replace(/\s+/g, ' ')
      .substring(0, 100);
  }

  /**
   * Normalize season
   * @private
   */
  _normalizeSeason(season) {
    if (!season) return '';
    return season.trim().substring(0, 50);
  }

  /**
   * Normalize match status
   * @private
   */
  _normalizeStatus(status) {
    if (!status) return 'scheduled';
    
    const statusMap = {
      'live': 'live',
      'finished': 'finished',
      'ft': 'finished',
      'scheduled': 'scheduled',
      'postponed': 'postponed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled'
    };

    const normalized = status.toLowerCase().trim();
    return statusMap[normalized] || 'scheduled';
  }

  /**
   * Normalize score
   * @private
   */
  _normalizeScore(score) {
    if (!score) return '';
    
    // Extract numbers from score text
    const match = score.match(/(\d+)\s*[-:]\s*(\d+)/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    
    return '';
  }

  /**
   * Normalize event type
   * @private
   */
  _normalizeEventType(eventType) {
    if (!eventType) return 'other';
    
    const typeMap = {
      'goal': 'goal',
      'yellow': 'yellow_card',
      'yellow_card': 'yellow_card',
      'red': 'red_card',
      'red_card': 'red_card',
      'substitution': 'substitution',
      'sub': 'substitution',
      'penalty': 'penalty',
      'own_goal': 'own_goal',
      'var': 'var_decision',
      'var_decision': 'var_decision',
      'injury': 'injury'
    };

    const normalized = eventType.toLowerCase().trim();
    return typeMap[normalized] || 'other';
  }

  /**
   * Normalize minute
   * @private
   */
  _normalizeMinute(minute) {
    if (minute === null || minute === undefined) return null;
    const num = parseInt(minute);
    return (num >= 0 && num <= 120) ? num : null;
  }

  /**
   * Normalize player name
   * @private
   */
  _normalizePlayerName(name) {
    if (!name) return '';
    return name.trim()
      .replace(/\s+/g, ' ')
      .substring(0, 255);
  }

  /**
   * Normalize description
   * @private
   */
  _normalizeDescription(description) {
    if (!description) return '';
    return description.trim()
      .replace(/\s+/g, ' ')
      .substring(0, 1000);
  }

  /**
   * Validate parsed data structure
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validateData(data) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { isValid: false, errors };
    }

    // Add specific validation logic based on data type
    if (data.homeTeam !== undefined && data.awayTeam !== undefined) {
      // Match data validation
      if (!data.homeTeam || !data.awayTeam) {
        errors.push('Match must have both home and away teams');
      }
      if (data.homeTeam === data.awayTeam) {
        errors.push('Home and away teams cannot be the same');
      }
    }

    if (data.name !== undefined && data.country !== undefined) {
      // League data validation
      if (!data.name) {
        errors.push('League must have a name');
      }
      if (!data.country) {
        errors.push('League must have a country');
      }
    }

    if (data.eventType !== undefined && data.matchId !== undefined) {
      // Event data validation
      if (!data.eventType) {
        errors.push('Event must have a type');
      }
      if (!data.matchId) {
        errors.push('Event must be associated with a match');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = DataParser;