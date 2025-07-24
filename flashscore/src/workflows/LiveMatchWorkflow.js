const logger = require('../utils/logger');
const ScrapingEngine = require('../scraper/ScrapingEngine');
const NetworkInterceptor = require('../scraper/NetworkInterceptor');
const DataParser = require('../parser/DataParser');
const DatabaseService = require('../storage/DatabaseService');
const TaskManager = require('../queue/TaskManager');
const TaskTypes = require('../queue/TaskTypes');

/**
 * Live Match Data Collection Workflow
 * Orchestrates real-time match monitoring with WebSocket integration and database updates
 */
class LiveMatchWorkflow {
  constructor(config = {}) {
    this.config = {
      updateInterval: config.updateInterval || 60000, // 1 minute default
      maxConcurrentMatches: config.maxConcurrentMatches || 5,
      enableWebSocket: config.enableWebSocket !== false, // Default to true
      enableNetworkInterception: config.enableNetworkInterception !== false,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000,
      ...config
    };

    this.scrapingEngine = null;
    this.networkInterceptor = null;
    this.dataParser = new DataParser();
    this.databaseService = new DatabaseService();
    this.taskManager = new TaskManager();
    
    this.isRunning = false;
    this.activeMatches = new Map();
    this.webSocketConnections = new Map();
    this.updateIntervals = new Map();
    
    this.logger = logger.child({ component: 'LiveMatchWorkflow' });
  }

  /**
   * Initialize the workflow
   */
  async initialize() {
    try {
      this.logger.info('Initializing Live Match Workflow');

      // Initialize database service
      await this.databaseService.initialize();
      
      // Initialize task manager
      await this.taskManager.initialize();
      
      // Initialize scraping engine
      this.scrapingEngine = new ScrapingEngine(this.config.scraping);
      await this.scrapingEngine.initializeBrowser();
      
      // Initialize network interceptor if enabled
      if (this.config.enableNetworkInterception) {
        this.networkInterceptor = new NetworkInterceptor(
          this.scrapingEngine.page, 
          this.config.networkInterception
        );
        await this.networkInterceptor.startInterception();
      }

      this.logger.info('Live Match Workflow initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Live Match Workflow', { error: error.message });
      throw error;
    }
  }

  /**
   * Start the live match collection workflow
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Live Match Workflow is already running');
      return;
    }

    try {
      this.logger.info('Starting Live Match Workflow');
      
      if (!this.scrapingEngine) {
        await this.initialize();
      }

      this.isRunning = true;

      // Start the main collection loop
      await this.startCollectionLoop();

      this.logger.info('Live Match Workflow started successfully');
    } catch (error) {
      this.logger.error('Failed to start Live Match Workflow', { error: error.message });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the live match collection workflow
   */
  async stop() {
    if (!this.isRunning) {
      this.logger.warn('Live Match Workflow is not running');
      return;
    }

    try {
      this.logger.info('Stopping Live Match Workflow');
      
      this.isRunning = false;

      // Clear all intervals
      for (const [matchId, intervalId] of this.updateIntervals) {
        clearInterval(intervalId);
        this.logger.debug('Cleared update interval for match', { matchId });
      }
      this.updateIntervals.clear();

      // Close WebSocket connections
      for (const [matchId, connection] of this.webSocketConnections) {
        if (connection.close) {
          connection.close();
        }
        this.logger.debug('Closed WebSocket connection for match', { matchId });
      }
      this.webSocketConnections.clear();

      // Stop network interception
      if (this.networkInterceptor) {
        await this.networkInterceptor.stopInterception();
      }

      // Close scraping engine
      if (this.scrapingEngine) {
        await this.scrapingEngine.closeBrowser();
      }

      // Close database connection
      await this.databaseService.close();

      this.activeMatches.clear();

      this.logger.info('Live Match Workflow stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping Live Match Workflow', { error: error.message });
      throw error;
    }
  }

  /**
   * Start the main collection loop
   */
  async startCollectionLoop() {
    this.logger.info('Starting live match collection loop');

    // Initial discovery of live matches
    await this.discoverLiveMatches();

    // Set up periodic discovery of new live matches
    this.discoveryInterval = setInterval(async () => {
      if (this.isRunning) {
        try {
          await this.discoverLiveMatches();
        } catch (error) {
          this.logger.error('Error in live match discovery', { error: error.message });
        }
      }
    }, this.config.updateInterval);
  }

  /**
   * Discover currently live matches
   */
  async discoverLiveMatches() {
    try {
      this.logger.info('Discovering live matches');

      // Navigate to Flashscore live scores page
      await this.scrapingEngine.navigateToPage('https://www.flashscore.com/');

      // Extract live match data
      const liveMatchesData = await this.scrapingEngine.extractData({
        liveMatches: {
          selector: '.event__match--live',
          multiple: true,
          attribute: 'href'
        }
      });

      const liveMatchUrls = liveMatchesData.liveMatches || [];
      this.logger.info('Found live matches', { count: liveMatchUrls.length });

      // Process each live match
      for (const matchUrl of liveMatchUrls.slice(0, this.config.maxConcurrentMatches)) {
        const matchId = this.extractMatchIdFromUrl(matchUrl);
        
        if (!this.activeMatches.has(matchId)) {
          await this.startMonitoringMatch(matchId, matchUrl);
        }
      }

      // Stop monitoring matches that are no longer live
      await this.cleanupInactiveMatches(liveMatchUrls);

    } catch (error) {
      this.logger.error('Failed to discover live matches', { error: error.message });
      throw error;
    }
  }

  /**
   * Start monitoring a specific live match
   */
  async startMonitoringMatch(matchId, matchUrl) {
    try {
      this.logger.info('Starting to monitor live match', { matchId, matchUrl });

      const matchData = {
        matchId,
        url: matchUrl,
        startTime: new Date(),
        lastUpdate: null,
        updateCount: 0,
        status: 'monitoring'
      };

      this.activeMatches.set(matchId, matchData);

      // Initial data collection
      await this.collectMatchData(matchId, matchUrl);

      // Set up periodic updates
      const intervalId = setInterval(async () => {
        if (this.isRunning && this.activeMatches.has(matchId)) {
          try {
            await this.collectMatchData(matchId, matchUrl);
          } catch (error) {
            this.logger.error('Error collecting match data', { 
              matchId, 
              error: error.message 
            });
          }
        }
      }, this.config.updateInterval);

      this.updateIntervals.set(matchId, intervalId);

      // Set up WebSocket monitoring if enabled
      if (this.config.enableWebSocket) {
        await this.setupWebSocketMonitoring(matchId, matchUrl);
      }

      this.logger.info('Successfully started monitoring match', { matchId });

    } catch (error) {
      this.logger.error('Failed to start monitoring match', { 
        matchId, 
        matchUrl, 
        error: error.message 
      });
      
      // Clean up on failure
      this.stopMonitoringMatch(matchId);
      throw error;
    }
  }

  /**
   * Collect data for a specific match
   */
  async collectMatchData(matchId, matchUrl) {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Collecting match data', { matchId });

      // Navigate to match page
      await this.scrapingEngine.navigateToPage(matchUrl);

      // Extract match data using data parser
      const html = await this.scrapingEngine.getPageContent();
      const matchData = await this.dataParser.parseMatchData(html);

      if (!matchData) {
        this.logger.warn('No match data extracted', { matchId });
        return;
      }

      // Enhance match data
      matchData.matchId = matchId;
      matchData.flashscoreUrl = matchUrl;
      matchData.lastUpdated = new Date();

      // Save match data to database
      await this.saveMatchData(matchData);

      // Process match events
      if (matchData.events && matchData.events.length > 0) {
        await this.processMatchEvents(matchData.events, matchId);
      }

      // Process match statistics
      if (matchData.stats && matchData.stats.length > 0) {
        await this.processMatchStats(matchData.stats, matchId);
      }

      // Update monitoring data
      const monitoringData = this.activeMatches.get(matchId);
      if (monitoringData) {
        monitoringData.lastUpdate = new Date();
        monitoringData.updateCount++;
        monitoringData.lastStatus = matchData.status;
      }

      const duration = Date.now() - startTime;
      this.logger.info('Match data collected successfully', { 
        matchId, 
        status: matchData.status,
        score: matchData.currentScore || matchData.finalScore,
        duration 
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to collect match data', { 
        matchId, 
        matchUrl, 
        duration,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Set up WebSocket monitoring for real-time updates
   */
  async setupWebSocketMonitoring(matchId, matchUrl) {
    try {
      this.logger.info('Setting up WebSocket monitoring', { matchId });

      // Navigate to match page to establish WebSocket connections
      await this.scrapingEngine.navigateToPage(matchUrl);

      // Wait for WebSocket connections to be established
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get WebSocket connections from network interceptor
      if (this.networkInterceptor) {
        const wsConnections = this.networkInterceptor.getWebSocketConnections();
        
        for (const connection of wsConnections) {
          if (connection.url.includes('live') || connection.url.includes('feed')) {
            this.webSocketConnections.set(matchId, connection);
            
            this.logger.info('WebSocket connection established for match', { 
              matchId, 
              wsUrl: connection.url 
            });

            // Monitor WebSocket messages for real-time updates
            this.monitorWebSocketMessages(matchId, connection);
            break;
          }
        }
      }

    } catch (error) {
      this.logger.error('Failed to setup WebSocket monitoring', { 
        matchId, 
        error: error.message 
      });
      // Don't throw error as WebSocket is optional
    }
  }

  /**
   * Monitor WebSocket messages for real-time match updates
   */
  monitorWebSocketMessages(matchId, connection) {
    this.logger.info('Starting WebSocket message monitoring', { matchId });

    // Process existing messages
    for (const message of connection.messages) {
      if (message.type === 'received' && message.jsonData) {
        this.processWebSocketMessage(matchId, message.jsonData);
      }
    }

    // Note: In a real implementation, you would set up event listeners
    // for new WebSocket messages. Since we're using the NetworkInterceptor,
    // messages are already being captured and can be processed periodically.
    
    const wsMonitorInterval = setInterval(() => {
      if (!this.isRunning || !this.activeMatches.has(matchId)) {
        clearInterval(wsMonitorInterval);
        return;
      }

      // Check for new messages
      const recentMessages = connection.messages.filter(msg => 
        msg.type === 'received' && 
        msg.jsonData &&
        new Date(msg.timestamp) > new Date(Date.now() - this.config.updateInterval)
      );

      for (const message of recentMessages) {
        this.processWebSocketMessage(matchId, message.jsonData);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Process WebSocket message for real-time updates
   */
  async processWebSocketMessage(matchId, messageData) {
    try {
      this.logger.debug('Processing WebSocket message', { matchId, messageType: messageData.type });

      // Parse different types of WebSocket messages
      if (messageData.type === 'score_update') {
        await this.handleScoreUpdate(matchId, messageData);
      } else if (messageData.type === 'match_event') {
        await this.handleMatchEvent(matchId, messageData);
      } else if (messageData.type === 'match_status') {
        await this.handleMatchStatusUpdate(matchId, messageData);
      }

    } catch (error) {
      this.logger.error('Failed to process WebSocket message', { 
        matchId, 
        error: error.message 
      });
    }
  }

  /**
   * Handle real-time score updates
   */
  async handleScoreUpdate(matchId, scoreData) {
    try {
      this.logger.info('Processing score update', { matchId, score: scoreData.score });

      // Update match in database
      await this.databaseService.updateMatch(matchId, {
        finalScore: scoreData.score,
        lastUpdated: new Date()
      });

      // Update monitoring data
      const monitoringData = this.activeMatches.get(matchId);
      if (monitoringData) {
        monitoringData.lastUpdate = new Date();
        monitoringData.lastScore = scoreData.score;
      }

    } catch (error) {
      this.logger.error('Failed to handle score update', { 
        matchId, 
        error: error.message 
      });
    }
  }

  /**
   * Handle real-time match events
   */
  async handleMatchEvent(matchId, eventData) {
    try {
      this.logger.info('Processing match event', { 
        matchId, 
        eventType: eventData.type,
        minute: eventData.minute 
      });

      // Create match event
      const eventId = `${matchId}_${eventData.type}_${eventData.minute}_${Date.now()}`;
      
      await this.databaseService.createMatchEvent({
        eventId,
        matchId,
        eventType: eventData.type,
        minute: eventData.minute,
        playerName: eventData.player,
        description: eventData.description || `${eventData.type} at ${eventData.minute}'`
      });

    } catch (error) {
      this.logger.error('Failed to handle match event', { 
        matchId, 
        error: error.message 
      });
    }
  }

  /**
   * Handle match status updates
   */
  async handleMatchStatusUpdate(matchId, statusData) {
    try {
      this.logger.info('Processing status update', { 
        matchId, 
        status: statusData.status 
      });

      // Update match status
      await this.databaseService.updateMatch(matchId, {
        status: statusData.status,
        lastUpdated: new Date()
      });

      // If match is finished, stop monitoring
      if (statusData.status === 'finished' || statusData.status === 'ended') {
        this.logger.info('Match finished, stopping monitoring', { matchId });
        this.stopMonitoringMatch(matchId);
      }

    } catch (error) {
      this.logger.error('Failed to handle status update', { 
        matchId, 
        error: error.message 
      });
    }
  }

  /**
   * Save match data to database
   */
  async saveMatchData(matchData) {
    try {
      // Check if match exists
      const existingMatch = await this.databaseService.getMatch(matchData.matchId);
      
      if (existingMatch) {
        // Update existing match
        await this.databaseService.updateMatch(matchData.matchId, {
          status: matchData.status,
          finalScore: matchData.currentScore || matchData.finalScore,
          halfTimeScore: matchData.halfTimeScore,
          lastUpdated: matchData.lastUpdated
        });
      } else {
        // Create new match
        await this.databaseService.createMatch({
          matchId: matchData.matchId,
          leagueId: matchData.leagueId || 'unknown',
          homeTeam: matchData.homeTeam,
          awayTeam: matchData.awayTeam,
          matchDatetime: matchData.matchDatetime || new Date(),
          status: matchData.status,
          finalScore: matchData.currentScore || matchData.finalScore,
          halfTimeScore: matchData.halfTimeScore,
          flashscoreUrl: matchData.flashscoreUrl
        });
      }

    } catch (error) {
      this.logger.error('Failed to save match data', { 
        matchId: matchData.matchId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process and save match events
   */
  async processMatchEvents(events, matchId) {
    let processedCount = 0;

    try {
      for (const event of events) {
        const eventId = `${matchId}_${event.type}_${event.minute}_${event.player || 'unknown'}`;
        
        // Check if event already exists
        const existingEvents = await this.databaseService.getMatchEvents(matchId);
        const eventExists = existingEvents.some(e => e.eventId === eventId);
        
        if (!eventExists) {
          await this.databaseService.createMatchEvent({
            eventId,
            matchId,
            eventType: event.type,
            minute: event.minute,
            playerName: event.player,
            description: event.description || `${event.type} by ${event.player} at ${event.minute}'`
          });
          processedCount++;
        }
      }

      if (processedCount > 0) {
        this.logger.info('Processed match events', { matchId, count: processedCount });
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
   * Process and save match statistics
   */
  async processMatchStats(stats, matchId) {
    let processedCount = 0;

    try {
      for (const stat of stats) {
        const statId = `${matchId}_${stat.name}`;
        
        await this.databaseService.createMatchStat({
          statId,
          matchId,
          statName: stat.name,
          homeValue: stat.homeValue,
          awayValue: stat.awayValue
        });
        processedCount++;
      }

      if (processedCount > 0) {
        this.logger.info('Processed match statistics', { matchId, count: processedCount });
      }

    } catch (error) {
      this.logger.error('Failed to process match statistics', { 
        matchId, 
        error: error.message 
      });
    }

    return processedCount;
  }

  /**
   * Stop monitoring a specific match
   */
  stopMonitoringMatch(matchId) {
    try {
      this.logger.info('Stopping monitoring for match', { matchId });

      // Clear update interval
      if (this.updateIntervals.has(matchId)) {
        clearInterval(this.updateIntervals.get(matchId));
        this.updateIntervals.delete(matchId);
      }

      // Close WebSocket connection
      if (this.webSocketConnections.has(matchId)) {
        const connection = this.webSocketConnections.get(matchId);
        if (connection.close) {
          connection.close();
        }
        this.webSocketConnections.delete(matchId);
      }

      // Remove from active matches
      this.activeMatches.delete(matchId);

      this.logger.info('Stopped monitoring match', { matchId });

    } catch (error) {
      this.logger.error('Error stopping match monitoring', { 
        matchId, 
        error: error.message 
      });
    }
  }

  /**
   * Clean up matches that are no longer live
   */
  async cleanupInactiveMatches(currentLiveUrls) {
    const currentMatchIds = currentLiveUrls.map(url => this.extractMatchIdFromUrl(url));
    
    for (const [matchId, matchData] of this.activeMatches) {
      if (!currentMatchIds.includes(matchId)) {
        // Check if match has been inactive for too long
        const timeSinceLastUpdate = Date.now() - (matchData.lastUpdate?.getTime() || matchData.startTime.getTime());
        
        if (timeSinceLastUpdate > this.config.updateInterval * 3) { // 3 missed updates
          this.logger.info('Cleaning up inactive match', { matchId });
          this.stopMonitoringMatch(matchId);
        }
      }
    }
  }

  /**
   * Extract match ID from Flashscore URL
   */
  extractMatchIdFromUrl(url) {
    // Extract match ID from URL pattern like: /match/abc123def/
    const match = url.match(/\/match\/([^\/]+)/);
    return match ? match[1] : url.split('/').pop();
  }

  /**
   * Get workflow status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeMatches: this.activeMatches.size,
      webSocketConnections: this.webSocketConnections.size,
      updateIntervals: this.updateIntervals.size,
      config: this.config,
      matches: Array.from(this.activeMatches.entries()).map(([id, data]) => ({
        matchId: id,
        url: data.url,
        startTime: data.startTime,
        lastUpdate: data.lastUpdate,
        updateCount: data.updateCount,
        status: data.status
      }))
    };
  }

  /**
   * Add a specific match to monitoring (for testing or manual addition)
   */
  async addMatch(matchUrl) {
    const matchId = this.extractMatchIdFromUrl(matchUrl);
    
    if (this.activeMatches.has(matchId)) {
      this.logger.warn('Match already being monitored', { matchId });
      return;
    }

    await this.startMonitoringMatch(matchId, matchUrl);
    this.logger.info('Manually added match to monitoring', { matchId, matchUrl });
  }

  /**
   * Remove a specific match from monitoring
   */
  removeMatch(matchId) {
    if (!this.activeMatches.has(matchId)) {
      this.logger.warn('Match not being monitored', { matchId });
      return;
    }

    this.stopMonitoringMatch(matchId);
    this.logger.info('Manually removed match from monitoring', { matchId });
  }
}

module.exports = LiveMatchWorkflow;