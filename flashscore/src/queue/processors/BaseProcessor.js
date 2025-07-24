const winston = require('winston');

/**
 * Base class for all job processors
 */
class BaseProcessor {
  constructor(dependencies = {}) {
    this.scrapingEngine = dependencies.scrapingEngine;
    this.dataParser = dependencies.dataParser;
    this.databaseService = dependencies.databaseService;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/processors.log' })
      ]
    });
  }

  /**
   * Process a job - to be implemented by subclasses
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job object
   * @returns {Promise<Object>} Processing result
   */
  async process(jobData, job) {
    throw new Error('Process method must be implemented by subclass');
  }

  /**
   * Update job progress
   * @param {Object} job - Bull job object
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   */
  updateProgress(job, progress, message) {
    if (job && typeof job.progress === 'function') {
      job.progress(progress, message);
    }
    
    this.logger.info('Job progress updated', {
      jobId: job?.id,
      progress,
      message
    });
  }

  /**
   * Handle processing errors
   * @param {Error} error - Error object
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job object
   */
  handleError(error, jobData, job) {
    this.logger.error('Job processing error', {
      jobId: job?.id,
      taskType: jobData?.taskType,
      error: error.message,
      stack: error.stack
    });
    
    throw error; // Re-throw to let Bull handle retry logic
  }

  /**
   * Validate job data
   * @param {Object} jobData - Job data to validate
   * @returns {boolean} True if valid
   */
  validateJobData(jobData) {
    if (!jobData || typeof jobData !== 'object') {
      throw new Error('Invalid job data: must be an object');
    }

    if (!jobData.taskType) {
      throw new Error('Invalid job data: taskType is required');
    }

    return true;
  }

  /**
   * Get processing timeout based on job data
   * @param {Object} jobData - Job data
   * @returns {number} Timeout in milliseconds
   */
  getTimeout(jobData) {
    return jobData.timeout || 60000; // Default 1 minute
  }

  /**
   * Check if processing should be aborted
   * @param {Object} job - Bull job object
   * @returns {boolean} True if should abort
   */
  shouldAbort(job) {
    // Check if job has been cancelled or is stalled
    return job && (job.opts?.removeOnComplete === false || job.opts?.removeOnFail === false);
  }

  /**
   * Log processing start
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job object
   */
  logStart(jobData, job) {
    this.logger.info('Starting job processing', {
      jobId: job?.id,
      taskType: jobData?.taskType,
      dataType: jobData?.dataType,
      scheduledAt: jobData?.scheduledAt
    });
  }

  /**
   * Log processing completion
   * @param {Object} result - Processing result
   * @param {Object} jobData - Job data
   * @param {Object} job - Bull job object
   */
  logCompletion(result, jobData, job) {
    this.logger.info('Job processing completed', {
      jobId: job?.id,
      taskType: jobData?.taskType,
      result: {
        success: result.success,
        itemsProcessed: result.itemsProcessed,
        errors: result.errors?.length || 0
      }
    });
  }
}

module.exports = BaseProcessor;