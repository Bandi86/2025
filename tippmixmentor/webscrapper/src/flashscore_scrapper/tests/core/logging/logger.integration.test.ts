import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { LoggerFactory } from '../../../src/core/logging/logger-factory';
import { LogLevel } from '../../../src/types/core';
import { TransportType } from '../../../src/types/logging';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('Logger Integration', () => {
  let tempDir: string;
  let logFilePath: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'logger-int-test-'));
    logFilePath = path.join(tempDir, 'test.log');
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create a logger that writes to console and file', async () => {
    const factory = new LoggerFactory({
      level: LogLevel.INFO,
      transports: [
        { type: TransportType.CONSOLE, level: LogLevel.INFO, options: {} },
        { type: TransportType.FILE, level: LogLevel.DEBUG, options: { filename: logFilePath } },
      ],
    });

    const logger = factory.createLogger('test-integration');
    logger.info('This is an info message.');
    logger.debug('This is a debug message.');

    // Shutdown the logger to ensure logs are flushed
    await factory.shutdown();

    const logContent = await fs.readFile(logFilePath, 'utf-8');
    expect(logContent).toContain('This is an info message.');
    expect(logContent).toContain('This is a debug message.');
  });
});