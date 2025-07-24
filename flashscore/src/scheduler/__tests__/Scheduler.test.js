const Scheduler = require('../Scheduler');
const TaskTypes = require('../../queue/TaskTypes');

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockImplementation((schedule, callback, options) => {
    return {
      start: jest.fn(),
      stop: jest.fn(),
      schedule,
      callback,
      options
    };
  }),
  validate: jest.fn().mockImplementation((schedule) => {
    // Simple validation - check if it has 5 parts (minute hour day month dayOfWeek)
    const parts = schedule.split(' ');
    return parts.length === 5;
  })
}));

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

describe('Scheduler', () => {
  let scheduler;
  let mockTaskManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock TaskManager
    mockTaskManager = {
      addTask: jest.fn().mockResolvedValue({ id: 'job_123' }),
      getQueueStats: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 1,
        completed: 5,
        failed: 0,
        delayed: 0,
        total: 6
      })
    };

    scheduler = new Scheduler(mockTaskManager, {
      timezone: 'UTC',
      maxConcurrentTasks: 5,
      systemLoadThreshold: 0.8
    });
  });

  afterEach(async () => {
    if (scheduler.isRunning) {
      await scheduler.stop();
    }
  });

  describe('initialization', () => {
    test('should initialize with default config', () => {
      const defaultScheduler = new Scheduler(mockTaskManager);
      
      expect(defaultScheduler.config.timezone).toBe('UTC');
      expect(defaultScheduler.config.maxConcurrentTasks).toBe(5);
      expect(defaultScheduler.config.systemLoadThreshold).toBe(0.8);
    });

    test('should initialize with custom config', () => {
      expect(scheduler.config.timezone).toBe('UTC');
      expect(scheduler.config.maxConcurrentTasks).toBe(5);
      expect(scheduler.config.systemLoadThreshold).toBe(0.8);
    });

    test('should initialize task statistics', async () => {
      await scheduler.initialize();
      
      expect(scheduler.isRunning).toBe(true);
      expect(scheduler.taskStats.size).toBe(4);
      
      for (const taskType of TaskTypes.getAllTypes()) {
        expect(scheduler.taskStats.has(taskType)).toBe(true);
        const stats = scheduler.taskStats.get(taskType);
        expect(stats.totalRuns).toBe(0);
        expect(stats.successfulRuns).toBe(0);
        expect(stats.failedRuns).toBe(0);
      }
    });

    test('should not reinitialize if already running', async () => {
      await scheduler.initialize();
      const statsSize = scheduler.taskStats.size;
      
      await scheduler.initialize();
      expect(scheduler.taskStats.size).toBe(statsSize);
    });
  });

  describe('default schedules', () => {
    test('should have correct default schedules', () => {
      expect(scheduler.defaultSchedules[TaskTypes.LIVE_MATCHES].schedule).toBe('*/1 * * * *');
      expect(scheduler.defaultSchedules[TaskTypes.UPCOMING_FIXTURES].schedule).toBe('0 */3 * * *');
      expect(scheduler.defaultSchedules[TaskTypes.HISTORICAL_DATA].schedule).toBe('0 2 * * *');
      expect(scheduler.defaultSchedules[TaskTypes.LEAGUE_DISCOVERY].schedule).toBe('0 0 * * 0');
    });

    test('should have correct priorities', () => {
      expect(scheduler.defaultSchedules[TaskTypes.LIVE_MATCHES].priority).toBe(100);
      expect(scheduler.defaultSchedules[TaskTypes.UPCOMING_FIXTURES].priority).toBe(75);
      expect(scheduler.defaultSchedules[TaskTypes.HISTORICAL_DATA].priority).toBe(50);
      expect(scheduler.defaultSchedules[TaskTypes.LEAGUE_DISCOVERY].priority).toBe(25);
    });

    test('should have appropriate concurrency limits', () => {
      expect(scheduler.defaultSchedules[TaskTypes.LIVE_MATCHES].maxConcurrency).toBe(3);
      expect(scheduler.defaultSchedules[TaskTypes.UPCOMING_FIXTURES].maxConcurrency).toBe(2);
      expect(scheduler.defaultSchedules[TaskTypes.HISTORICAL_DATA].maxConcurrency).toBe(1);
      expect(scheduler.defaultSchedules[TaskTypes.LEAGUE_DISCOVERY].maxConcurrency).toBe(1);
    });
  });

  describe('task scheduling', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    test('should schedule a task', async () => {
      const cron = require('node-cron');
      
      await scheduler.scheduleTask(TaskTypes.LIVE_MATCHES, {});
      
      expect(cron.schedule).toHaveBeenCalled();
      expect(scheduler.scheduledTasks.has(TaskTypes.LIVE_MATCHES)).toBe(true);
      
      const scheduledTask = scheduler.scheduledTasks.get(TaskTypes.LIVE_MATCHES);
      expect(scheduledTask.cronJob.start).toHaveBeenCalled();
    });

    test('should throw error for invalid task type', async () => {
      await expect(
        scheduler.scheduleTask('invalid-task', {})
      ).rejects.toThrow('Invalid task type: invalid-task');
    });

    test('should start all default tasks', async () => {
      const cron = require('node-cron');
      
      await scheduler.start();
      
      expect(cron.schedule).toHaveBeenCalledTimes(4);
      expect(scheduler.scheduledTasks.size).toBe(4);
      
      for (const taskType of TaskTypes.getAllTypes()) {
        expect(scheduler.scheduledTasks.has(taskType)).toBe(true);
      }
    });
  });

  describe('task data creation', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    test('should create correct data for live matches', async () => {
      const data = await scheduler.createTaskData(TaskTypes.LIVE_MATCHES);
      
      expect(data.taskType).toBe(TaskTypes.LIVE_MATCHES);
      expect(data.dataType).toBe('live');
      expect(data.maxPages).toBe(5);
      expect(data.timeout).toBe(30000);
      expect(data.scheduledAt).toBeDefined();
    });

    test('should create correct data for historical data', async () => {
      const data = await scheduler.createTaskData(TaskTypes.HISTORICAL_DATA);
      
      expect(data.taskType).toBe(TaskTypes.HISTORICAL_DATA);
      expect(data.dataType).toBe('historical');
      expect(data.daysBack).toBe(1);
      expect(data.maxPages).toBe(20);
      expect(data.timeout).toBe(120000);
    });

    test('should create correct data for upcoming fixtures', async () => {
      const data = await scheduler.createTaskData(TaskTypes.UPCOMING_FIXTURES);
      
      expect(data.taskType).toBe(TaskTypes.UPCOMING_FIXTURES);
      expect(data.dataType).toBe('upcoming');
      expect(data.daysAhead).toBe(7);
      expect(data.maxPages).toBe(10);
      expect(data.timeout).toBe(60000);
    });

    test('should create correct data for league discovery', async () => {
      const data = await scheduler.createTaskData(TaskTypes.LEAGUE_DISCOVERY);
      
      expect(data.taskType).toBe(TaskTypes.LEAGUE_DISCOVERY);
      expect(data.dataType).toBe('discovery');
      expect(data.maxDepth).toBe(3);
      expect(data.timeout).toBe(180000);
    });
  });

  describe('load balancing', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    test('should skip execution when system load is high', async () => {
      mockTaskManager.getQueueStats.mockResolvedValue({
        waiting: 10,
        active: 5,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 15
      });

      const shouldSkip = await scheduler.shouldSkipExecution(TaskTypes.LIVE_MATCHES);
      expect(shouldSkip).toBe(true);
    });

    test('should not skip execution when system load is normal', async () => {
      mockTaskManager.getQueueStats.mockResolvedValue({
        waiting: 1,
        active: 1,
        completed: 5,
        failed: 0,
        delayed: 0,
        total: 7
      });

      const shouldSkip = await scheduler.shouldSkipExecution(TaskTypes.LIVE_MATCHES);
      expect(shouldSkip).toBe(false);
    });

    test('should skip execution when max concurrency is reached', async () => {
      mockTaskManager.getQueueStats.mockResolvedValue({
        waiting: 0,
        active: 3, // Equals maxConcurrency for live matches
        completed: 5,
        failed: 0,
        delayed: 0,
        total: 8
      });

      const shouldSkip = await scheduler.shouldSkipExecution(TaskTypes.LIVE_MATCHES);
      expect(shouldSkip).toBe(true);
    });
  });

  describe('schedule management', () => {
    beforeEach(async () => {
      await scheduler.initialize();
      await scheduler.scheduleTask(TaskTypes.LIVE_MATCHES, {});
    });

    test('should update schedule', async () => {
      const newSchedule = '*/2 * * * *';
      const cron = require('node-cron');
      cron.validate.mockReturnValue(true);

      await scheduler.updateSchedule(TaskTypes.LIVE_MATCHES, newSchedule);

      const scheduledTask = scheduler.scheduledTasks.get(TaskTypes.LIVE_MATCHES);
      expect(scheduledTask.config.schedule).toBe(newSchedule);
    });

    test('should throw error for invalid schedule', async () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(false);

      await expect(
        scheduler.updateSchedule(TaskTypes.LIVE_MATCHES, 'invalid')
      ).rejects.toThrow('Invalid cron schedule: invalid');
    });

    test('should pause and resume task', () => {
      scheduler.pauseTask(TaskTypes.LIVE_MATCHES);
      const scheduledTask = scheduler.scheduledTasks.get(TaskTypes.LIVE_MATCHES);
      expect(scheduledTask.cronJob.stop).toHaveBeenCalled();

      scheduler.resumeTask(TaskTypes.LIVE_MATCHES);
      expect(scheduledTask.cronJob.start).toHaveBeenCalled();
    });

    test('should throw error when pausing non-existent task', () => {
      expect(() => {
        scheduler.pauseTask('non-existent');
      }).toThrow('Task type non-existent is not scheduled');
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    test('should return correct statistics', () => {
      const stats = scheduler.getStats();
      
      expect(stats.isRunning).toBe(true);
      expect(stats.totalScheduledTasks).toBe(0);
      expect(stats.config).toEqual(scheduler.config);
      expect(stats.taskStats).toBeDefined();
      
      for (const taskType of TaskTypes.getAllTypes()) {
        expect(stats.taskStats[taskType]).toBeDefined();
        expect(stats.taskStats[taskType].successRate).toBe('0%');
      }
    });

    test('should calculate success rate correctly', () => {
      const stats = scheduler.taskStats.get(TaskTypes.LIVE_MATCHES);
      stats.totalRuns = 10;
      stats.successfulRuns = 8;

      const schedulerStats = scheduler.getStats();
      expect(schedulerStats.taskStats[TaskTypes.LIVE_MATCHES].successRate).toBe('80.00%');
    });
  });

  describe('cleanup', () => {
    test('should stop all scheduled tasks', async () => {
      await scheduler.initialize();
      await scheduler.scheduleTask(TaskTypes.LIVE_MATCHES, {});
      await scheduler.scheduleTask(TaskTypes.HISTORICAL_DATA, {});

      await scheduler.stop();

      expect(scheduler.isRunning).toBe(false);
      expect(scheduler.scheduledTasks.size).toBe(0);
    });
  });

  describe('static methods', () => {
    test('should validate cron schedules', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(true);

      expect(Scheduler.validateSchedule('0 0 * * *')).toBe(true);
      
      cron.validate.mockReturnValue(false);
      expect(Scheduler.validateSchedule('invalid')).toBe(false);
    });
  });
});