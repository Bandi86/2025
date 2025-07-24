const cron = require('node-cron');
const winston = require('winston');
const TaskTypes = require('../queue/TaskTypes');

/**
 * Scheduler manages cron-based task scheduling with dynamic adjustment capabilities
 */
class Scheduler {
  constructor(taskManager, config = {}) {
    this.taskManager = taskManager;
    this.config = {
      timezone: process.env.TIMEZONE || 'UTC',
      maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS) || 5,
      systemLoadThreshold: parseFloat(process.env.SYSTEM_LOAD_THRESHOLD) || 0.8,
      ...config
    };

    this.scheduledTasks = new Map();
    this.taskStats = new Map();
    this.isRunning = false;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/scheduler.log' })
      ]
    });

    // Default schedules for different data types
    this.defaultSchedules = {
      [TaskTypes.LIVE_MATCHES]: {
        schedule: '*/1 * * * *',        // Every minute during match hours
        offSeasonSchedule: '*/5 * * * *', // Every 5 minutes off-season
        priority: 100,
        maxConcurrency: 3,
        description: 'Live match data collection'
      },
      [TaskTypes.UPCOMING_FIXTURES]: {
        schedule: '0 */3 * * *',        // Every 3 hours
        priority: 75,
        maxConcurrency: 2,
        description: 'Upcoming fixtures collection'
      },
      [TaskTypes.HISTORICAL_DATA]: {
        schedule: '0 2 * * *',          // Daily at 2 AM
        priority: 50,
        maxConcurrency: 1,
        description: 'Historical data collection'
      },
      [TaskTypes.LEAGUE_DISCOVERY]: {
        schedule: '0 0 * * 0',          // Weekly on Sunday at midnight
        priority: 25,
        maxConcurrency: 1,
        description: 'League discovery and hierarchy mapping'
      }
    };
  }

  /**
   * Initialize the scheduler
   */
  async initialize() {
    if (this.isRunning) {
      return;
    }

    try {
      // Initialize task statistics
      for (const taskType of TaskTypes.getAllTypes()) {
        this.taskStats.set(taskType, {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          lastRun: null,
          lastSuccess: null,
          averageExecutionTime: 0,
          currentLoad: 0
        });
      }

      this.isRunning = true;
      this.logger.info('Scheduler initialized successfully', {
        timezone: this.config.timezone,
        maxConcurrentTasks: this.config.maxConcurrentTasks
      });
    } catch (error) {
      this.logger.error('Failed to initialize Scheduler', { error: error.message });
      throw error;
    }
  }

  /**
   * Start all scheduled tasks
   */
  async start() {
    if (!this.isRunning) {
      await this.initialize();
    }

    try {
      // Schedule all default tasks
      for (const [taskType, config] of Object.entries(this.defaultSchedules)) {
        await this.scheduleTask(taskType, config);
      }

      this.logger.info('All scheduled tasks started', {
        taskCount: this.scheduledTasks.size
      });
    } catch (error) {
      this.logger.error('Failed to start scheduler', { error: error.message });
      throw error;
    }
  }

  /**
   * Schedule a specific task type
   * @param {string} taskType - Type of task to schedule
   * @param {Object} config - Schedule configuration
   */
  async scheduleTask(taskType, config) {
    if (!TaskTypes.isValidType(taskType)) {
      throw new Error(`Invalid task type: ${taskType}`);
    }

    const scheduleConfig = {
      ...this.defaultSchedules[taskType],
      ...config
    };

    // Create the cron job
    const cronJob = cron.schedule(scheduleConfig.schedule, async () => {
      await this.executeScheduledTask(taskType, scheduleConfig);
    }, {
      scheduled: false,
      timezone: this.config.timezone
    });

    // Store the scheduled task
    this.scheduledTasks.set(taskType, {
      cronJob,
      config: scheduleConfig,
      isActive: false
    });

    // Start the cron job
    cronJob.start();

    this.logger.info('Task scheduled', {
      taskType,
      schedule: scheduleConfig.schedule,
      priority: scheduleConfig.priority,
      description: scheduleConfig.description
    });
  }

  /**
   * Execute a scheduled task with load balancing and error handling
   * @param {string} taskType - Type of task to execute
   * @param {Object} config - Task configuration
   * @private
   */
  async executeScheduledTask(taskType, config) {
    const stats = this.taskStats.get(taskType);
    const startTime = Date.now();

    // Check if we should skip this execution due to system load
    if (await this.shouldSkipExecution(taskType)) {
      this.logger.info('Skipping task execution due to system load', { taskType });
      return;
    }

    // Check if task is already running
    const scheduledTask = this.scheduledTasks.get(taskType);
    if (scheduledTask.isActive) {
      this.logger.warn('Task already running, skipping execution', { taskType });
      return;
    }

    try {
      scheduledTask.isActive = true;
      stats.totalRuns++;
      stats.lastRun = new Date();

      this.logger.info('Executing scheduled task', {
        taskType,
        priority: config.priority,
        run: stats.totalRuns
      });

      // Create task data based on type
      const taskData = await this.createTaskData(taskType);

      // Add task to queue with appropriate options
      const job = await this.taskManager.addTask(taskType, taskData, {
        priority: config.priority,
        attempts: this.getAttemptsForTaskType(taskType)
      });

      // Update statistics
      const executionTime = Date.now() - startTime;
      stats.averageExecutionTime = (stats.averageExecutionTime * (stats.totalRuns - 1) + executionTime) / stats.totalRuns;
      stats.successfulRuns++;
      stats.lastSuccess = new Date();

      this.logger.info('Scheduled task queued successfully', {
        taskType,
        jobId: job.id,
        executionTime
      });

    } catch (error) {
      stats.failedRuns++;
      this.logger.error('Scheduled task execution failed', {
        taskType,
        error: error.message,
        totalRuns: stats.totalRuns,
        failedRuns: stats.failedRuns
      });
    } finally {
      scheduledTask.isActive = false;
    }
  }

  /**
   * Determine if execution should be skipped based on system load
   * @param {string} taskType - Type of task
   * @returns {Promise<boolean>} True if execution should be skipped
   * @private
   */
  async shouldSkipExecution(taskType) {
    try {
      // Get current queue statistics
      const queueStats = await this.taskManager.getQueueStats(taskType);
      const currentLoad = (queueStats.active + queueStats.waiting) / this.config.maxConcurrentTasks;

      // Update current load in stats
      const stats = this.taskStats.get(taskType);
      stats.currentLoad = currentLoad;

      // Skip if system load is too high
      if (currentLoad > this.config.systemLoadThreshold) {
        return true;
      }

      // Skip if too many tasks of this type are already queued
      const maxConcurrency = this.defaultSchedules[taskType]?.maxConcurrency || 1;
      if (queueStats.active >= maxConcurrency) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking system load', {
        taskType,
        error: error.message
      });
      return false; // Don't skip on error
    }
  }

  /**
   * Create task data based on task type
   * @param {string} taskType - Type of task
   * @returns {Promise<Object>} Task data
   * @private
   */
  async createTaskData(taskType) {
    const baseData = {
      taskType,
      scheduledAt: new Date().toISOString(),
      priority: this.defaultSchedules[taskType]?.priority || 1
    };

    switch (taskType) {
      case TaskTypes.LIVE_MATCHES:
        return {
          ...baseData,
          dataType: 'live',
          maxPages: 5,
          timeout: 30000
        };

      case TaskTypes.UPCOMING_FIXTURES:
        return {
          ...baseData,
          dataType: 'upcoming',
          daysAhead: 7,
          maxPages: 10,
          timeout: 60000
        };

      case TaskTypes.HISTORICAL_DATA:
        return {
          ...baseData,
          dataType: 'historical',
          daysBack: 1,
          maxPages: 20,
          timeout: 120000
        };

      case TaskTypes.LEAGUE_DISCOVERY:
        return {
          ...baseData,
          dataType: 'discovery',
          maxDepth: 3,
          timeout: 180000
        };

      default:
        return baseData;
    }
  }

  /**
   * Get number of retry attempts for task type
   * @param {string} taskType - Type of task
   * @returns {number} Number of attempts
   * @private
   */
  getAttemptsForTaskType(taskType) {
    const config = TaskTypes.getDefaultConfig(taskType);
    return config.attempts;
  }

  /**
   * Update schedule for a specific task type
   * @param {string} taskType - Type of task
   * @param {string} newSchedule - New cron schedule
   */
  async updateSchedule(taskType, newSchedule) {
    if (!this.scheduledTasks.has(taskType)) {
      throw new Error(`Task type ${taskType} is not scheduled`);
    }

    if (!cron.validate(newSchedule)) {
      throw new Error(`Invalid cron schedule: ${newSchedule}`);
    }

    const scheduledTask = this.scheduledTasks.get(taskType);
    
    // Stop the current cron job
    scheduledTask.cronJob.stop();
    
    // Update the schedule
    scheduledTask.config.schedule = newSchedule;
    
    // Create new cron job with updated schedule
    const newCronJob = cron.schedule(newSchedule, async () => {
      await this.executeScheduledTask(taskType, scheduledTask.config);
    }, {
      scheduled: true,
      timezone: this.config.timezone
    });

    scheduledTask.cronJob = newCronJob;

    this.logger.info('Schedule updated', {
      taskType,
      newSchedule,
      timezone: this.config.timezone
    });
  }

  /**
   * Pause a specific scheduled task
   * @param {string} taskType - Type of task to pause
   */
  pauseTask(taskType) {
    if (!this.scheduledTasks.has(taskType)) {
      throw new Error(`Task type ${taskType} is not scheduled`);
    }

    const scheduledTask = this.scheduledTasks.get(taskType);
    scheduledTask.cronJob.stop();

    this.logger.info('Task paused', { taskType });
  }

  /**
   * Resume a specific scheduled task
   * @param {string} taskType - Type of task to resume
   */
  resumeTask(taskType) {
    if (!this.scheduledTasks.has(taskType)) {
      throw new Error(`Task type ${taskType} is not scheduled`);
    }

    const scheduledTask = this.scheduledTasks.get(taskType);
    scheduledTask.cronJob.start();

    this.logger.info('Task resumed', { taskType });
  }

  /**
   * Get scheduler statistics
   * @returns {Object} Scheduler statistics
   */
  getStats() {
    const stats = {};
    
    for (const [taskType, taskStats] of this.taskStats.entries()) {
      const scheduledTask = this.scheduledTasks.get(taskType);
      
      stats[taskType] = {
        ...taskStats,
        schedule: scheduledTask?.config.schedule,
        isScheduled: this.scheduledTasks.has(taskType),
        isActive: scheduledTask?.isActive || false,
        successRate: taskStats.totalRuns > 0 ? 
          (taskStats.successfulRuns / taskStats.totalRuns * 100).toFixed(2) + '%' : '0%'
      };
    }

    return {
      isRunning: this.isRunning,
      totalScheduledTasks: this.scheduledTasks.size,
      config: this.config,
      taskStats: stats
    };
  }

  /**
   * Stop all scheduled tasks
   */
  async stop() {
    try {
      for (const [taskType, scheduledTask] of this.scheduledTasks.entries()) {
        scheduledTask.cronJob.stop();
        this.logger.info('Task stopped', { taskType });
      }

      this.scheduledTasks.clear();
      this.isRunning = false;

      this.logger.info('Scheduler stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping scheduler', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate cron schedule
   * @param {string} schedule - Cron schedule to validate
   * @returns {boolean} True if valid
   */
  static validateSchedule(schedule) {
    return cron.validate(schedule);
  }
}

module.exports = Scheduler;