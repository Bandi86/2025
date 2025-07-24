const TaskManager = require('../TaskManager');
const TaskTypes = require('../TaskTypes');

// Mock Bull queue
jest.mock('bull', () => {
  return jest.fn().mockImplementation((name, options) => {
    const mockQueue = {
      name,
      options,
      jobs: new Map(),
      processors: new Map(),
      eventListeners: new Map(),
      
      add: jest.fn().mockImplementation(async (data, options = {}) => {
        const job = {
          id: `job_${Date.now()}_${Math.random()}`,
          data,
          options,
          timestamp: Date.now(),
          processedOn: null,
          finishedOn: null,
          attemptsMade: 0,
          failedReason: null,
          progress: jest.fn().mockReturnValue(0),
          getState: jest.fn().mockResolvedValue('waiting'),
          retry: jest.fn().mockResolvedValue()
        };
        mockQueue.jobs.set(job.id, job);
        return job;
      }),
      
      process: jest.fn().mockImplementation((concurrency, processor) => {
        if (typeof concurrency === 'function') {
          processor = concurrency;
          concurrency = 1;
        }
        mockQueue.processors.set('default', { processor, concurrency });
      }),
      
      getJob: jest.fn().mockImplementation(async (jobId) => {
        return mockQueue.jobs.get(jobId) || null;
      }),
      
      getWaiting: jest.fn().mockResolvedValue([]),
      getActive: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      getDelayed: jest.fn().mockResolvedValue([]),
      
      clean: jest.fn().mockResolvedValue(),
      pause: jest.fn().mockResolvedValue(),
      resume: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue(),
      
      on: jest.fn().mockImplementation((event, listener) => {
        if (!mockQueue.eventListeners.has(event)) {
          mockQueue.eventListeners.set(event, []);
        }
        mockQueue.eventListeners.get(event).push(listener);
      })
    };
    
    return mockQueue;
  });
});

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

describe('TaskManager', () => {
  let taskManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    taskManager = new TaskManager({
      host: 'localhost',
      port: 6379,
      db: 1
    });
  });
  
  afterEach(async () => {
    if (taskManager.isInitialized) {
      await taskManager.close();
    }
  });

  describe('initialization', () => {
    test('should initialize with default Redis config', () => {
      const defaultManager = new TaskManager();
      expect(defaultManager.redisConfig.host).toBe('localhost');
      expect(defaultManager.redisConfig.port).toBe(6379);
      expect(defaultManager.redisConfig.db).toBe(0);
    });

    test('should initialize with custom Redis config', () => {
      expect(taskManager.redisConfig.host).toBe('localhost');
      expect(taskManager.redisConfig.port).toBe(6379);
      expect(taskManager.redisConfig.db).toBe(1);
    });

    test('should initialize queues for all task types', async () => {
      await taskManager.initialize();
      
      expect(taskManager.isInitialized).toBe(true);
      expect(taskManager.queues.size).toBe(4);
      expect(taskManager.queues.has('live-matches')).toBe(true);
      expect(taskManager.queues.has('historical-data')).toBe(true);
      expect(taskManager.queues.has('upcoming-fixtures')).toBe(true);
      expect(taskManager.queues.has('league-discovery')).toBe(true);
    });

    test('should not reinitialize if already initialized', async () => {
      await taskManager.initialize();
      const queueCount = taskManager.queues.size;
      
      await taskManager.initialize();
      expect(taskManager.queues.size).toBe(queueCount);
    });
  });

  describe('task management', () => {
    beforeEach(async () => {
      await taskManager.initialize();
    });

    test('should add task to queue', async () => {
      const taskData = { url: 'https://example.com', matchId: '123' };
      const job = await taskManager.addTask(TaskTypes.LIVE_MATCHES, taskData);
      
      expect(job).toBeDefined();
      expect(job.data).toEqual(taskData);
      expect(job.id).toBeDefined();
    });

    test('should add task with custom options', async () => {
      const taskData = { url: 'https://example.com' };
      const options = { delay: 5000, priority: 200 };
      
      const job = await taskManager.addTask(TaskTypes.HISTORICAL_DATA, taskData, options);
      
      expect(job).toBeDefined();
      expect(job.data).toEqual(taskData);
    });

    test('should throw error for unknown task type', async () => {
      const taskData = { url: 'https://example.com' };
      
      await expect(
        taskManager.addTask('unknown-task', taskData)
      ).rejects.toThrow('Unknown task type: unknown-task');
    });

    test('should get task priority correctly', () => {
      expect(taskManager._getTaskPriority(TaskTypes.LIVE_MATCHES)).toBe(100);
      expect(taskManager._getTaskPriority(TaskTypes.UPCOMING_FIXTURES)).toBe(75);
      expect(taskManager._getTaskPriority(TaskTypes.HISTORICAL_DATA)).toBe(50);
      expect(taskManager._getTaskPriority(TaskTypes.LEAGUE_DISCOVERY)).toBe(25);
      expect(taskManager._getTaskPriority('unknown')).toBe(1);
    });
  });

  describe('processor registration', () => {
    beforeEach(async () => {
      await taskManager.initialize();
    });

    test('should register processor for task type', () => {
      const mockProcessor = jest.fn().mockResolvedValue('success');
      
      taskManager.registerProcessor(TaskTypes.LIVE_MATCHES, mockProcessor, 2);
      
      expect(taskManager.processors.has(TaskTypes.LIVE_MATCHES)).toBe(true);
      expect(taskManager.processors.get(TaskTypes.LIVE_MATCHES)).toBe(mockProcessor);
    });

    test('should throw error when registering processor for unknown queue', () => {
      const mockProcessor = jest.fn();
      
      expect(() => {
        taskManager.registerProcessor('unknown-task', mockProcessor);
      }).toThrow('Queue for task type unknown-task not found');
    });
  });

  describe('task status and monitoring', () => {
    beforeEach(async () => {
      await taskManager.initialize();
    });

    test('should get task status', async () => {
      const taskData = { url: 'https://example.com' };
      const job = await taskManager.addTask(TaskTypes.LIVE_MATCHES, taskData);
      
      const status = await taskManager.getTaskStatus(TaskTypes.LIVE_MATCHES, job.id);
      
      expect(status).toBeDefined();
      expect(status.id).toBe(job.id);
      expect(status.status).toBe('waiting');
      expect(status.data).toEqual(taskData);
    });

    test('should return not_found for non-existent job', async () => {
      const status = await taskManager.getTaskStatus(TaskTypes.LIVE_MATCHES, 'non-existent');
      
      expect(status.status).toBe('not_found');
    });

    test('should get queue statistics', async () => {
      const stats = await taskManager.getQueueStats(TaskTypes.LIVE_MATCHES);
      
      expect(stats).toBeDefined();
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.delayed).toBe('number');
      expect(typeof stats.total).toBe('number');
    });
  });

  describe('queue operations', () => {
    beforeEach(async () => {
      await taskManager.initialize();
    });

    test('should retry failed tasks', async () => {
      const retriedCount = await taskManager.retryFailedTasks(TaskTypes.LIVE_MATCHES, 5);
      
      expect(typeof retriedCount).toBe('number');
      expect(retriedCount).toBeGreaterThanOrEqual(0);
    });

    test('should clean queue', async () => {
      await expect(
        taskManager.cleanQueue(TaskTypes.LIVE_MATCHES, 1000)
      ).resolves.not.toThrow();
    });

    test('should pause and resume all queues', async () => {
      await expect(taskManager.pauseAll()).resolves.not.toThrow();
      await expect(taskManager.resumeAll()).resolves.not.toThrow();
    });

    test('should close all queues', async () => {
      await expect(taskManager.close()).resolves.not.toThrow();
      expect(taskManager.isInitialized).toBe(false);
      expect(taskManager.queues.size).toBe(0);
      expect(taskManager.processors.size).toBe(0);
    });
  });

  describe('error handling', () => {
    test('should handle initialization errors gracefully', async () => {
      // Mock Bull to throw error
      const Bull = require('bull');
      Bull.mockImplementationOnce(() => {
        throw new Error('Redis connection failed');
      });
      
      const errorManager = new TaskManager();
      await expect(errorManager.initialize()).rejects.toThrow('Redis connection failed');
    });

    test('should handle task addition errors', async () => {
      await taskManager.initialize();
      
      // Mock queue.add to throw error
      const queue = taskManager.queues.get(TaskTypes.LIVE_MATCHES);
      queue.add.mockRejectedValueOnce(new Error('Queue full'));
      
      await expect(
        taskManager.addTask(TaskTypes.LIVE_MATCHES, {})
      ).rejects.toThrow('Queue full');
    });
  });
});