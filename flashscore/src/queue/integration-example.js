const TaskManager = require('./TaskManager');
const TaskTypes = require('./TaskTypes');
const Scheduler = require('../scheduler/Scheduler');
const {
  LiveMatchProcessor,
  HistoricalDataProcessor,
  UpcomingFixturesProcessor,
  LeagueDiscoveryProcessor
} = require('./processors');

/**
 * Example integration showing how to set up the complete task queue and scheduling system
 */
async function setupTaskQueueSystem() {
  console.log('Setting up Task Queue and Scheduling System...');

  try {
    // 1. Initialize TaskManager
    console.log('\n1. Initializing TaskManager...');
    const taskManager = new TaskManager({
      host: 'localhost',
      port: 6379,
      db: 0
    });

    await taskManager.initialize();
    console.log('✓ TaskManager initialized');

    // 2. Create mock dependencies (in real implementation, these would be actual services)
    const mockDependencies = {
      scrapingEngine: {
        initializeBrowser: async () => console.log('Browser initialized'),
        navigateToPage: async (url) => console.log(`Navigated to ${url}`),
        extractData: async () => ({ mockData: true }),
        getPageContent: async () => '<html>Mock content</html>'
      },
      dataParser: {
        parseMatchData: async () => ({ matchId: 'test', homeTeam: 'A', awayTeam: 'B' }),
        parseHistoricalMatches: async () => [{ matchId: 'hist1' }],
        parseUpcomingFixtures: async () => [{ matchId: 'fix1' }],
        parseCountryLeagues: async () => [{ name: 'Test League' }]
      },
      databaseService: {
        getMatch: async () => null,
        createMatch: async (data) => console.log('Created match:', data.matchId),
        logScrapingActivity: async (data) => console.log('Logged activity:', data.taskType)
      }
    };

    // 3. Create and register processors
    console.log('\n2. Creating and registering processors...');
    
    const liveProcessor = new LiveMatchProcessor(mockDependencies);
    const historicalProcessor = new HistoricalDataProcessor(mockDependencies);
    const fixturesProcessor = new UpcomingFixturesProcessor(mockDependencies);
    const discoveryProcessor = new LeagueDiscoveryProcessor(mockDependencies);

    // Register processors with TaskManager
    taskManager.registerProcessor(TaskTypes.LIVE_MATCHES, 
      (jobData, job) => liveProcessor.process(jobData, job), 2);
    
    taskManager.registerProcessor(TaskTypes.HISTORICAL_DATA, 
      (jobData, job) => historicalProcessor.process(jobData, job), 1);
    
    taskManager.registerProcessor(TaskTypes.UPCOMING_FIXTURES, 
      (jobData, job) => fixturesProcessor.process(jobData, job), 1);
    
    taskManager.registerProcessor(TaskTypes.LEAGUE_DISCOVERY, 
      (jobData, job) => discoveryProcessor.process(jobData, job), 1);

    console.log('✓ All processors registered');

    // 4. Initialize and start Scheduler
    console.log('\n3. Initializing Scheduler...');
    const scheduler = new Scheduler(taskManager, {
      timezone: 'UTC',
      maxConcurrentTasks: 10,
      systemLoadThreshold: 0.8
    });

    await scheduler.initialize();
    console.log('✓ Scheduler initialized');

    // 5. Demonstrate manual task addition
    console.log('\n4. Adding manual tasks...');
    
    const liveMatchJob = await taskManager.addTask(TaskTypes.LIVE_MATCHES, {
      taskType: TaskTypes.LIVE_MATCHES,
      dataType: 'live',
      maxPages: 3,
      timeout: 30000
    });
    console.log('✓ Live match task added:', liveMatchJob.id);

    const historicalJob = await taskManager.addTask(TaskTypes.HISTORICAL_DATA, {
      taskType: TaskTypes.HISTORICAL_DATA,
      dataType: 'historical',
      daysBack: 1,
      maxPages: 5
    });
    console.log('✓ Historical data task added:', historicalJob.id);

    // 6. Check queue statistics
    console.log('\n5. Checking queue statistics...');
    for (const taskType of TaskTypes.getAllTypes()) {
      const stats = await taskManager.getQueueStats(taskType);
      console.log(`${taskType}:`, stats);
    }

    // 7. Get scheduler statistics
    console.log('\n6. Scheduler statistics:');
    const schedulerStats = scheduler.getStats();
    console.log('Running:', schedulerStats.isRunning);
    console.log('Scheduled tasks:', schedulerStats.totalScheduledTasks);

    // 8. Demonstrate schedule management
    console.log('\n7. Testing schedule management...');
    
    // Schedule a task
    await scheduler.scheduleTask(TaskTypes.LIVE_MATCHES, {
      schedule: '*/2 * * * *', // Every 2 minutes
      priority: 100
    });
    console.log('✓ Live matches scheduled every 2 minutes');

    // Update schedule
    await scheduler.updateSchedule(TaskTypes.LIVE_MATCHES, '*/5 * * * *');
    console.log('✓ Live matches schedule updated to every 5 minutes');

    // 9. Demonstrate task status checking
    console.log('\n8. Checking task status...');
    const liveStatus = await taskManager.getTaskStatus(TaskTypes.LIVE_MATCHES, liveMatchJob.id);
    console.log('Live match task status:', liveStatus.status);

    const historicalStatus = await taskManager.getTaskStatus(TaskTypes.HISTORICAL_DATA, historicalJob.id);
    console.log('Historical data task status:', historicalStatus.status);

    // 10. Show task priorities
    console.log('\n9. Task priorities:');
    for (const taskType of TaskTypes.getAllTypes()) {
      const config = TaskTypes.getDefaultConfig(taskType);
      console.log(`${taskType}: priority ${config.priority}, ${config.attempts} attempts`);
    }

    console.log('\n✓ Task Queue and Scheduling System setup completed successfully!');
    console.log('\nSystem is ready to:');
    console.log('- Process live match data every minute');
    console.log('- Collect historical data daily');
    console.log('- Update upcoming fixtures every 3 hours');
    console.log('- Discover new leagues weekly');
    console.log('- Handle errors with automatic retries');
    console.log('- Monitor system load and adjust accordingly');

    // Cleanup for demo
    setTimeout(async () => {
      console.log('\nCleaning up demo...');
      await scheduler.stop();
      await taskManager.close();
      console.log('✓ Demo cleanup completed');
    }, 5000);

  } catch (error) {
    console.error('✗ Setup failed:', error.message);
    console.error(error.stack);
  }
}

// Run the integration example
if (require.main === module) {
  setupTaskQueueSystem();
}

module.exports = { setupTaskQueueSystem };