const BaseProcessor = require('../BaseProcessor');

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

describe('BaseProcessor', () => {
  let processor;
  let mockDependencies;

  beforeEach(() => {
    mockDependencies = {
      scrapingEngine: {
        initializeBrowser: jest.fn(),
        navigateToPage: jest.fn(),
        extractData: jest.fn()
      },
      dataParser: {
        parseMatchData: jest.fn()
      },
      databaseService: {
        createMatch: jest.fn(),
        updateMatch: jest.fn()
      }
    };

    processor = new BaseProcessor(mockDependencies);
  });

  describe('constructor', () => {
    test('should initialize with dependencies', () => {
      expect(processor.scrapingEngine).toBe(mockDependencies.scrapingEngine);
      expect(processor.dataParser).toBe(mockDependencies.dataParser);
      expect(processor.databaseService).toBe(mockDependencies.databaseService);
      expect(processor.logger).toBeDefined();
    });

    test('should initialize with empty dependencies', () => {
      const emptyProcessor = new BaseProcessor();
      expect(emptyProcessor.scrapingEngine).toBeUndefined();
      expect(emptyProcessor.dataParser).toBeUndefined();
      expect(emptyProcessor.databaseService).toBeUndefined();
    });
  });

  describe('process method', () => {
    test('should throw error when not implemented', async () => {
      await expect(processor.process({}, {})).rejects.toThrow('Process method must be implemented by subclass');
    });
  });

  describe('updateProgress', () => {
    test('should update job progress', () => {
      const mockJob = {
        id: 'job_123',
        progress: jest.fn()
      };

      processor.updateProgress(mockJob, 50, 'Processing...');

      expect(mockJob.progress).toHaveBeenCalledWith(50, 'Processing...');
    });

    test('should handle job without progress method', () => {
      const mockJob = { id: 'job_123' };

      expect(() => {
        processor.updateProgress(mockJob, 50, 'Processing...');
      }).not.toThrow();
    });

    test('should handle null job', () => {
      expect(() => {
        processor.updateProgress(null, 50, 'Processing...');
      }).not.toThrow();
    });
  });

  describe('validateJobData', () => {
    test('should validate correct job data', () => {
      const validJobData = {
        taskType: 'live-matches',
        dataType: 'live'
      };

      expect(processor.validateJobData(validJobData)).toBe(true);
    });

    test('should throw error for null job data', () => {
      expect(() => {
        processor.validateJobData(null);
      }).toThrow('Invalid job data: must be an object');
    });

    test('should throw error for non-object job data', () => {
      expect(() => {
        processor.validateJobData('invalid');
      }).toThrow('Invalid job data: must be an object');
    });

    test('should throw error for job data without taskType', () => {
      expect(() => {
        processor.validateJobData({ dataType: 'live' });
      }).toThrow('Invalid job data: taskType is required');
    });
  });

  describe('getTimeout', () => {
    test('should return job data timeout', () => {
      const jobData = { timeout: 30000 };
      expect(processor.getTimeout(jobData)).toBe(30000);
    });

    test('should return default timeout', () => {
      const jobData = {};
      expect(processor.getTimeout(jobData)).toBe(60000);
    });
  });

  describe('shouldAbort', () => {
    test('should return false for normal job', () => {
      const mockJob = {
        opts: { removeOnComplete: true, removeOnFail: true }
      };

      expect(processor.shouldAbort(mockJob)).toBe(false);
    });

    test('should return false for null job', () => {
      expect(processor.shouldAbort(null)).toBe(false);
    });
  });

  describe('handleError', () => {
    test('should log error and re-throw', () => {
      const error = new Error('Test error');
      const jobData = { taskType: 'test' };
      const job = { id: 'job_123' };

      expect(() => {
        processor.handleError(error, jobData, job);
      }).toThrow('Test error');
    });
  });

  describe('logging methods', () => {
    test('should log start', () => {
      const jobData = { taskType: 'test', dataType: 'live' };
      const job = { id: 'job_123' };

      expect(() => {
        processor.logStart(jobData, job);
      }).not.toThrow();
    });

    test('should log completion', () => {
      const result = { success: true, itemsProcessed: 5 };
      const jobData = { taskType: 'test' };
      const job = { id: 'job_123' };

      expect(() => {
        processor.logCompletion(result, jobData, job);
      }).not.toThrow();
    });
  });
});