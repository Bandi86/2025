const TaskTypes = require('../TaskTypes');

describe('TaskTypes', () => {
  describe('constants', () => {
    test('should have correct task type constants', () => {
      expect(TaskTypes.LIVE_MATCHES).toBe('live-matches');
      expect(TaskTypes.HISTORICAL_DATA).toBe('historical-data');
      expect(TaskTypes.UPCOMING_FIXTURES).toBe('upcoming-fixtures');
      expect(TaskTypes.LEAGUE_DISCOVERY).toBe('league-discovery');
    });
  });

  describe('getAllTypes', () => {
    test('should return all task types', () => {
      const types = TaskTypes.getAllTypes();
      
      expect(types).toHaveLength(4);
      expect(types).toContain('live-matches');
      expect(types).toContain('historical-data');
      expect(types).toContain('upcoming-fixtures');
      expect(types).toContain('league-discovery');
    });
  });

  describe('isValidType', () => {
    test('should return true for valid task types', () => {
      expect(TaskTypes.isValidType(TaskTypes.LIVE_MATCHES)).toBe(true);
      expect(TaskTypes.isValidType(TaskTypes.HISTORICAL_DATA)).toBe(true);
      expect(TaskTypes.isValidType(TaskTypes.UPCOMING_FIXTURES)).toBe(true);
      expect(TaskTypes.isValidType(TaskTypes.LEAGUE_DISCOVERY)).toBe(true);
    });

    test('should return false for invalid task types', () => {
      expect(TaskTypes.isValidType('invalid-type')).toBe(false);
      expect(TaskTypes.isValidType('')).toBe(false);
      expect(TaskTypes.isValidType(null)).toBe(false);
      expect(TaskTypes.isValidType(undefined)).toBe(false);
    });
  });

  describe('getDescription', () => {
    test('should return correct descriptions for valid task types', () => {
      expect(TaskTypes.getDescription(TaskTypes.LIVE_MATCHES))
        .toBe('Real-time live match data collection');
      expect(TaskTypes.getDescription(TaskTypes.HISTORICAL_DATA))
        .toBe('Historical match results and statistics');
      expect(TaskTypes.getDescription(TaskTypes.UPCOMING_FIXTURES))
        .toBe('Future match schedules and fixtures');
      expect(TaskTypes.getDescription(TaskTypes.LEAGUE_DISCOVERY))
        .toBe('League and competition hierarchy discovery');
    });

    test('should return default description for invalid task types', () => {
      expect(TaskTypes.getDescription('invalid-type')).toBe('Unknown task type');
    });
  });

  describe('getDefaultConfig', () => {
    test('should return correct config for live matches', () => {
      const config = TaskTypes.getDefaultConfig(TaskTypes.LIVE_MATCHES);
      
      expect(config.priority).toBe(100);
      expect(config.attempts).toBe(5);
      expect(config.backoff.type).toBe('exponential');
      expect(config.backoff.delay).toBe(1000);
      expect(config.removeOnComplete).toBe(20);
      expect(config.removeOnFail).toBe(50);
    });

    test('should return correct config for historical data', () => {
      const config = TaskTypes.getDefaultConfig(TaskTypes.HISTORICAL_DATA);
      
      expect(config.priority).toBe(50);
      expect(config.attempts).toBe(3);
      expect(config.backoff.type).toBe('exponential');
      expect(config.backoff.delay).toBe(2000);
      expect(config.removeOnComplete).toBe(100);
      expect(config.removeOnFail).toBe(50);
    });

    test('should return correct config for upcoming fixtures', () => {
      const config = TaskTypes.getDefaultConfig(TaskTypes.UPCOMING_FIXTURES);
      
      expect(config.priority).toBe(75);
      expect(config.attempts).toBe(3);
      expect(config.backoff.type).toBe('exponential');
      expect(config.backoff.delay).toBe(1500);
      expect(config.removeOnComplete).toBe(50);
      expect(config.removeOnFail).toBe(30);
    });

    test('should return correct config for league discovery', () => {
      const config = TaskTypes.getDefaultConfig(TaskTypes.LEAGUE_DISCOVERY);
      
      expect(config.priority).toBe(25);
      expect(config.attempts).toBe(2);
      expect(config.backoff.type).toBe('exponential');
      expect(config.backoff.delay).toBe(3000);
      expect(config.removeOnComplete).toBe(10);
      expect(config.removeOnFail).toBe(20);
    });

    test('should return default config for unknown task types', () => {
      const config = TaskTypes.getDefaultConfig('unknown-type');
      
      expect(config.priority).toBe(1);
      expect(config.attempts).toBe(3);
      expect(config.backoff.type).toBe('exponential');
      expect(config.backoff.delay).toBe(2000);
      expect(config.removeOnComplete).toBe(50);
      expect(config.removeOnFail).toBe(50);
    });
  });

  describe('configuration consistency', () => {
    test('should have higher priority for more time-sensitive tasks', () => {
      const liveConfig = TaskTypes.getDefaultConfig(TaskTypes.LIVE_MATCHES);
      const upcomingConfig = TaskTypes.getDefaultConfig(TaskTypes.UPCOMING_FIXTURES);
      const historicalConfig = TaskTypes.getDefaultConfig(TaskTypes.HISTORICAL_DATA);
      const discoveryConfig = TaskTypes.getDefaultConfig(TaskTypes.LEAGUE_DISCOVERY);
      
      expect(liveConfig.priority).toBeGreaterThan(upcomingConfig.priority);
      expect(upcomingConfig.priority).toBeGreaterThan(historicalConfig.priority);
      expect(historicalConfig.priority).toBeGreaterThan(discoveryConfig.priority);
    });

    test('should have more attempts for critical tasks', () => {
      const liveConfig = TaskTypes.getDefaultConfig(TaskTypes.LIVE_MATCHES);
      const discoveryConfig = TaskTypes.getDefaultConfig(TaskTypes.LEAGUE_DISCOVERY);
      
      expect(liveConfig.attempts).toBeGreaterThan(discoveryConfig.attempts);
    });

    test('should have shorter delays for time-sensitive tasks', () => {
      const liveConfig = TaskTypes.getDefaultConfig(TaskTypes.LIVE_MATCHES);
      const discoveryConfig = TaskTypes.getDefaultConfig(TaskTypes.LEAGUE_DISCOVERY);
      
      expect(liveConfig.backoff.delay).toBeLessThan(discoveryConfig.backoff.delay);
    });
  });
});