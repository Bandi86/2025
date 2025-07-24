/**
 * Task type constants for different scraping operations
 */
class TaskTypes {
  // Live match data collection - highest priority
  static LIVE_MATCHES = 'live-matches';
  
  // Historical match data collection
  static HISTORICAL_DATA = 'historical-data';
  
  // Upcoming fixtures collection
  static UPCOMING_FIXTURES = 'upcoming-fixtures';
  
  // League discovery and hierarchy mapping
  static LEAGUE_DISCOVERY = 'league-discovery';

  /**
   * Get all available task types
   * @returns {string[]} Array of task type strings
   */
  static getAllTypes() {
    return [
      this.LIVE_MATCHES,
      this.HISTORICAL_DATA,
      this.UPCOMING_FIXTURES,
      this.LEAGUE_DISCOVERY
    ];
  }

  /**
   * Check if a task type is valid
   * @param {string} taskType - Task type to validate
   * @returns {boolean} True if valid task type
   */
  static isValidType(taskType) {
    return this.getAllTypes().includes(taskType);
  }

  /**
   * Get task type description
   * @param {string} taskType - Task type
   * @returns {string} Human-readable description
   */
  static getDescription(taskType) {
    const descriptions = {
      [this.LIVE_MATCHES]: 'Real-time live match data collection',
      [this.HISTORICAL_DATA]: 'Historical match results and statistics',
      [this.UPCOMING_FIXTURES]: 'Future match schedules and fixtures',
      [this.LEAGUE_DISCOVERY]: 'League and competition hierarchy discovery'
    };

    return descriptions[taskType] || 'Unknown task type';
  }

  /**
   * Get default configuration for task type
   * @param {string} taskType - Task type
   * @returns {Object} Default configuration
   */
  static getDefaultConfig(taskType) {
    const configs = {
      [this.LIVE_MATCHES]: {
        priority: 100,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 20,
        removeOnFail: 50
      },
      [this.HISTORICAL_DATA]: {
        priority: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50
      },
      [this.UPCOMING_FIXTURES]: {
        priority: 75,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1500 },
        removeOnComplete: 50,
        removeOnFail: 30
      },
      [this.LEAGUE_DISCOVERY]: {
        priority: 25,
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 10,
        removeOnFail: 20
      }
    };

    return configs[taskType] || {
      priority: 1,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 50,
      removeOnFail: 50
    };
  }
}

module.exports = TaskTypes;