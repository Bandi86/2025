const { expect } = require('chai');
const LiveMatchWorkflow = require('../src/workflows/LiveMatchWorkflow');
const DatabaseService = require('../src/storage/DatabaseService');

describe('LiveMatchWorkflow', function() {
  this.timeout(30000); // 30 second timeout for integration tests

  let workflow;
  let testDbPath;

  beforeEach(async function() {
    // Use in-memory database for testing
    testDbPath = ':memory:';
    
    workflow = new LiveMatchWorkflow({
      updateInterval: 5000, // 5 seconds for testing
      maxConcurrentMatches: 2,
      enableWebSocket: false, // Disable for unit tests
      enableNetworkInterception: false, // Disable for unit tests
      scraping: {
        headless: true,
        timeout: 10000
      }
    });
  });

  afterEach(async function() {
    if (workflow && workflow.isRunning) {
      await workflow.stop();
    }
  });

  describe('Initialization', function() {
    it('should initialize successfully', async function() {
      await workflow.initialize();
      
      expect(workflow.scrapingEngine).to.not.be.null;
      expect(workflow.databaseService).to.not.be.null;
      expect(workflow.dataParser).to.not.be.null;
      expect(workflow.taskManager).to.not.be.null;
    });

    it('should handle initialization errors gracefully', async function() {
      // Create workflow with invalid config
      const invalidWorkflow = new LiveMatchWorkflow({
        scraping: {
          browserType: 'invalid-browser'
        }
      });

      try {
        await invalidWorkflow.initialize();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Browser initialization failed');
      }
    });
  });

  describe('Match ID Extraction', function() {
    it('should extract match ID from Flashscore URL', function() {
      const testUrls = [
        'https://www.flashscore.com/match/abc123def/',
        '/match/xyz789ghi/summary',
        'https://flashscore.com/match/test-match-id/live'
      ];

      const expectedIds = ['abc123def', 'xyz789ghi', 'test-match-id'];

      testUrls.forEach((url, index) => {
        const matchId = workflow.extractMatchIdFromUrl(url);
        expect(matchId).to.equal(expectedIds[index]);
      });
    });

    it('should handle malformed URLs', function() {
      const malformedUrls = [
        'invalid-url',
        'https://example.com/no-match-pattern',
        ''
      ];

      malformedUrls.forEach(url => {
        const matchId = workflow.extractMatchIdFromUrl(url);
        expect(matchId).to.be.a('string');
        expect(matchId.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Status and Monitoring', function() {
    it('should return correct initial status', function() {
      const status = workflow.getStatus();
      
      expect(status.isRunning).to.be.false;
      expect(status.activeMatches).to.equal(0);
      expect(status.webSocketConnections).to.equal(0);
      expect(status.updateIntervals).to.equal(0);
      expect(status.matches).to.be.an('array').that.is.empty;
    });

    it('should track active matches', async function() {
      // Mock a match URL
      const testMatchUrl = 'https://www.flashscore.com/match/test123/';
      const matchId = workflow.extractMatchIdFromUrl(testMatchUrl);

      // Add match data manually for testing
      workflow.activeMatches.set(matchId, {
        url: testMatchUrl,
        startTime: new Date(),
        lastUpdate: new Date(),
        updateCount: 5,
        status: 'live'
      });

      const status = workflow.getStatus();
      
      expect(status.activeMatches).to.equal(1);
      expect(status.matches).to.have.length(1);
      expect(status.matches[0].matchId).to.equal(matchId);
      expect(status.matches[0].url).to.equal(testMatchUrl);
      expect(status.matches[0].updateCount).to.equal(5);
    });
  });

  describe('Match Data Processing', function() {
    beforeEach(async function() {
      await workflow.initialize();
    });

    it('should save match data to database', async function() {
      const testMatchData = {
        matchId: 'test-match-123',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        currentScore: '2-1',
        status: 'live',
        matchDatetime: new Date(),
        flashscoreUrl: 'https://www.flashscore.com/match/test-match-123/'
      };

      await workflow.saveMatchData(testMatchData);

      // Verify match was saved
      const savedMatch = await workflow.databaseService.getMatch('test-match-123');
      expect(savedMatch).to.not.be.null;
      expect(savedMatch.homeTeam).to.equal('Team A');
      expect(savedMatch.awayTeam).to.equal('Team B');
      expect(savedMatch.finalScore).to.equal('2-1');
      expect(savedMatch.status).to.equal('live');
    });

    it('should update existing match data', async function() {
      const initialMatchData = {
        matchId: 'test-match-456',
        homeTeam: 'Team C',
        awayTeam: 'Team D',
        currentScore: '0-0',
        status: 'live',
        matchDatetime: new Date(),
        flashscoreUrl: 'https://www.flashscore.com/match/test-match-456/'
      };

      // Save initial data
      await workflow.saveMatchData(initialMatchData);

      // Update with new score
      const updatedMatchData = {
        ...initialMatchData,
        currentScore: '1-0',
        lastUpdated: new Date()
      };

      await workflow.saveMatchData(updatedMatchData);

      // Verify update
      const savedMatch = await workflow.databaseService.getMatch('test-match-456');
      expect(savedMatch.finalScore).to.equal('1-0');
    });

    it('should process match events', async function() {
      const testEvents = [
        {
          type: 'goal',
          minute: 23,
          player: 'Player A',
          description: 'Goal scored'
        },
        {
          type: 'yellow_card',
          minute: 45,
          player: 'Player B',
          description: 'Yellow card'
        }
      ];

      const matchId = 'test-match-events';
      const processedCount = await workflow.processMatchEvents(testEvents, matchId);

      expect(processedCount).to.equal(2);

      // Verify events were saved
      const savedEvents = await workflow.databaseService.getMatchEvents(matchId);
      expect(savedEvents).to.have.length(2);
      expect(savedEvents[0].eventType).to.equal('goal');
      expect(savedEvents[1].eventType).to.equal('yellow_card');
    });

    it('should process match statistics', async function() {
      const testStats = [
        {
          name: 'possession',
          homeValue: '60%',
          awayValue: '40%'
        },
        {
          name: 'shots',
          homeValue: '8',
          awayValue: '5'
        }
      ];

      const matchId = 'test-match-stats';
      const processedCount = await workflow.processMatchStats(testStats, matchId);

      expect(processedCount).to.equal(2);

      // Verify stats were saved
      const savedStats = await workflow.databaseService.getMatchStats(matchId);
      expect(savedStats).to.have.length(2);
      expect(savedStats[0].statName).to.equal('possession');
      expect(savedStats[1].statName).to.equal('shots');
    });
  });

  describe('WebSocket Message Processing', function() {
    beforeEach(async function() {
      await workflow.initialize();
    });

    it('should handle score updates', async function() {
      const matchId = 'test-ws-match';
      
      // Create initial match
      await workflow.saveMatchData({
        matchId,
        homeTeam: 'Team E',
        awayTeam: 'Team F',
        currentScore: '0-0',
        status: 'live',
        matchDatetime: new Date(),
        flashscoreUrl: 'https://www.flashscore.com/match/test-ws-match/'
      });

      // Simulate score update
      await workflow.handleScoreUpdate(matchId, { score: '1-0' });

      // Verify update
      const updatedMatch = await workflow.databaseService.getMatch(matchId);
      expect(updatedMatch.finalScore).to.equal('1-0');
    });

    it('should handle match events', async function() {
      const matchId = 'test-ws-events';
      
      const eventData = {
        type: 'goal',
        minute: 67,
        player: 'Player C',
        description: 'Header goal'
      };

      await workflow.handleMatchEvent(matchId, eventData);

      // Verify event was created
      const events = await workflow.databaseService.getMatchEvents(matchId);
      expect(events).to.have.length(1);
      expect(events[0].eventType).to.equal('goal');
      expect(events[0].minute).to.equal(67);
      expect(events[0].playerName).to.equal('Player C');
    });

    it('should handle status updates', async function() {
      const matchId = 'test-ws-status';
      
      // Create initial match
      await workflow.saveMatchData({
        matchId,
        homeTeam: 'Team G',
        awayTeam: 'Team H',
        currentScore: '2-1',
        status: 'live',
        matchDatetime: new Date(),
        flashscoreUrl: 'https://www.flashscore.com/match/test-ws-status/'
      });

      // Add to active matches
      workflow.activeMatches.set(matchId, {
        url: 'https://www.flashscore.com/match/test-ws-status/',
        startTime: new Date(),
        status: 'live'
      });

      // Simulate status update to finished
      await workflow.handleMatchStatusUpdate(matchId, { status: 'finished' });

      // Verify status update and cleanup
      const updatedMatch = await workflow.databaseService.getMatch(matchId);
      expect(updatedMatch.status).to.equal('finished');
      expect(workflow.activeMatches.has(matchId)).to.be.false;
    });
  });

  describe('Match Management', function() {
    beforeEach(async function() {
      await workflow.initialize();
    });

    it('should add match to monitoring', async function() {
      const testUrl = 'https://www.flashscore.com/match/manual-test/';
      const matchId = workflow.extractMatchIdFromUrl(testUrl);

      // Mock the data collection to avoid actual scraping
      workflow.collectMatchData = async () => {
        return { success: true };
      };

      await workflow.addMatch(testUrl);

      expect(workflow.activeMatches.has(matchId)).to.be.true;
      expect(workflow.updateIntervals.has(matchId)).to.be.true;
    });

    it('should remove match from monitoring', function() {
      const testUrl = 'https://www.flashscore.com/match/remove-test/';
      const matchId = workflow.extractMatchIdFromUrl(testUrl);

      // Add match manually
      workflow.activeMatches.set(matchId, {
        url: testUrl,
        startTime: new Date()
      });

      // Set up mock interval
      const intervalId = setInterval(() => {}, 1000);
      workflow.updateIntervals.set(matchId, intervalId);

      // Remove match
      workflow.removeMatch(matchId);

      expect(workflow.activeMatches.has(matchId)).to.be.false;
      expect(workflow.updateIntervals.has(matchId)).to.be.false;
    });

    it('should clean up inactive matches', async function() {
      const activeUrl = 'https://www.flashscore.com/match/active/';
      const inactiveUrl = 'https://www.flashscore.com/match/inactive/';
      
      const activeId = workflow.extractMatchIdFromUrl(activeUrl);
      const inactiveId = workflow.extractMatchIdFromUrl(inactiveUrl);

      // Add both matches
      const oldTime = new Date(Date.now() - workflow.config.updateInterval * 5); // 5 intervals ago
      
      workflow.activeMatches.set(activeId, {
        url: activeUrl,
        startTime: new Date(),
        lastUpdate: new Date() // Recent update
      });

      workflow.activeMatches.set(inactiveId, {
        url: inactiveUrl,
        startTime: oldTime,
        lastUpdate: oldTime // Old update
      });

      // Clean up with only active match in current list
      await workflow.cleanupInactiveMatches([activeUrl]);

      expect(workflow.activeMatches.has(activeId)).to.be.true;
      expect(workflow.activeMatches.has(inactiveId)).to.be.false;
    });
  });

  describe('Error Handling', function() {
    beforeEach(async function() {
      await workflow.initialize();
    });

    it('should handle database errors gracefully', async function() {
      // Close database to simulate error
      await workflow.databaseService.close();

      const testMatchData = {
        matchId: 'error-test',
        homeTeam: 'Team X',
        awayTeam: 'Team Y',
        currentScore: '0-0',
        status: 'live',
        matchDatetime: new Date(),
        flashscoreUrl: 'https://www.flashscore.com/match/error-test/'
      };

      try {
        await workflow.saveMatchData(testMatchData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });

    it('should handle scraping errors gracefully', async function() {
      // Mock scraping engine to throw error
      workflow.scrapingEngine.navigateToPage = async () => {
        throw new Error('Navigation failed');
      };

      try {
        await workflow.collectMatchData('error-match', 'https://invalid-url');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Navigation failed');
      }
    });
  });
});