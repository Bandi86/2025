const logger = require('../utils/logger');

/**
 * DataValidator class for comprehensive data validation and deduplication
 * Implements data integrity checks and error reporting for scraped data
 */
class DataValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      enableDeduplication: true,
      maxValidationErrors: 10,
      ...options
    };
    this.logger = logger;
    this.seenMatches = new Set();
    this.seenEvents = new Set();
    this.seenLeagues = new Set();
  }

  /**
   * Validate match data with comprehensive checks
   * @param {Object} matchData - Match data to validate
   * @returns {Object} Validation result with errors and warnings
   */
  validateMatch(matchData) {
    const errors = [];
    const warnings = [];

    try {
      // Required field validation
      if (!matchData.homeTeam || typeof matchData.homeTeam !== 'string') {
        errors.push('Home team is required and must be a string');
      }
      
      if (!matchData.awayTeam || typeof matchData.awayTeam !== 'string') {
        errors.push('Away team is required and must be a string');
      }

      // Business logic validation
      if (matchData.homeTeam && matchData.awayTeam && matchData.homeTeam === matchData.awayTeam) {
        errors.push('Home and away teams cannot be the same');
      }

      // Match ID validation
      if (!matchData.matchId || typeof matchData.matchId !== 'string') {
        errors.push('Match ID is required and must be a string');
      }

      // Date validation
      if (matchData.matchDateTime) {
        const date = new Date(matchData.matchDateTime);
        if (isNaN(date.getTime())) {
          errors.push('Match date/time must be a valid date');
        } else {
          // Check for reasonable date range (not too far in past/future)
          const now = new Date();
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          const yearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
          
          if (date < yearAgo) {
            warnings.push('Match date is more than a year in the past');
          } else if (date > yearFromNow) {
            warnings.push('Match date is more than a year in the future');
          }
        }
      }

      // Status validation
      const validStatuses = ['scheduled', 'live', 'finished', 'postponed', 'cancelled', 'halftime'];
      if (matchData.status && !validStatuses.includes(matchData.status)) {
        warnings.push(`Unknown match status: ${matchData.status}`);
      }

      // Score validation
      if (matchData.finalScore) {
        if (!this._isValidScore(matchData.finalScore)) {
          warnings.push(`Invalid score format: ${matchData.finalScore}`);
        }
      }

      if (matchData.halfTimeScore) {
        if (!this._isValidScore(matchData.halfTimeScore)) {
          warnings.push(`Invalid half-time score format: ${matchData.halfTimeScore}`);
        }
      }

      // League ID validation
      if (!matchData.leagueId || typeof matchData.leagueId !== 'string') {
        warnings.push('League ID should be provided for proper categorization');
      }

      // URL validation
      if (matchData.flashscoreUrl && !this._isValidUrl(matchData.flashscoreUrl)) {
        warnings.push('Invalid Flashscore URL format');
      }

      // Team name length validation
      if (matchData.homeTeam && matchData.homeTeam.length > 255) {
        errors.push('Home team name exceeds maximum length (255 characters)');
      }
      
      if (matchData.awayTeam && matchData.awayTeam.length > 255) {
        errors.push('Away team name exceeds maximum length (255 characters)');
      }

      // Deduplication check
      if (this.options.enableDeduplication && matchData.matchId) {
        if (this.seenMatches.has(matchData.matchId)) {
          warnings.push(`Duplicate match detected: ${matchData.matchId}`);
        } else {
          this.seenMatches.add(matchData.matchId);
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      this.logger.error('Match validation error:', error);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataType: 'match'
    };
  }

  /**
   * Validate league data with comprehensive checks
   * @param {Object} leagueData - League data to validate
   * @returns {Object} Validation result with errors and warnings
   */
  validateLeague(leagueData) {
    const errors = [];
    const warnings = [];

    try {
      // Required field validation
      if (!leagueData.name || typeof leagueData.name !== 'string') {
        errors.push('League name is required and must be a string');
      }

      if (!leagueData.country || typeof leagueData.country !== 'string') {
        errors.push('League country is required and must be a string');
      }

      // League ID validation
      if (!leagueData.leagueId || typeof leagueData.leagueId !== 'string') {
        errors.push('League ID is required and must be a string');
      }

      // Length validation
      if (leagueData.name && leagueData.name.length > 255) {
        errors.push('League name exceeds maximum length (255 characters)');
      }

      if (leagueData.country && leagueData.country.length > 100) {
        errors.push('Country name exceeds maximum length (100 characters)');
      }

      if (leagueData.season && leagueData.season.length > 50) {
        errors.push('Season exceeds maximum length (50 characters)');
      }

      // Season format validation
      if (leagueData.season) {
        if (!this._isValidSeason(leagueData.season)) {
          warnings.push(`Unusual season format: ${leagueData.season}`);
        }
      }

      // URL validation
      if (leagueData.flashscoreUrl && !this._isValidUrl(leagueData.flashscoreUrl)) {
        warnings.push('Invalid Flashscore URL format');
      }

      // Country validation
      if (leagueData.country && !this._isValidCountry(leagueData.country)) {
        warnings.push(`Unusual country name: ${leagueData.country}`);
      }

      // Deduplication check
      if (this.options.enableDeduplication && leagueData.leagueId) {
        if (this.seenLeagues.has(leagueData.leagueId)) {
          warnings.push(`Duplicate league detected: ${leagueData.leagueId}`);
        } else {
          this.seenLeagues.add(leagueData.leagueId);
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      this.logger.error('League validation error:', error);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataType: 'league'
    };
  }

  /**
   * Validate match event data with comprehensive checks
   * @param {Object} eventData - Event data to validate
   * @returns {Object} Validation result with errors and warnings
   */
  validateEvent(eventData) {
    const errors = [];
    const warnings = [];

    try {
      // Required field validation
      if (!eventData.eventId || typeof eventData.eventId !== 'string') {
        errors.push('Event ID is required and must be a string');
      }

      if (!eventData.matchId || typeof eventData.matchId !== 'string') {
        errors.push('Match ID is required and must be a string');
      }

      if (!eventData.eventType || typeof eventData.eventType !== 'string') {
        errors.push('Event type is required and must be a string');
      }

      // Event type validation
      const validEventTypes = [
        'goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 
        'own_goal', 'var_decision', 'injury', 'other'
      ];
      
      if (eventData.eventType && !validEventTypes.includes(eventData.eventType)) {
        warnings.push(`Unknown event type: ${eventData.eventType}`);
      }

      // Minute validation
      if (eventData.minute !== null && eventData.minute !== undefined) {
        const minute = parseInt(eventData.minute);
        if (isNaN(minute) || minute < 0 || minute > 120) {
          errors.push('Event minute must be a number between 0 and 120');
        }
      }

      // Player name validation
      if (eventData.playerName && typeof eventData.playerName !== 'string') {
        errors.push('Player name must be a string');
      }

      if (eventData.playerName && eventData.playerName.length > 255) {
        errors.push('Player name exceeds maximum length (255 characters)');
      }

      // Description validation
      if (eventData.description && typeof eventData.description !== 'string') {
        errors.push('Event description must be a string');
      }

      if (eventData.description && eventData.description.length > 1000) {
        errors.push('Event description exceeds maximum length (1000 characters)');
      }

      // Timestamp validation
      if (eventData.timestamp) {
        const timestamp = new Date(eventData.timestamp);
        if (isNaN(timestamp.getTime())) {
          errors.push('Event timestamp must be a valid date');
        }
      }

      // Business logic validation
      if (eventData.eventType === 'goal' && !eventData.playerName) {
        warnings.push('Goal events should typically have a player name');
      }

      if (eventData.eventType === 'substitution' && !eventData.playerName) {
        warnings.push('Substitution events should typically have player information');
      }

      // Deduplication check
      if (this.options.enableDeduplication && eventData.eventId) {
        if (this.seenEvents.has(eventData.eventId)) {
          warnings.push(`Duplicate event detected: ${eventData.eventId}`);
        } else {
          this.seenEvents.add(eventData.eventId);
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      this.logger.error('Event validation error:', error);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataType: 'event'
    };
  }

  /**
   * Validate batch of data items
   * @param {Array} dataArray - Array of data items to validate
   * @param {string} dataType - Type of data (match, league, event)
   * @returns {Object} Batch validation result
   */
  validateBatch(dataArray, dataType) {
    if (!Array.isArray(dataArray)) {
      return {
        isValid: false,
        errors: ['Input must be an array'],
        warnings: [],
        results: []
      };
    }

    const results = [];
    const batchErrors = [];
    const batchWarnings = [];
    let validCount = 0;

    for (let i = 0; i < dataArray.length; i++) {
      try {
        let validationResult;
        
        switch (dataType) {
          case 'match':
            validationResult = this.validateMatch(dataArray[i]);
            break;
          case 'league':
            validationResult = this.validateLeague(dataArray[i]);
            break;
          case 'event':
            validationResult = this.validateEvent(dataArray[i]);
            break;
          default:
            validationResult = {
              isValid: false,
              errors: [`Unknown data type: ${dataType}`],
              warnings: []
            };
        }

        results.push({
          index: i,
          ...validationResult
        });

        if (validationResult.isValid) {
          validCount++;
        }

        // Collect batch-level errors and warnings
        batchErrors.push(...validationResult.errors);
        batchWarnings.push(...validationResult.warnings);

      } catch (error) {
        results.push({
          index: i,
          isValid: false,
          errors: [`Validation failed: ${error.message}`],
          warnings: []
        });
        this.logger.error(`Batch validation error at index ${i}:`, error);
      }
    }

    return {
      isValid: validCount === dataArray.length,
      totalItems: dataArray.length,
      validItems: validCount,
      invalidItems: dataArray.length - validCount,
      errors: [...new Set(batchErrors)], // Remove duplicates
      warnings: [...new Set(batchWarnings)], // Remove duplicates
      results
    };
  }

  /**
   * Check for duplicate data across different collections
   * @param {Object} data - Data to check for duplicates
   * @param {string} dataType - Type of data
   * @returns {Object} Duplicate check result
   */
  checkDuplicates(data, dataType) {
    const duplicates = [];
    
    try {
      switch (dataType) {
        case 'match':
          if (data.matchId && this.seenMatches.has(data.matchId)) {
            duplicates.push({
              type: 'match',
              id: data.matchId,
              field: 'matchId'
            });
          }
          break;
          
        case 'league':
          if (data.leagueId && this.seenLeagues.has(data.leagueId)) {
            duplicates.push({
              type: 'league',
              id: data.leagueId,
              field: 'leagueId'
            });
          }
          break;
          
        case 'event':
          if (data.eventId && this.seenEvents.has(data.eventId)) {
            duplicates.push({
              type: 'event',
              id: data.eventId,
              field: 'eventId'
            });
          }
          break;
      }
    } catch (error) {
      this.logger.error('Duplicate check error:', error);
    }

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates
    };
  }

  /**
   * Perform data integrity checks
   * @param {Object} data - Data to check
   * @param {string} dataType - Type of data
   * @returns {Object} Integrity check result
   */
  checkDataIntegrity(data, dataType) {
    const issues = [];
    
    try {
      switch (dataType) {
        case 'match':
          // Check for logical inconsistencies
          if (data.status === 'finished' && !data.finalScore) {
            issues.push('Finished match should have a final score');
          }
          
          if (data.status === 'live' && data.finalScore && !data.minute) {
            issues.push('Live match with score should have current minute');
          }
          
          if (data.halfTimeScore && data.finalScore) {
            const htGoals = this._extractGoalsFromScore(data.halfTimeScore);
            const ftGoals = this._extractGoalsFromScore(data.finalScore);
            
            if (htGoals && ftGoals) {
              if (htGoals.home > ftGoals.home || htGoals.away > ftGoals.away) {
                issues.push('Half-time score cannot be higher than full-time score');
              }
            }
          }
          break;
          
        case 'event':
          // Check for event timing issues
          if (data.minute > 90 && !data.description?.includes('extra') && !data.description?.includes('added')) {
            issues.push('Event after 90 minutes should indicate extra/added time');
          }
          
          if (data.eventType === 'red_card' && data.minute < 5) {
            issues.push('Very early red card - unusual but possible');
          }
          break;
      }
    } catch (error) {
      this.logger.error('Data integrity check error:', error);
      issues.push(`Integrity check failed: ${error.message}`);
    }

    return {
      hasIssues: issues.length > 0,
      issues
    };
  }

  /**
   * Reset deduplication tracking
   */
  resetDeduplication() {
    this.seenMatches.clear();
    this.seenEvents.clear();
    this.seenLeagues.clear();
  }

  /**
   * Get validation statistics
   * @returns {Object} Validation statistics
   */
  getValidationStats() {
    return {
      seenMatches: this.seenMatches.size,
      seenEvents: this.seenEvents.size,
      seenLeagues: this.seenLeagues.size,
      options: this.options
    };
  }

  // Private helper methods

  /**
   * Check if score format is valid
   * @private
   */
  _isValidScore(score) {
    if (!score || typeof score !== 'string') return false;
    return /^\d+-\d+$/.test(score.trim());
  }

  /**
   * Check if URL format is valid
   * @private
   */
  _isValidUrl(url) {
    try {
      new URL(url);
      return url.includes('flashscore') || url.includes('localhost') || url.includes('test');
    } catch {
      return false;
    }
  }

  /**
   * Check if season format is valid
   * @private
   */
  _isValidSeason(season) {
    if (!season) return false;
    // Common season formats: 2023/24, 2023-24, 2023, etc.
    return /^\d{4}([-\/]\d{2,4})?$/.test(season.trim());
  }

  /**
   * Check if country name is valid
   * @private
   */
  _isValidCountry(country) {
    if (!country) return false;
    // Basic check - should be alphabetic with possible spaces/hyphens
    return /^[a-zA-Z\s\-\.]+$/.test(country.trim()) && country.length >= 2;
  }

  /**
   * Extract goals from score string
   * @private
   */
  _extractGoalsFromScore(score) {
    if (!this._isValidScore(score)) return null;
    
    const parts = score.split('-');
    return {
      home: parseInt(parts[0]),
      away: parseInt(parts[1])
    };
  }
}

module.exports = DataValidator;