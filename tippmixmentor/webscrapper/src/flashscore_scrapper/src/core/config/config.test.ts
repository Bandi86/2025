/**
 * Tests for the configuration system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigManager, validateConfig, createTestConfig, DEFAULT_CONFIG } from './index.js';

describe('Configuration System', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    ConfigManager.reset();
    configManager = ConfigManager.getInstance();
  });

  afterEach(() => {
    ConfigManager.reset();
  });

  describe('ConfigManager', () => {
    it('should be a singleton', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should throw error when accessing config before initialization', () => {
      expect(() => configManager.getConfig()).toThrow('Configuration not loaded');
    });

    it('should initialize with test config', async () => {
      // Set test environment
      process.env.NODE_ENV = 'test';
      
      await configManager.initialize();
      const config = configManager.getConfig();
      
      expect(config).toBeDefined();
      expect(config.environment.NODE_ENV).toBe('test');
    });

    it('should provide section getters', async () => {
      process.env.NODE_ENV = 'test';
      await configManager.initialize();
      
      expect(configManager.getEnvironment()).toBeDefined();
      expect(configManager.getScraping()).toBeDefined();
      expect(configManager.getCache()).toBeDefined();
      expect(configManager.getExport()).toBeDefined();
      expect(configManager.getLogging()).toBeDefined();
      expect(configManager.getBrowser()).toBeDefined();
      expect(configManager.getRateLimit()).toBeDefined();
    });

    it('should provide environment checks', async () => {
      process.env.NODE_ENV = 'test';
      await configManager.initialize();
      
      expect(configManager.isTest()).toBe(true);
      expect(configManager.isDevelopment()).toBe(false);
      expect(configManager.isProduction()).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate default configuration', () => {
      const result = validateConfig(DEFAULT_CONFIG);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate test configuration', () => {
      const testConfig = createTestConfig();
      const result = validateConfig(testConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const invalidConfig = createTestConfig({
        scraping: {
          ...createTestConfig().scraping,
          timeout: -1 // Invalid timeout
        }
      });
      
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing required fields', () => {
      const incompleteConfig = {
        ...createTestConfig(),
        environment: {
          ...createTestConfig().environment,
          NODE_ENV: undefined as any
        }
      };
      
      const result = validateConfig(incompleteConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'environment.NODE_ENV')).toBe(true);
    });
  });

  describe('Test Configuration Helper', () => {
    it('should create valid test configuration', () => {
      const testConfig = createTestConfig();
      
      expect(testConfig.environment.NODE_ENV).toBe('test');
      expect(testConfig.cache.enabled).toBe(false);
      expect(testConfig.rateLimit.enabled).toBe(false);
      
      const validation = validateConfig(testConfig);
      expect(validation.isValid).toBe(true);
    });

    it('should merge overrides correctly', () => {
      const testConfig = createTestConfig({
        scraping: {
          timeout: 10000
        }
      });
      
      expect(testConfig.scraping.timeout).toBe(10000);
      expect(testConfig.scraping.baseUrl).toBe('https://www.flashscore.com'); // Should keep default
    });
  });
});