/**
 * Tests for the PerformanceLogger implementation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PerformanceLogger } from './performance-logger.js';
import { LogLevel } from '../../types/core.js';
import type { ILogger } from './interfaces.js';

describe('PerformanceLogger', () => {
  let mockLogger: jest.Mocked<ILogger>;
  let performanceLogger: PerformanceLogger;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      child: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn()
    };

    performanceLogger = new PerformanceLogger(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('timer operations', () => {
    it('should start and end a timer', async () => {
      const operation = 'test-operation';
      const timer = performanceLogger.startTimer(operation);

      expect(timer).toEqual({
        id: expect.any(String),
        operation,
        startTime: expect.any(Date),
        meta: { operation }
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Started timer for operation: ${operation}`,
        expect.objectContaining({
          timerId: timer.id,
          operation,
          startTime: expect.any(String)
        })
      );

      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 10));

      performanceLogger.endTimer(timer);

      expect(mockLogger.log).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        `Operation completed: ${operation}`,
        expect.objectContaining({
          operation,
          duration: expect.any(Number),
          durationMs: expect.any(Number),
          durationFormatted: expect.any(String),
          timerId: timer.id
        })
      );
    });

    it('should handle timer with additional metadata', () => {
      const operation = 'test-operation';
      const meta = { userId: '123', requestId: 'req-456' };
      
      const timer = performanceLogger.startTimer(operation, meta);

      expect(timer.meta).toEqual({
        operation,
        userId: '123',
        requestId: 'req-456'
      });

      performanceLogger.endTimer(timer);

      expect(mockLogger.log).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        `Operation completed: ${operation}`,
        expect.objectContaining({
          operation,
          userId: '123',
          requestId: 'req-456',
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('duration logging', () => {
    it('should log short durations as debug', () => {
      performanceLogger.logDuration('fast-operation', 500);

      expect(mockLogger.log).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        'Operation completed: fast-operation',
        expect.objectContaining({
          operation: 'fast-operation',
          duration: 500,
          durationMs: 500,
          durationFormatted: '500ms'
        })
      );
    });

    it('should log medium durations as info', () => {
      performanceLogger.logDuration('medium-operation', 15000);

      expect(mockLogger.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Operation completed: medium-operation',
        expect.objectContaining({
          operation: 'medium-operation',
          duration: 15000,
          durationMs: 15000,
          durationFormatted: '15.00s'
        })
      );
    });

    it('should log long durations as warning', () => {
      performanceLogger.logDuration('slow-operation', 45000);

      expect(mockLogger.log).toHaveBeenCalledWith(
        LogLevel.WARN,
        'Operation completed: slow-operation',
        expect.objectContaining({
          operation: 'slow-operation',
          duration: 45000,
          durationMs: 45000,
          durationFormatted: '45.00s'
        })
      );
    });
  });

  describe('memory usage logging', () => {
    it('should log memory usage', () => {
      const operation = 'memory-test';
      
      performanceLogger.logMemoryUsage(operation);

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Memory usage for ${operation}`,
        expect.objectContaining({
          operation,
          memoryUsage: expect.any(Number),
          memoryUsageMB: expect.any(Number),
          memoryDetails: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
            external: expect.any(Number)
          })
        })
      );
    });
  });

  describe('system metrics logging', () => {
    it('should log system metrics', () => {
      performanceLogger.logSystemMetrics();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'System metrics',
        expect.objectContaining({
          systemMetrics: expect.objectContaining({
            memoryUsage: expect.any(Object),
            cpuUsage: expect.any(Object),
            uptime: expect.any(Number),
            loadAverage: expect.any(Array)
          }),
          memoryUsageMB: expect.any(Number),
          uptimeFormatted: expect.any(String)
        })
      );
    });
  });

  describe('active timer management', () => {
    it('should track active timers', () => {
      const timer1 = performanceLogger.startTimer('op1');
      const timer2 = performanceLogger.startTimer('op2');

      const activeTimers = performanceLogger.getActiveTimers();
      expect(activeTimers).toHaveLength(2);
      expect(activeTimers).toContain(timer1);
      expect(activeTimers).toContain(timer2);

      performanceLogger.endTimer(timer1);

      const remainingTimers = performanceLogger.getActiveTimers();
      expect(remainingTimers).toHaveLength(1);
      expect(remainingTimers).toContain(timer2);
    });

    it('should clear all active timers', () => {
      performanceLogger.startTimer('op1');
      performanceLogger.startTimer('op2');

      expect(performanceLogger.getActiveTimers()).toHaveLength(2);

      performanceLogger.clearActiveTimers();

      expect(performanceLogger.getActiveTimers()).toHaveLength(0);
    });
  });

  describe('child logger', () => {
    it('should create child performance logger', () => {
      const childMeta = { component: 'scraper' };
      mockLogger.child.mockReturnValue(mockLogger);

      const childPerformanceLogger = performanceLogger.child(childMeta);

      expect(mockLogger.child).toHaveBeenCalledWith(childMeta);
      expect(childPerformanceLogger).toBeInstanceOf(PerformanceLogger);
    });
  });
});