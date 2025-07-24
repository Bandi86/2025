const BaseProcessor = require('./BaseProcessor');
const TaskTypes = require('../TaskTypes');

/**
 * Processor for upcoming fixtures data collection
 */
class UpcomingFixturesProcessor extends BaseProcessor {
  constructor(dependencies = {}) {
    super(dependencies);
    this.taskType = TaskTypes.UPCOMING_FIXTURES;
  }

  /**
   * Process upcoming fixtures collection job
   * @param {Object} jobData - Job data containing fixtures parameters
   * @param {Object} job - Bull job object
   * @returns {Promise<Object>} Processing result
   */
  async process(jobData, job) {
    this.validateJobData(jobData);
    this.logStart(jobData, job);

    const result = {
      success: false,
      itemsProcessed: 0,
      fixturesCollected: 0,
      leaguesProcessed: 0,
      errors: [],
      startTime: Date.now()
    };

    try {
      this.updateProgress(job, 10, 'Initializing upcoming fixtures collection');

      // Get leagues to process
      const leagues = await this.getLeaguesToProcess(jobData);
      this.updateProgress(job, 20, `Found ${leagues.length} leagues to process`);

      if (leagues.length === 0) {
        result.success = true;
        result.message = 'No leagues found for fixtures collection';
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
          
          const leagueResult = await this.processLeagueFixtures(league, jobData);
          
          result.leaguesProcessed++;
          result.fixturesCollected += leagueResult.fixturesCollected || 0;
          result.itemsProcessed += leagueResult.itemsProcessed || 0;

        } catch (error) {
          this.logger.warn('Failed to process league fixtures', {
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

      this.updateProgress(job, 90, 'Finalizing fixtures collection');

      // Update processing statistics
      await this.updateProcessingStats(result, jobData);

      this.updateProgress(job, 100, 'Upcoming fixtures collection completed');

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
   * Get leagues that need fixtures processing
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
            leagueId: 'champions_league',
            name: 'Champions League',
            country: 'Europe',
            flashscoreUrl: 'https://www.flashscore.com/football/europe/champions-league/'
          }
        ];
      }

      // Get active leagues from database
      const leagues = await this.databaseService.getActiveLeagues();
      
      return leagues;

    } catch (error) {
      this.logger.error('Failed to get leagues for fixtures processing', { error: error.message });
      return [];
    }
  }

  /**
   * Process upcoming fixtures for a specific league
   * @param {Object} league - League object
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Processing result for this league
   * @private
   */
  async processLeagueFixtures(league, jobData) {
    const result = {
      fixturesCollected: 0,
      itemsProcessed: 0,
      leagueId: league.leagueId
    };

    try {
      if (this.scrapingEngine) {
        // Navigate to league fixtures page
        const fixturesUrl = this.buildFixturesUrl(league, jobData);
        await this.scrapingEngine.navigateToPage(fixturesUrl);
        
        // Process fixtures for the specified date range
        const daysAhead = jobData.daysAhead || 7;
        const fixtures = await this.extractUpcomingFixtures(league, daysAhead);
        
        result.fixturesCollected = fixtures.length;
        result.itemsProcessed = fixtures.length;
        
      } else {
        // Mock processing for testing
        result.fixturesCollected = Math.floor(Math.random() * 15) + 5;
        result.itemsProcessed = result.fixturesCollected;
      }

    } catch (error) {
      this.logger.error('Failed to process league fixtures', {
        leagueId: league.leagueId,
        error: error.message
      });
      throw error;
    }

    return result;
  }

  /**
   * Build fixtures URL for a league
   * @param {Object} league - League object
   * @param {Object} jobData - Job data
   * @returns {string} Fixtures URL
   * @private
   */
  buildFixturesUrl(league, jobData) {
    const baseUrl = league.flashscoreUrl || 'https://www.flashscore.com/';
    
    // Add fixtures path
    const fixturesUrl = baseUrl.endsWith('/') ? baseUrl + 'fixtures/' : baseUrl + '/fixtures/';
    
    return fixturesUrl;
  }

  /**
   * Extract upcoming fixtures from the current page
   * @param {Object} league - League object
   * @param {number} daysAhead - Number of days to look ahead
   * @returns {Promise<Array>} Array of fixture objects
   * @private
   */
  async extractUpcomingFixtures(league, daysAhead) {
    const fixtures = [];

    try {
      if (!this.dataParser) {
        // Return mock data for testing
        const mockFixtures = [];
        for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
          const futureDate = new Date(Date.now() + Math.random() * daysAhead * 24 * 60 * 60 * 1000);
          mockFixtures.push({
            matchId: `${league.leagueId}_fixture_${i}`,
            homeTeam: `Team ${i * 2 + 1}`,
            awayTeam: `Team ${i * 2 + 2}`,
            matchDateTime: futureDate,
            status: 'scheduled',
            venue: `Stadium ${i + 1}`
          });
        }
        return mockFixtures;
      }

      // Extract fixture data from current page
      const html = await this.scrapingEngine.getPageContent();
      const pageFixtures = await this.dataParser.parseUpcomingFixtures(html);
      
      // Filter fixtures within the specified date range
      const cutoffDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      
      // Process and save each fixture
      for (const fixtureData of pageFixtures) {
        try {
          // Check if fixture is within date range
          const fixtureDate = new Date(fixtureData.matchDateTime);
          if (fixtureDate > cutoffDate) {
            continue;
          }

          // Enrich fixture data with league information
          fixtureData.leagueId = league.leagueId;
          fixtureData.country = league.country;
          
          // Save fixture data
          const saved = await this.saveUpcomingFixture(fixtureData);
          if (saved) {
            fixtures.push(fixtureData);
          }

        } catch (error) {
          this.logger.warn('Failed to save upcoming fixture', {
            matchId: fixtureData.matchId,
            error: error.message
          });
        }
      }

    } catch (error) {
      this.logger.error('Failed to extract upcoming fixtures', {
        leagueId: league.leagueId,
        error: error.message
      });
    }

    return fixtures;
  }

  /**
   * Save upcoming fixture data
   * @param {Object} fixtureData - Fixture data to save
   * @returns {Promise<boolean>} True if saved successfully
   * @private
   */
  async saveUpcomingFixture(fixtureData) {
    try {
      if (!this.databaseService) {
        // Mock save for testing
        this.logger.info('Mock: Saving upcoming fixture', {
          matchId: fixtureData.matchId,
          homeTeam: fixtureData.homeTeam,
          awayTeam: fixtureData.awayTeam,
          matchDateTime: fixtureData.matchDateTime
        });
        return true;
      }

      // Check if fixture already exists
      const existingMatch = await this.databaseService.getMatch(fixtureData.matchId);
      
      if (existingMatch) {
        // Update if fixture details have changed
        if (this.hasFixtureDataChanged(existingMatch, fixtureData)) {
          await this.databaseService.updateMatch(fixtureData.matchId, {
            matchDateTime: fixtureData.matchDateTime,
            status: fixtureData.status,
            venue: fixtureData.venue,
            lastUpdated: new Date()
          });
          return true;
        }
        return false;
      } else {
        // Create new fixture record
        await this.databaseService.createMatch({
          ...fixtureData,
          status: 'scheduled',
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        return true;
      }

    } catch (error) {
      this.logger.error('Failed to save upcoming fixture', {
        matchId: fixtureData.matchId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check if fixture data has changed
   * @param {Object} existingFixture - Existing fixture data
   * @param {Object} newFixture - New fixture data
   * @returns {boolean} True if data has changed
   * @private
   */
  hasFixtureDataChanged(existingFixture, newFixture) {
    return (
      existingFixture.matchDateTime !== newFixture.matchDateTime ||
      existingFixture.status !== newFixture.status ||
      existingFixture.venue !== newFixture.venue
    );
  }

  /**
   * Process fixture updates (for matches that have become live or completed)
   * @param {Array} fixtures - Array of fixtures to check for updates
   * @returns {Promise<number>} Number of fixtures updated
   * @private
   */
  async processFixtureUpdates(fixtures) {
    let updatedCount = 0;

    try {
      const now = new Date();
      
      for (const fixture of fixtures) {
        const fixtureDate = new Date(fixture.matchDateTime);
        
        // Check if fixture should now be live or completed
        if (fixtureDate <= now) {
          // Fixture time has passed, check current status
          const currentStatus = await this.checkFixtureStatus(fixture);
          
          if (currentStatus !== fixture.status) {
            await this.updateFixtureStatus(fixture.matchId, currentStatus);
            updatedCount++;
          }
        }
      }

    } catch (error) {
      this.logger.error('Failed to process fixture updates', {
        error: error.message
      });
    }

    return updatedCount;
  }

  /**
   * Check current status of a fixture
   * @param {Object} fixture - Fixture object
   * @returns {Promise<string>} Current fixture status
   * @private
   */
  async checkFixtureStatus(fixture) {
    try {
      if (!this.scrapingEngine) {
        // Mock status check
        const statuses = ['live', 'completed', 'postponed', 'cancelled'];
        return statuses[Math.floor(Math.random() * statuses.length)];
      }

      // Navigate to fixture page and check status
      await this.scrapingEngine.navigateToPage(fixture.flashscoreUrl);
      const status = await this.scrapingEngine.extractData({
        status: '.match-status'
      });

      return status.status || 'scheduled';

    } catch (error) {
      this.logger.warn('Failed to check fixture status', {
        matchId: fixture.matchId,
        error: error.message
      });
      return fixture.status; // Return existing status on error
    }
  }

  /**
   * Update fixture status in database
   * @param {string} matchId - Match ID
   * @param {string} newStatus - New status
   * @returns {Promise<void>}
   * @private
   */
  async updateFixtureStatus(matchId, newStatus) {
    try {
      if (!this.databaseService) {
        this.logger.info('Mock: Updating fixture status', { matchId, newStatus });
        return;
      }

      await this.databaseService.updateMatch(matchId, {
        status: newStatus,
        lastUpdated: new Date()
      });

    } catch (error) {
      this.logger.error('Failed to update fixture status', {
        matchId,
        newStatus,
        error: error.message
      });
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
          fixturesCollected: result.fixturesCollected
        }
      });

    } catch (error) {
      this.logger.error('Failed to update processing stats', {
        error: error.message
      });
    }
  }
}

module.exports = UpcomingFixturesProcessor;