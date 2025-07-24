const BaseProcessor = require('./BaseProcessor');
const TaskTypes = require('../TaskTypes');

/**
 * Processor for historical match data collection
 */
class HistoricalDataProcessor extends BaseProcessor {
  constructor(dependencies = {}) {
    super(dependencies);
    this.taskType = TaskTypes.HISTORICAL_DATA;
  }

  /**
   * Process historical data collection job
   * @param {Object} jobData - Job data containing historical data parameters
   * @param {Object} job - Bull job object
   * @returns {Promise<Object>} Processing result
   */
  async process(jobData, job) {
    this.validateJobData(jobData);
    this.logStart(jobData, job);

    const result = {
      success: false,
      itemsProcessed: 0,
      matchesCollected: 0,
      leaguesProcessed: 0,
      errors: [],
      startTime: Date.now()
    };

    try {
      this.updateProgress(job, 10, 'Initializing historical data collection');

      // Get leagues to process
      const leagues = await this.getLeaguesToProcess(jobData);
      this.updateProgress(job, 20, `Found ${leagues.length} leagues to process`);

      if (leagues.length === 0) {
        result.success = true;
        result.message = 'No leagues found for historical data collection';
        this.logCompletion(result, jobData, job);
        return result;
      }

      // Process each league
      const progressStep = 60 / leagues.length;
      let currentProgress = 20;

      for (let i = 0; i < leagues.length; i++) {
        if (this.shouldAbort(job)) {
          throw new Error('Job aborted');
        }

        const league = leagues[i];
        
        try {
          this.updateProgress(job, currentProgress, `Processing league ${i + 1}/${leagues.length}: ${league.name}`);
          
          const leagueResult = await this.processLeagueHistory(league, jobData);
          
          result.leaguesProcessed++;
          result.matchesCollected += leagueResult.matchesCollected || 0;
          result.itemsProcessed += leagueResult.itemsProcessed || 0;

        } catch (error) {
          this.logger.warn('Failed to process league history', {
            leagueId: league.leagueId,
            leagueName: league.name,
            error: error.message
          });
          result.errors.push({
            league: league.name,
            error: error.message
          });
        }

        currentProgress += progressStep;
      }

      this.updateProgress(job, 90, 'Finalizing historical data collection');

      // Update processing statistics
      await this.updateProcessingStats(result, jobData);

      this.updateProgress(job, 100, 'Historical data collection completed');

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
   * Get leagues that need historical data processing
   * @param {Object} jobData - Job data
   * @returns {Promise<Array>} Array of league objects
   * @private
   */
  async getLeaguesToProcess(jobData) {
    try {
      if (!this.databaseService) {
        // Return mock data for testing
        return [
          {
            leagueId: 'premier_league',
            name: 'Premier League',
            country: 'England',
            flashscoreUrl: 'https://www.flashscore.com/football/england/premier-league/'
          },
          {
            leagueId: 'la_liga',
            name: 'La Liga',
            country: 'Spain',
            flashscoreUrl: 'https://www.flashscore.com/football/spain/laliga/'
          }
        ];
      }

      // Get leagues from database that need historical data updates
      const leagues = await this.databaseService.getLeaguesForHistoricalUpdate(jobData.daysBack || 1);
      
      return leagues;

    } catch (error) {
      this.logger.error('Failed to get leagues for processing', { error: error.message });
      return [];
    }
  }

  /**
   * Process historical data for a specific league
   * @param {Object} league - League object
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Processing result for this league
   * @private
   */
  async processLeagueHistory(league, jobData) {
    const result = {
      matchesCollected: 0,
      itemsProcessed: 0,
      leagueId: league.leagueId
    };

    try {
      if (this.scrapingEngine) {
        // Navigate to league results page
        const resultsUrl = this.buildResultsUrl(league, jobData);
        await this.scrapingEngine.navigateToPage(resultsUrl);
        
        // Process multiple pages of results
        const maxPages = jobData.maxPages || 5;
        
        for (let page = 1; page <= maxPages; page++) {
          const pageMatches = await this.processResultsPage(league, page);
          result.matchesCollected += pageMatches.length;
          result.itemsProcessed += pageMatches.length;
          
          // Check if there are more pages
          const hasNextPage = await this.hasNextPage();
          if (!hasNextPage) {
            break;
          }
          
          // Navigate to next page
          await this.navigateToNextPage();
        }
      } else {
        // Mock processing for testing
        result.matchesCollected = Math.floor(Math.random() * 20) + 5;
        result.itemsProcessed = result.matchesCollected;
      }

    } catch (error) {
      this.logger.error('Failed to process league history', {
        leagueId: league.leagueId,
        error: error.message
      });
      throw error;
    }

    return result;
  }

  /**
   * Build results URL for a league
   * @param {Object} league - League object
   * @param {Object} jobData - Job data
   * @returns {string} Results URL
   * @private
   */
  buildResultsUrl(league, jobData) {
    const baseUrl = league.flashscoreUrl || 'https://www.flashscore.com/';
    
    // Add results path and date parameters
    const resultsUrl = baseUrl.endsWith('/') ? baseUrl + 'results/' : baseUrl + '/results/';
    
    return resultsUrl;
  }

  /**
   * Process a single results page
   * @param {Object} league - League object
   * @param {number} page - Page number
   * @returns {Promise<Array>} Array of processed matches
   * @private
   */
  async processResultsPage(league, page) {
    const matches = [];

    try {
      if (!this.dataParser) {
        // Return mock data for testing
        const mockMatches = [];
        for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
          mockMatches.push({
            matchId: `${league.leagueId}_match_${page}_${i}`,
            homeTeam: `Team ${i * 2 + 1}`,
            awayTeam: `Team ${i * 2 + 2}`,
            finalScore: `${Math.floor(Math.random() * 4)}-${Math.floor(Math.random() * 4)}`,
            matchDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          });
        }
        return mockMatches;
      }

      // Extract match data from current page
      const html = await this.scrapingEngine.getPageContent();
      const pageMatches = await this.dataParser.parseHistoricalMatches(html);
      
      // Process and save each match
      for (const matchData of pageMatches) {
        try {
          // Enrich match data with league information
          matchData.leagueId = league.leagueId;
          matchData.country = league.country;
          
          // Save match data
          const saved = await this.saveHistoricalMatch(matchData);
          if (saved) {
            matches.push(matchData);
          }

        } catch (error) {
          this.logger.warn('Failed to save historical match', {
            matchId: matchData.matchId,
            error: error.message
          });
        }
      }

    } catch (error) {
      this.logger.error('Failed to process results page', {
        leagueId: league.leagueId,
        page,
        error: error.message
      });
    }

    return matches;
  }

  /**
   * Save historical match data
   * @param {Object} matchData - Match data to save
   * @returns {Promise<boolean>} True if saved successfully
   * @private
   */
  async saveHistoricalMatch(matchData) {
    try {
      if (!this.databaseService) {
        // Mock save for testing
        this.logger.info('Mock: Saving historical match', {
          matchId: matchData.matchId,
          homeTeam: matchData.homeTeam,
          awayTeam: matchData.awayTeam,
          finalScore: matchData.finalScore
        });
        return true;
      }

      // Check if match already exists
      const existingMatch = await this.databaseService.getMatch(matchData.matchId);
      
      if (existingMatch) {
        // Update if data has changed
        if (this.hasMatchDataChanged(existingMatch, matchData)) {
          await this.databaseService.updateMatch(matchData.matchId, matchData);
          return true;
        }
        return false;
      } else {
        // Create new match record
        await this.databaseService.createMatch(matchData);
        return true;
      }

    } catch (error) {
      this.logger.error('Failed to save historical match', {
        matchId: matchData.matchId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check if match data has changed
   * @param {Object} existingMatch - Existing match data
   * @param {Object} newMatch - New match data
   * @returns {boolean} True if data has changed
   * @private
   */
  hasMatchDataChanged(existingMatch, newMatch) {
    return (
      existingMatch.finalScore !== newMatch.finalScore ||
      existingMatch.status !== newMatch.status ||
      existingMatch.matchDateTime !== newMatch.matchDateTime
    );
  }

  /**
   * Check if there is a next page of results
   * @returns {Promise<boolean>} True if next page exists
   * @private
   */
  async hasNextPage() {
    try {
      if (!this.scrapingEngine) {
        return Math.random() > 0.7; // Mock: 30% chance of next page
      }

      // Look for next page button or pagination
      const nextPageExists = await this.scrapingEngine.elementExists('.pagination .next:not(.disabled)');
      return nextPageExists;

    } catch (error) {
      this.logger.warn('Failed to check for next page', { error: error.message });
      return false;
    }
  }

  /**
   * Navigate to the next page of results
   * @returns {Promise<void>}
   * @private
   */
  async navigateToNextPage() {
    try {
      if (!this.scrapingEngine) {
        return;
      }

      // Click next page button
      await this.scrapingEngine.clickElement('.pagination .next');
      
      // Wait for page to load
      await this.scrapingEngine.waitForPageLoad();

    } catch (error) {
      this.logger.error('Failed to navigate to next page', { error: error.message });
      throw error;
    }
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
        errorMessage: result.error || null,
        metadata: {
          leaguesProcessed: result.leaguesProcessed,
          matchesCollected: result.matchesCollected
        }
      });

    } catch (error) {
      this.logger.error('Failed to update processing stats', {
        error: error.message
      });
    }
  }
}

module.exports = HistoricalDataProcessor;