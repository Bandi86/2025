const BaseProcessor = require('./BaseProcessor');
const TaskTypes = require('../TaskTypes');

/**
 * Processor for real-time live match data collection
 */
class LiveMatchProcessor extends BaseProcessor {
  constructor(dependencies = {}) {
    super(dependencies);
    this.taskType = TaskTypes.LIVE_MATCHES;
  }

  /**
   * Process live match data collection job
   * @param {Object} jobData - Job data containing live match parameters
   * @param {Object} job - Bull job object
   * @returns {Promise<Object>} Processing result
   */
  async process(jobData, job) {
    this.validateJobData(jobData);
    this.logStart(jobData, job);

    const result = {
      success: false,
      itemsProcessed: 0,
      matchesUpdated: 0,
      eventsProcessed: 0,
      errors: [],
      startTime: Date.now()
    };

    try {
      this.updateProgress(job, 10, 'Initializing live match collection');

      // Get live match URLs to scrape
      const liveMatchUrls = await this.getLiveMatchUrls(jobData);
      this.updateProgress(job, 20, `Found ${liveMatchUrls.length} live matches`);

      if (liveMatchUrls.length === 0) {
        result.success = true;
        result.message = 'No live matches found';
        this.logCompletion(result, jobData, job);
        return result;
      }

      // Process each live match
      const progressStep = 60 / liveMatchUrls.length;
      let currentProgress = 20;

      for (let i = 0; i < liveMatchUrls.length; i++) {
        if (this.shouldAbort(job)) {
          throw new Error('Job aborted');
        }

        const matchUrl = liveMatchUrls[i];
        
        try {
          this.updateProgress(job, currentProgress, `Processing match ${i + 1}/${liveMatchUrls.length}`);
          
          const matchResult = await this.processLiveMatch(matchUrl, jobData);
          
          result.itemsProcessed++;
          if (matchResult.updated) {
            result.matchesUpdated++;
          }
          result.eventsProcessed += matchResult.eventsProcessed || 0;

        } catch (error) {
          this.logger.warn('Failed to process live match', {
            matchUrl,
            error: error.message
          });
          result.errors.push({
            url: matchUrl,
            error: error.message
          });
        }

        currentProgress += progressStep;
      }

      this.updateProgress(job, 90, 'Finalizing live match data');

      // Update processing statistics
      await this.updateProcessingStats(result, jobData);

      this.updateProgress(job, 100, 'Live match collection completed');

      result.success = true;
      result.processingTime = Date.now() - result.startTime;
      
      this.logCompletion(result, jobData, job);
      return result;

    } catch (error) {
      result.error = error.message;
      result.processingTime = Date.now() - result.startTime;
      this.handleError(error, jobData, job);
    }
  }

  /**
   * Get URLs of currently live matches
   * @param {Object} jobData - Job data
   * @returns {Promise<string[]>} Array of live match URLs
   * @private
   */
  async getLiveMatchUrls(jobData) {
    try {
      if (!this.scrapingEngine) {
        // Return mock data for testing
        return [
          'https://www.flashscore.com/match/live1',
          'https://www.flashscore.com/match/live2'
        ];
      }

      await this.scrapingEngine.initializeBrowser();
      
      // Navigate to live scores page
      await this.scrapingEngine.navigateToPage('https://www.flashscore.com/');
      
      // Extract live match URLs
      const liveMatchUrls = await this.scrapingEngine.extractData({
        liveMatches: '.event__match--live .event__match'
      });

      return liveMatchUrls.liveMatches?.map(match => match.url).filter(Boolean) || [];

    } catch (error) {
      this.logger.error('Failed to get live match URLs', { error: error.message });
      return [];
    }
  }

  /**
   * Process a single live match
   * @param {string} matchUrl - URL of the match to process
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Processing result for this match
   * @private
   */
  async processLiveMatch(matchUrl, jobData) {
    const result = {
      updated: false,
      eventsProcessed: 0,
      url: matchUrl
    };

    try {
      // Navigate to match page
      if (this.scrapingEngine) {
        await this.scrapingEngine.navigateToPage(matchUrl);
        
        // Extract live match data
        const matchData = await this.extractLiveMatchData(matchUrl);
        
        if (matchData) {
          // Save or update match data
          const saved = await this.saveMatchData(matchData);
          result.updated = saved;
          
          // Process match events
          if (matchData.events && matchData.events.length > 0) {
            result.eventsProcessed = await this.processMatchEvents(matchData.events, matchData.matchId);
          }
        }
      } else {
        // Mock processing for testing
        result.updated = true;
        result.eventsProcessed = Math.floor(Math.random() * 5);
      }

    } catch (error) {
      this.logger.error('Failed to process live match', {
        matchUrl,
        error: error.message
      });
      throw error;
    }

    return result;
  }

  /**
   * Extract live match data from the current page
   * @param {string} matchUrl - URL of the match
   * @returns {Promise<Object>} Extracted match data
   * @private
   */
  async extractLiveMatchData(matchUrl) {
    try {
      if (!this.dataParser) {
        // Return mock data for testing
        return {
          matchId: `match_${Date.now()}`,
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          currentScore: '1-0',
          matchTime: '45+2',
          status: 'live',
          events: [
            {
              type: 'goal',
              minute: 23,
              player: 'Player A',
              team: 'home'
            }
          ]
        };
      }

      // Use data parser to extract match information
      const html = await this.scrapingEngine.getPageContent();
      const matchData = await this.dataParser.parseMatchData(html);
      
      // Add URL for reference
      matchData.flashscoreUrl = matchUrl;
      matchData.lastUpdated = new Date();
      
      return matchData;

    } catch (error) {
      this.logger.error('Failed to extract live match data', {
        matchUrl,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Save or update match data in database
   * @param {Object} matchData - Match data to save
   * @returns {Promise<boolean>} True if data was updated
   * @private
   */
  async saveMatchData(matchData) {
    try {
      if (!this.databaseService) {
        // Mock save for testing
        this.logger.info('Mock: Saving match data', {
          matchId: matchData.matchId,
          score: matchData.currentScore,
          status: matchData.status
        });
        return true;
      }

      // Check if match exists
      const existingMatch = await this.databaseService.getMatch(matchData.matchId);
      
      if (existingMatch) {
        // Update existing match
        await this.databaseService.updateMatch(matchData.matchId, {
          finalScore: matchData.currentScore,
          status: matchData.status,
          lastUpdated: matchData.lastUpdated
        });
      } else {
        // Create new match record
        await this.databaseService.createMatch(matchData);
      }

      return true;

    } catch (error) {
      this.logger.error('Failed to save match data', {
        matchId: matchData.matchId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Process and save match events
   * @param {Array} events - Array of match events
   * @param {string} matchId - Match ID
   * @returns {Promise<number>} Number of events processed
   * @private
   */
  async processMatchEvents(events, matchId) {
    let processedCount = 0;

    try {
      for (const event of events) {
        if (!this.databaseService) {
          // Mock processing for testing
          this.logger.info('Mock: Processing event', {
            matchId,
            type: event.type,
            minute: event.minute
          });
          processedCount++;
          continue;
        }

        // Check if event already exists
        const eventId = `${matchId}_${event.type}_${event.minute}_${event.player}`;
        const existingEvent = await this.databaseService.getMatchEvent(eventId);
        
        if (!existingEvent) {
          // Create new event
          await this.databaseService.createMatchEvent({
            eventId,
            matchId,
            eventType: event.type,
            minute: event.minute,
            playerName: event.player,
            description: `${event.type} by ${event.player} at ${event.minute}'`
          });
          processedCount++;
        }
      }

    } catch (error) {
      this.logger.error('Failed to process match events', {
        matchId,
        error: error.message
      });
    }

    return processedCount;
  }

  /**
   * Update processing statistics
   * @param {Object} result - Processing result
   * @param {Object} jobData - Job data
   * @private
   */
  async updateProcessingStats(result, jobData) {
    try {
      if (!this.databaseService) {
        return;
      }

      await this.databaseService.logScrapingActivity({
        taskType: this.taskType,
        status: result.success ? 'completed' : 'failed',
        itemsProcessed: result.itemsProcessed,
        executionTime: result.processingTime,
        errorMessage: result.error || null
      });

    } catch (error) {
      this.logger.error('Failed to update processing stats', {
        error: error.message
      });
    }
  }
}

module.exports = LiveMatchProcessor;