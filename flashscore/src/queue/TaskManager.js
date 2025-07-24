const Queue = require('bull');
const winston = require('winston');

/**
 * TaskManager handles job queuing and processing using Bull with Redis backend
 */
class TaskManager {
  constructor(redisConfig = {}) {
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      ...redisConfig
    };

    this.queues = new Map();
    this.processors = new Map();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/queue.log' })
      ]
    });

    this.isInitialized = false;
  }

  /**
   * Initialize the task manager and create queues
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create queues for different task types
      const queueNames = [
        'live-matches',
        'historical-data', 
        'upcoming-fixtures',
        'league-discovery'
      ];

      for (const queueName of queueNames) {
        const queue = new Queue(queueName, {
          redis: this.redisConfig,
          defaultJobOptions: {
            removeOnComplete: 50, // Keep last 50 completed jobs
            removeOnFail: 100,    // Keep last 100 failed jobs
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        });

        // Add event listeners for monitoring
        queue.on('completed', (job, result) => {
          this.logger.info('Job completed', {
            queue: queueName,
            jobId: job.id,
            duration: Date.now() - job.processedOn
          });
        });

        queue.on('failed', (job, err) => {
          this.logger.error('Job failed', {
            queue: queueName,
            jobId: job.id,
            error: err.message,
            attempts: job.attemptsMade
          });
        });

        queue.on('stalled', (job) => {
          this.logger.warn('Job stalled', {
            queue: queueName,
            jobId: job.id
          });
        });

        this.queues.set(queueName, queue);
      }

      this.isInitialized = true;
      this.logger.info('TaskManager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TaskManager', { error: error.message });
      throw error;
    }
  }

  /**
   * Add a task to the specified queue
   * @param {string} taskType - Type of task (live-matches, historical-data, etc.)
   * @param {Object} data - Task data
   * @param {Object} options - Job options (priority, delay, etc.)
   * @returns {Promise<Object>} Job object
   */
  async addTask(taskType, data, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const queue = this.queues.get(taskType);
    if (!queue) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    const jobOptions = {
      priority: this._getTaskPriority(taskType),
      delay: options.delay || 0,
      ...options
    };

    try {
      const job = await queue.add(data, jobOptions);
      this.logger.info('Task added to queue', {
        taskType,
        jobId: job.id,
        priority: jobOptions.priority
      });
      return job;
    } catch (error) {
      this.logger.error('Failed to add task to queue', {
        taskType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Register a processor for a specific task type
   * @param {string} taskType - Type of task
   * @param {Function} processor - Processing function
   * @param {number} concurrency - Number of concurrent jobs (default: 1)
   */
  registerProcessor(taskType, processor, concurrency = 1) {
    if (!this.queues.has(taskType)) {
      throw new Error(`Queue for task type ${taskType} not found`);
    }

    const queue = this.queues.get(taskType);
    queue.process(concurrency, async (job) => {
      this.logger.info('Processing job', {
        taskType,
        jobId: job.id,
        data: job.data
      });

      try {
        const result = await processor(job.data, job);
        return result;
      } catch (error) {
        this.logger.error('Job processing failed', {
          taskType,
          jobId: job.id,
          error: error.message
        });
        throw error;
      }
    });

    this.processors.set(taskType, processor);
    this.logger.info('Processor registered', { taskType, concurrency });
  }

  /**
   * Get task status by job ID
   * @param {string} taskType - Type of task
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job status
   */
  async getTaskStatus(taskType, jobId) {
    const queue = this.queues.get(taskType);
    if (!queue) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      return {
        id: job.id,
        status: state,
        progress: job.progress(),
        data: job.data,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        attempts: job.attemptsMade,
        failedReason: job.failedReason
      };
    } catch (error) {
      this.logger.error('Failed to get task status', {
        taskType,
        jobId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   * @param {string} taskType - Type of task
   * @returns {Promise<Object>} Queue statistics
   */
  async getQueueStats(taskType) {
    const queue = this.queues.get(taskType);
    if (!queue) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats', {
        taskType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retry failed tasks
   * @param {string} taskType - Type of task
   * @param {number} maxRetries - Maximum number of tasks to retry
   * @returns {Promise<number>} Number of tasks retried
   */
  async retryFailedTasks(taskType, maxRetries = 10) {
    const queue = this.queues.get(taskType);
    if (!queue) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    try {
      const failedJobs = await queue.getFailed(0, maxRetries - 1);
      let retriedCount = 0;

      for (const job of failedJobs) {
        await job.retry();
        retriedCount++;
        this.logger.info('Job retried', {
          taskType,
          jobId: job.id
        });
      }

      return retriedCount;
    } catch (error) {
      this.logger.error('Failed to retry tasks', {
        taskType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean old jobs from queue
   * @param {string} taskType - Type of task
   * @param {number} grace - Grace period in milliseconds
   * @returns {Promise<void>}
   */
  async cleanQueue(taskType, grace = 24 * 60 * 60 * 1000) { // 24 hours default
    const queue = this.queues.get(taskType);
    if (!queue) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    try {
      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
      this.logger.info('Queue cleaned', { taskType, grace });
    } catch (error) {
      this.logger.error('Failed to clean queue', {
        taskType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get task priority based on type
   * @param {string} taskType - Type of task
   * @returns {number} Priority (higher number = higher priority)
   * @private
   */
  _getTaskPriority(taskType) {
    const priorities = {
      'live-matches': 100,      // Highest priority for live data
      'upcoming-fixtures': 75,   // High priority for near-future data
      'historical-data': 50,     // Medium priority for historical data
      'league-discovery': 25     // Lower priority for discovery tasks
    };

    return priorities[taskType] || 1;
  }

  /**
   * Pause all queues
   * @returns {Promise<void>}
   */
  async pauseAll() {
    const pausePromises = Array.from(this.queues.values()).map(queue => queue.pause());
    await Promise.all(pausePromises);
    this.logger.info('All queues paused');
  }

  /**
   * Resume all queues
   * @returns {Promise<void>}
   */
  async resumeAll() {
    const resumePromises = Array.from(this.queues.values()).map(queue => queue.resume());
    await Promise.all(resumePromises);
    this.logger.info('All queues resumed');
  }

  /**
   * Close all queues and connections
   * @returns {Promise<void>}
   */
  async close() {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
    this.processors.clear();
    this.isInitialized = false;
    this.logger.info('TaskManager closed');
  }
}

module.exports = TaskManager;