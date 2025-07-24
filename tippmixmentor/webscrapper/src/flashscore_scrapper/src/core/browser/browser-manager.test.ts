/**
 * Unit tests for BrowserManager
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Browser, Page, BrowserContext } from 'playwright';
import { BrowserManager } from './browser-manager.js';
import { Logger } from '../logging/index.js';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  }
}));

// Mock Logger
jest.mock('../logging/index.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

describe('BrowserManager', () => {
  let browserManager: BrowserManager;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;
  let mockContext: jest.Mocked<BrowserContext>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Setup mocks
    mockPage = {
      close: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      setDefaultTimeout: jest.fn(),
      setViewportSize: jest.fn(),
      on: jest.fn(),
      url: jest.fn().mockReturnValue('about:blank')
    } as any;

    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
      pages: jest.fn().mockReturnValue([mockPage])
    } as any;

    mockBrowser = {
      isConnected: jest.fn().mockReturnValue(true),
      newContext: jest.fn().mockResolvedValue(mockContext),
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
      on: jest.fn(),
      contexts: jest.fn().mockReturnValue([mockContext])
    } as any;

    mockLogger = new Logger('test') as jest.Mocked<Logger>;

    // Mock chromium.launch
    const { chromium } = require('playwright');
    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

    browserManager = new BrowserManager({}, mockLogger);
  });

  afterEach(async () => {
    await browserManager.cleanup();
    jest.clearAllMocks();
  });

  describe('launch', () => {
    it('should launch browser successfully', async () => {
      const browser = await browserManager.launch();

      expect(browser).toBe(mockBrowser);
      expect(mockLogger.info).toHaveBeenCalledWith('Launching browser with options:', expect.any(Object));
      expect(mockLogger.info).toHaveBeenCalledWith('Browser launched successfully');
    });

    it('should return existing browser if already launched', async () => {
      await browserManager.launch();
      const browser2 = await browserManager.launch();

      expect(browser2).toBe(mockBrowser);
      expect(mockLogger.debug).toHaveBeenCalledWith('Browser already launched and connected');
    });

    it('should handle launch errors', async () => {
      const error = new Error('Launch failed');
      const { chromium } = require('playwright');
      (chromium.launch as jest.Mock).mockRejectedValueOnce(error);

      await expect(browserManager.launch()).rejects.toThrow('Launch failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to launch browser:', error);
    });

    it('should prevent concurrent launches', async () => {
      const launchPromise1 = browserManager.launch();
      const launchPromise2 = browserManager.launch();

      const [browser1, browser2] = await Promise.all([launchPromise1, launchPromise2]);

      expect(browser1).toBe(mockBrowser);
      expect(browser2).toBe(mockBrowser);
      expect(mockLogger.warn).toHaveBeenCalledWith('Browser launch already in progress, waiting...');
    });
  });

  describe('createPage', () => {
    beforeEach(async () => {
      await browserManager.launch();
    });

    it('should create page successfully', async () => {
      const page = await browserManager.createPage();

      expect(page).toBe(mockPage);
      expect(mockContext.newPage).toHaveBeenCalled();
      expect(mockPage.setDefaultTimeout).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Page created'));
    });

    it('should throw error if no browser available', async () => {
      const browserManager2 = new BrowserManager({}, mockLogger);

      await expect(browserManager2.createPage()).rejects.toThrow('No browser instance available');
    });

    it('should handle page creation errors', async () => {
      const error = new Error('Page creation failed');
      mockContext.newPage.mockRejectedValueOnce(error);

      await expect(browserManager.createPage()).rejects.toThrow('Page creation failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create page:', error);
    });
  });

  describe('createContext', () => {
    beforeEach(async () => {
      await browserManager.launch();
    });

    it('should create context with user agent rotation', async () => {
      const context = await browserManager.createContext(mockBrowser);

      expect(context).toBe(mockContext);
      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: expect.any(String),
          viewport: expect.any(Object),
          locale: 'en-US',
          timezone: 'UTC'
        })
      );
    });

    it('should handle context creation errors', async () => {
      const error = new Error('Context creation failed');
      mockBrowser.newContext.mockRejectedValueOnce(error);

      await expect(browserManager.createContext(mockBrowser)).rejects.toThrow('Context creation failed');
    });
  });

  describe('closePage', () => {
    let page: Page;

    beforeEach(async () => {
      await browserManager.launch();
      page = await browserManager.createPage();
    });

    it('should close page successfully', async () => {
      await browserManager.closePage(page);

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Page closed'));
    });

    it('should handle already closed pages', async () => {
      mockPage.isClosed.mockReturnValue(true);

      await browserManager.closePage(page);

      expect(mockPage.close).not.toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const error = new Error('Close failed');
      mockPage.close.mockRejectedValueOnce(error);

      await browserManager.closePage(page);

      expect(mockLogger.error).toHaveBeenCalledWith('Error closing page:', error);
    });
  });

  describe('isHealthy', () => {
    beforeEach(async () => {
      await browserManager.launch();
    });

    it('should return true for healthy browser', async () => {
      const isHealthy = await browserManager.isHealthy();

      expect(isHealthy).toBe(true);
      expect(mockBrowser.newPage).toHaveBeenCalled();
    });

    it('should return false for disconnected browser', async () => {
      mockBrowser.isConnected.mockReturnValue(false);

      const isHealthy = await browserManager.isHealthy();

      expect(isHealthy).toBe(false);
    });

    it('should return false if no browser', async () => {
      const browserManager2 = new BrowserManager({}, mockLogger);

      const isHealthy = await browserManager2.isHealthy();

      expect(isHealthy).toBe(false);
    });

    it('should handle health check errors', async () => {
      const error = new Error('Health check failed');
      mockBrowser.newPage.mockRejectedValueOnce(error);

      const isHealthy = await browserManager.isHealthy();

      expect(isHealthy).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Browser health check failed:', error);
    });
  });

  describe('restart', () => {
    beforeEach(async () => {
      await browserManager.launch();
    });

    it('should restart browser successfully', async () => {
      const newBrowser = await browserManager.restart();

      expect(newBrowser).toBe(mockBrowser);
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Restarting browser...');
      expect(mockLogger.info).toHaveBeenCalledWith('Browser restarted successfully');
    });

    it('should handle restart errors', async () => {
      const error = new Error('Restart failed');
      const { chromium } = require('playwright');
      (chromium.launch as jest.Mock).mockRejectedValueOnce(error);

      await expect(browserManager.restart()).rejects.toThrow('Restart failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to restart browser:', error);
    });
  });

  describe('getHealth', () => {
    it('should return health metrics for active browser', async () => {
      await browserManager.launch();

      const health = await browserManager.getHealth();

      expect(health).toEqual({
        isResponsive: true,
        memoryUsage: expect.any(Number),
        pageCount: 1,
        uptime: expect.any(Number),
        lastActivity: expect.any(Date)
      });
    });

    it('should return default health for no browser', async () => {
      const health = await browserManager.getHealth();

      expect(health).toEqual({
        isResponsive: false,
        memoryUsage: 0,
        pageCount: 0,
        uptime: 0,
        lastActivity: expect.any(Date)
      });
    });
  });

  describe('getMetrics', () => {
    it('should return browser metrics', () => {
      const metrics = browserManager.getMetrics();

      expect(metrics).toEqual({
        pagesCreated: expect.any(Number),
        pagesDestroyed: expect.any(Number),
        requestsHandled: expect.any(Number),
        errorsEncountered: expect.any(Number),
        averageResponseTime: expect.any(Number),
        memoryPeakUsage: expect.any(Number)
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      await browserManager.launch();
      await browserManager.cleanup();

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    it('should emit browser events', async () => {
      const eventSpy = jest.fn();
      browserManager.on('browserEvent', eventSpy);

      await browserManager.launch();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'launched',
          timestamp: expect.any(Date)
        })
      );
    });
  });
});