const BaseProcessor = require('./BaseProcessor');
const TaskTypes = require('../TaskTypes');

/**
 * Processor for league discovery and competition hierarchy mapping
 */
class LeagueDiscoveryProcessor extends BaseProcessor {
  constructor(dependencies = {}) {
    super(dependencies);
    this.taskType = TaskTypes.LEAGUE_DISCOVERY;
  }

  /**
   * Process league discovery job
   * @param {Object} jobData - Job data containing discovery parameters
   * @param {Object} job - Bull job object
   * @returns {Promise<Object>} Processing result
   */
  async process(jobData, job) {
    this.validateJobData(jobData);
    this.logStart(jobData, job);

    const result = {
      success: false,
      itemsProcessed: 0,
      countriesProcessed: 0,
      leaguesDiscovered: 0,
      newLeagues: 0,
      errors: [],
      startTime: Date.now()
    };

    try {
      this.updateProgress(job, 10, 'Initializing league discovery');

      // Get countries to process
      const countries = await this.getCountriesToProcess(jobData);
      this.updateProgress(job, 20, `Found ${countries.length} countries to process`);

      if (countries.length === 0) {
        result.success = true;
        result.message = 'No countries found for league discovery';
        this.logCompletion(result, jobData, job);
        return result;
      }

      // Process each country
      const progressStep = 60 / countries.length;
      let currentProgress = 20;

      for (let i = 0; i < countries.length; i++) {
        if (this.shouldAbort(job)) {
          throw new Error('Job aborted');
        }

        const country = countries[i];
        
        try {
          this.updateProgress(job, currentProgress, `Processing country ${i + 1}/${countries.length}: ${country.name}`);
          
          const countryResult = await this.processCountryLeagues(country, jobData);
          
          result.countriesProcessed++;
          result.leaguesDiscovered += countryResult.leaguesDiscovered || 0;
          result.newLeagues += countryResult.newLeagues || 0;
          result.itemsProcessed += countryResult.itemsProcessed || 0;

        } catch (error) {
          this.logger.warn('Failed to process country leagues', {
            countryCode: country.code,
            countryName: country.name,
            error: error.message
          });
          result.errors.push({
            country: country.name,
            error: error.message
          });
        }

        currentProgress += progressStep;
      }

      this.updateProgress(job, 90, 'Finalizing league discovery');

      // Update processing statistics
      await this.updateProcessingStats(result, jobData);

      this.updateProgress(job, 100, 'League discovery completed');

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
   * Get countries that need league discovery processing
   * @param {Object} jobData - Job data
   * @returns {Promise<Array>} Array of country objects
   * @private
   */
  async getCountriesToProcess(jobData) {
    try {
      if (!this.databaseService) {
        // Return mock data for testing
        return [
          { code: 'GB', name: 'England', url: 'https://www.flashscore.com/football/england/' },
          { code: 'ES', name: 'Spain', url: 'https://www.flashscore.com/football/spain/' },
          { code: 'DE', name: 'Germany', url: 'https://www.flashscore.com/football/germany/' },
          { code: 'IT', name: 'Italy', url: 'https://www.flashscore.com/football/italy/' },
          { code: 'FR', name: 'France', url: 'https://www.flashscore.com/football/france/' }
        ];
      }

      // Get countries that need league discovery updates
      const countries = await this.databaseService.getCountriesForDiscovery();
      
      // If no specific countries, discover from main football page
      if (countries.length === 0) {
        return await this.discoverCountriesFromMainPage();
      }

      return countries;

    } catch (error) {
      this.logger.error('Failed to get countries for processing', { error: error.message });
      return [];
    }
  }

  /**
   * Discover countries from the main football page
   * @returns {Promise<Array>} Array of discovered countries
   * @private
   */
  async discoverCountriesFromMainPage() {
    try {
      if (!this.scrapingEngine) {
        // Return default countries for testing
        return [
          { code: 'GB', name: 'England', url: 'https://www.flashscore.com/football/england/' },
          { code: 'ES', name: 'Spain', url: 'https://www.flashscore.com/football/spain/' }
        ];
      }

      await this.scrapingEngine.navigateToPage('https://www.flashscore.com/football/');
      
      // Extract country links
      const countries = await this.scrapingEngine.extractData({
        countries: '.country-list .country-link'
      });

      return countries.countries || [];

    } catch (error) {
      this.logger.error('Failed to discover countries from main page', { error: error.message });
      return [];
    }
  }

  /**
   * Process leagues for a specific country
   * @param {Object} country - Country object
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Processing result for this country
   * @private
   */
  async processCountryLeagues(country, jobData) {
    const result = {
      leaguesDiscovered: 0,
      newLeagues: 0,
      itemsProcessed: 0,
      countryCode: country.code
    };

    try {
      if (this.scrapingEngine) {
        // Navigate to country football page
        await this.scrapingEngine.navigateToPage(country.url);
        
        // Extract leagues for this country
        const leagues = await this.extractCountryLeagues(country);
        
        result.leaguesDiscovered = leagues.length;
        result.itemsProcessed = leagues.length;
        
        // Process each discovered league
        for (const league of leagues) {
          const isNew = await this.processDiscoveredLeague(league, country);
          if (isNew) {
            result.newLeagues++;
          }
        }
        
      } else {
        // Mock processing for testing
        result.leaguesDiscovered = Math.floor(Math.random() * 8) + 2;
        result.newLeagues = Math.floor(result.leaguesDiscovered * 0.3);
        result.itemsProcessed = result.leaguesDiscovered;
      }

    } catch (error) {
      this.logger.error('Failed to process country leagues', {
        countryCode: country.code,
        error: error.message
      });
      throw error;
    }

    return result;
  }

  /**
   * Extract leagues from a country page
   * @param {Object} country - Country object
   * @returns {Promise<Array>} Array of league objects
   * @private
   */
  async extractCountryLeagues(country) {
    const leagues = [];

    try {
      if (!this.dataParser) {
        // Return mock data for testing
        const mockLeagues = [];
        const leagueNames = ['Premier League', 'Championship', 'League One', 'League Two', 'FA Cup'];
        
        for (let i = 0; i < Math.floor(Math.random() * 5) + 3; i++) {
          mockLeagues.push({
            name: leagueNames[i] || `League ${i + 1}`,
            url: `${country.url}league-${i + 1}/`,
            tier: i + 1,
            type: i === 4 ? 'cup' : 'league'
          });
        }
        return mockLeagues;
      }

      // Extract league data from current page
      const html = await this.scrapingEngine.getPageContent();
      const pageLeagues = await this.dataParser.parseCountryLeagues(html);
      
      // Process and enrich league data
      for (const leagueData of pageLeagues) {
        try {
          // Generate league ID
          leagueData.leagueId = this.generateLeagueId(leagueData.name, country.code);
          leagueData.country = country.name;
          leagueData.countryCode = country.code;
          leagueData.flashscoreUrl = leagueData.url;
          
          leagues.push(leagueData);

        } catch (error) {
          this.logger.warn('Failed to process league data', {
            leagueName: leagueData.name,
            error: error.message
          });
        }
      }

    } catch (error) {
      this.logger.error('Failed to extract country leagues', {
        countryCode: country.code,
        error: error.message
      });
    }

    return leagues;
  }

  /**
   * Process a discovered league
   * @param {Object} league - League object
   * @param {Object} country - Country object
   * @returns {Promise<boolean>} True if league is new
   * @private
   */
  async processDiscoveredLeague(league, country) {
    try {
      if (!this.databaseService) {
        // Mock processing for testing
        this.logger.info('Mock: Processing discovered league', {
          leagueId: league.leagueId,
          name: league.name,
          country: country.name
        });
        return Math.random() > 0.7; // 30% chance of being new
      }

      // Check if league already exists
      const existingLeague = await this.databaseService.getLeague(league.leagueId);
      
      if (existingLeague) {
        // Update league information if changed
        if (this.hasLeagueDataChanged(existingLeague, league)) {
          await this.databaseService.updateLeague(league.leagueId, {
            name: league.name,
            flashscoreUrl: league.flashscoreUrl,
            tier: league.tier,
            type: league.type,
            lastUpdated: new Date()
          });
        }
        return false;
      } else {
        // Create new league record
        await this.databaseService.createLeague({
          ...league,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        
        this.logger.info('New league discovered', {
          leagueId: league.leagueId,
          name: league.name,
          country: country.name
        });
        
        return true;
      }

    } catch (error) {
      this.logger.error('Failed to process discovered league', {
        leagueId: league.leagueId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Generate a unique league ID
   * @param {string} leagueName - League name
   * @param {string} countryCode - Country code
   * @returns {string} Generated league ID
   * @private
   */
  generateLeagueId(leagueName, countryCode) {
    const cleanName = leagueName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    return `${countryCode.toLowerCase()}_${cleanName}`;
  }

  /**
   * Check if league data has changed
   * @param {Object} existingLeague - Existing league data
   * @param {Object} newLeague - New league data
   * @returns {boolean} True if data has changed
   * @private
   */
  hasLeagueDataChanged(existingLeague, newLeague) {
    return (
      existingLeague.name !== newLeague.name ||
      existingLeague.flashscoreUrl !== newLeague.flashscoreUrl ||
      existingLeague.tier !== newLeague.tier ||
      existingLeague.type !== newLeague.type
    );
  }

  /**
   * Discover league hierarchy and relationships
   * @param {Array} leagues - Array of leagues
   * @returns {Promise<void>}
   * @private
   */
  async discoverLeagueHierarchy(leagues) {
    try {
      // Group leagues by type and tier
      const leagueHierarchy = {
        domestic: [],
        cups: [],
        international: []
      };

      for (const league of leagues) {
        if (league.type === 'cup') {
          leagueHierarchy.cups.push(league);
        } else if (league.type === 'international') {
          leagueHierarchy.international.push(league);
        } else {
          leagueHierarchy.domestic.push(league);
        }
      }

      // Sort domestic leagues by tier
      leagueHierarchy.domestic.sort((a, b) => (a.tier || 99) - (b.tier || 99));

      // Store hierarchy information
      if (this.databaseService) {
        await this.databaseService.updateLeagueHierarchy(leagueHierarchy);
      }

    } catch (error) {
      this.logger.error('Failed to discover league hierarchy', {
        error: error.message
      });
    }
  }

  /**
   * Validate discovered league data
   * @param {Object} league - League object to validate
   * @returns {boolean} True if valid
   * @private
   */
  validateLeagueData(league) {
    if (!league.name || typeof league.name !== 'string') {
      return false;
    }

    if (!league.url || typeof league.url !== 'string') {
      return false;
    }

    if (!league.country || typeof league.country !== 'string') {
      return false;
    }

    return true;
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
          countriesProcessed: result.countriesProcessed,
          leaguesDiscovered: result.leaguesDiscovered,
          newLeagues: result.newLeagues
        }
      });

    } catch (error) {
      this.logger.error('Failed to update processing stats', {
        error: error.message
      });
    }
  }
}

module.exports = LeagueDiscoveryProcessor;