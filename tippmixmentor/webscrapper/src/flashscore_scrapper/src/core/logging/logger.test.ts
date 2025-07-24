/**
 * Tests for the Logger implementation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as winston from 'winston';
import { Logger } from './logger.js';
import { LogLevel } from '../../types/core.js';
import type { LoggerConfig } from './interfaces.js';

describe('Logger', () => {
  let mockWinstonLogger: jest.Mocked<winston.Logger>;
  let logger: Logger;
  let config: LoggerConfig;

  beforeEach(() => {
    mockWinstonLogger = {
      log: jest.fn(),
      level: LogLevel.INFO,
      end: jest.fn()
    } as any;

    config = {
      level: LogLevel.INFO,
      format: {
        timestamp: true,
        level: true,
        message: true,
        meta: true,
        colorize: false,
        json: false,
        prettyPrint: false
      },
      transports: [],
      exitOnError: false,
      handleExceptions: false,
      handleRejections: false,
      defaultMeta: { service: 'test' }
    };

    logger = new Logger('test-logger', config, mockWinstonLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log methods', () => {
    it('should log debug messages', () => {
      const message = 'Debug message';
      const meta = { key: 'value' };

      logger.debug(message, meta);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        message,
        expect.objectContaining({
          service: 'test',
          key: 'value',
          logger: 'test-logger',
          timestamp: expect.any(String)
        })
      );
    });

    it('should log info messages', () => {
      const message = 'Info message';
      const meta = { key: 'value' };

      logger.info(message, meta);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        message,
        expect.objectContaining({
          service: 'test',
          key: 'value',
          logger: 'test-logger',
          timestamp: expect.any(String)
        })
      );
    });

    it('should log warning messages', () => {
      const message = 'Warning message';
      const meta = { key: 'value' };

      logger.warn(message, meta);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.WARN,
        message,
        expect.objectContaining({
          service: 'test',
          key: 'value',
          logger: 'test-logger',
          timestamp: expect.any(String)
        })
      );
    });

    it('should log error messages with error object', () => {
      const message = 'Error message';
      const error = new Error('Test error');
      const meta = { key: 'value' };

      logger.error(message, error, meta);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        message,
        expect.objectContaining({
          service: 'test',
          key: 'value',
          logger: 'test-logger',
          timestamp: expect.any(String),
          error: {
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String)
          }
        })
      );
    });

    it('should log error messages without error object', () => {
      const message = 'Error message';
      const meta = { key: 'value' };

      logger.error(message, undefined, meta);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        message,
        expect.objectContaining({
          service: 'test',
          key: 'value',
          logger: 'test-logger',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional metadata', () => {
      const childMeta = { childKey: 'childValue' };
      const childLogger = logger.child(childMeta);

      expect(childLogger).toBeInstanceOf(Logger);
      expect((childLogger as any).getName()).toBe('test-logger.child');

      childLogger.info('Child message');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Child message',
        expect.objectContaining({
          service: 'test',
          childKey: 'childValue',
          logger: 'test-logger.child',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('log level management', () => {
    it('should set log level', () => {
      logger.setLevel(LogLevel.DEBUG);
      expect(mockWinstonLogger.level).toBe(LogLevel.DEBUG);
    });

    it('should get log level', () => {
      mockWinstonLogger.level = LogLevel.WARN;
      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });
  });

  describe('metadata handling', () => {
    it('should merge default metadata with provided metadata', () => {
      const meta = { requestId: '123' };
      logger.info('Test message', meta);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Test message',
        expect.objectContaining({
          service: 'test',
          requestId: '123',
          logger: 'test-logger',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle empty metadata', () => {
      logger.info('Test message');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Test message',
        expect.objectContaining({
          service: 'test',
          logger: 'test-logger',
          timestamp: expect.any(String)
        })
      );
    });
  });
});