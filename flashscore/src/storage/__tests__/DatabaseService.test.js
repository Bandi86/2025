const DatabaseService = require('../DatabaseService');
const path = require('path');
const fs = require('fs');

describe('DatabaseService', () => {
  let dbService;
  let testDbPath;

  beforeEach(async () => {
    // Create a temporary database for testing
    testDbPath = path.join(__dirname, 'test.db');
    dbService = new DatabaseService(testDbPath);
    await dbService.initialize();
  });

  afterEach(async () => {
    await dbService.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('League operations', () => {
    it('should create and retrieve a league', async () => {
      const leagueData = {
        name: 'Premier League',
        country: 'England',
        season: '2023/24'
      };

      const createdLeague = await dbService.createLeague(leagueData);
      expect(createdLeague.name).toBe('Premier League');
      expect(createdLeague.leagueId).toBeDefined();

      const retrievedLeague = await dbService.getLeague(createdLeague.leagueId);
      expect(retrievedLeague.name).toBe('Premier League');
      expect(retrievedLeague.country).toBe('England');
      expect(retrievedLeague.season).toBe('2023/24');
    });

    it('should update a league', async () => {
      const league = await dbService.createLeague({
        name: 'Test League',
        country: 'Test Country'
      });

      const updatedLeague = await dbService.updateLeague(league.leagueId, {
        name: 'Updated League',
        season: '2023/24'
      });

      expect(updatedLeague.name).toBe('Updated League');
      expect(updatedLeague.season).toBe('2023/24');
      expect(updatedLeague.country).toBe('Test Country'); // Should remain unchanged
    });

    it('should delete a league', async () => {
      const league = await dbService.createLeague({
        name: 'Test League',
        country: 'Test Country'
      });

      const deleted = await dbService.deleteLeague(league.leagueId);
      expect(deleted).toBe(true);

      const retrievedLeague = await dbService.getLeague(league.leagueId);
      expect(retrievedLeague).toBe(null);
    });

    it('should filter leagues', async () => {
      await dbService.createLeague({
        name: 'Premier League',
        country: 'England',
        season: '2023/24'
      });
      await dbService.createLeague({
        name: 'La Liga',
        country: 'Spain',
        season: '2023/24'
      });
      await dbService.createLeague({
        name: 'Championship',
        country: 'England',
        season: '2023/24'
      });

      const englishLeagues = await dbService.getLeagues({ country: 'England' });
      expect(englishLeagues).toHaveLength(2);
      expect(englishLeagues.every(l => l.country === 'England')).toBe(true);

      const premierLeague = await dbService.getLeagues({ name: 'Premier' });
      expect(premierLeague).toHaveLength(1);
      expect(premierLeague[0].name).toBe('Premier League');
    });
  });

  describe('Match operations', () => {
    let league;

    beforeEach(async () => {
      league = await dbService.createLeague({
        name: 'Test League',
        country: 'Test Country'
      });
    });

    it('should create and retrieve a match', async () => {
      const matchData = {
        leagueId: league.leagueId,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'scheduled'
      };

      const createdMatch = await dbService.createMatch(matchData);
      expect(createdMatch.homeTeam).toBe('Arsenal');
      expect(createdMatch.awayTeam).toBe('Chelsea');
      expect(createdMatch.matchId).toBeDefined();

      const retrievedMatch = await dbService.getMatch(createdMatch.matchId);
      expect(retrievedMatch.homeTeam).toBe('Arsenal');
      expect(retrievedMatch.awayTeam).toBe('Chelsea');
      expect(retrievedMatch.status).toBe('scheduled');
    });

    it('should update a match', async () => {
      const match = await dbService.createMatch({
        leagueId: league.leagueId,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'scheduled'
      });

      const updatedMatch = await dbService.updateMatch(match.matchId, {
        status: 'finished',
        finalScore: '2-1'
      });

      expect(updatedMatch.status).toBe('finished');
      expect(updatedMatch.finalScore).toBe('2-1');
      expect(updatedMatch.homeTeam).toBe('Arsenal'); // Should remain unchanged
    });

    it('should filter matches', async () => {
      await dbService.createMatch({
        leagueId: league.leagueId,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'finished'
      });
      await dbService.createMatch({
        leagueId: league.leagueId,
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester United',
        status: 'scheduled'
      });

      const finishedMatches = await dbService.getMatches({ status: 'finished' });
      expect(finishedMatches).toHaveLength(1);
      expect(finishedMatches[0].homeTeam).toBe('Arsenal');

      const arsenalMatches = await dbService.getMatches({ homeTeam: 'Arsenal' });
      expect(arsenalMatches).toHaveLength(1);
      expect(arsenalMatches[0].homeTeam).toBe('Arsenal');
    });
  });

  describe('Match Event operations', () => {
    let match;

    beforeEach(async () => {
      const league = await dbService.createLeague({
        name: 'Test League',
        country: 'Test Country'
      });
      match = await dbService.createMatch({
        leagueId: league.leagueId,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'live'
      });
    });

    it('should create and retrieve match events', async () => {
      const eventData = {
        matchId: match.matchId,
        eventType: 'goal',
        minute: 45,
        playerName: 'Bukayo Saka'
      };

      const createdEvent = await dbService.createMatchEvent(eventData);
      expect(createdEvent.eventType).toBe('goal');
      expect(createdEvent.minute).toBe(45);
      expect(createdEvent.playerName).toBe('Bukayo Saka');

      const events = await dbService.getMatchEvents(match.matchId);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('goal');
      expect(events[0].playerName).toBe('Bukayo Saka');
    });

    it('should order events by minute', async () => {
      await dbService.createMatchEvent({
        matchId: match.matchId,
        eventType: 'goal',
        minute: 75,
        playerName: 'Player 2'
      });
      await dbService.createMatchEvent({
        matchId: match.matchId,
        eventType: 'goal',
        minute: 30,
        playerName: 'Player 1'
      });

      const events = await dbService.getMatchEvents(match.matchId);
      expect(events).toHaveLength(2);
      expect(events[0].minute).toBe(30);
      expect(events[1].minute).toBe(75);
    });
  });

  describe('Match Stat operations', () => {
    let match;

    beforeEach(async () => {
      const league = await dbService.createLeague({
        name: 'Test League',
        country: 'Test Country'
      });
      match = await dbService.createMatch({
        leagueId: league.leagueId,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'finished'
      });
    });

    it('should create and retrieve match stats', async () => {
      const statData = {
        matchId: match.matchId,
        statName: 'possession',
        homeValue: '65',
        awayValue: '35'
      };

      const createdStat = await dbService.createMatchStat(statData);
      expect(createdStat.statName).toBe('possession');
      expect(createdStat.homeValue).toBe('65');
      expect(createdStat.awayValue).toBe('35');

      const stats = await dbService.getMatchStats(match.matchId);
      expect(stats).toHaveLength(1);
      expect(stats[0].statName).toBe('possession');
      expect(stats[0].homeValue).toBe('65');
    });
  });

  describe('Transaction support', () => {
    it('should commit successful transactions', async () => {
      const result = await dbService.runTransaction(async (db) => {
        const league = await db.createLeague({
          name: 'Transaction League',
          country: 'Test Country'
        });
        const match = await db.createMatch({
          leagueId: league.leagueId,
          homeTeam: 'Team A',
          awayTeam: 'Team B'
        });
        return { league, match };
      });

      expect(result.league.name).toBe('Transaction League');
      expect(result.match.homeTeam).toBe('Team A');

      // Verify data was committed
      const retrievedLeague = await dbService.getLeague(result.league.leagueId);
      expect(retrievedLeague).not.toBe(null);
    });

    it('should rollback failed transactions', async () => {
      let leagueId;
      
      try {
        await dbService.runTransaction(async (db) => {
          const league = await db.createLeague({
            name: 'Rollback League',
            country: 'Test Country'
          });
          leagueId = league.leagueId;
          
          // This should cause the transaction to fail
          throw new Error('Intentional error');
        });
      } catch (error) {
        expect(error.message).toBe('Intentional error');
      }

      // Verify data was rolled back
      const retrievedLeague = await dbService.getLeague(leagueId);
      expect(retrievedLeague).toBe(null);
    });
  });

  describe('Scraping logs', () => {
    it('should log scraping activity', async () => {
      const logId = await dbService.logScrapingActivity(
        'live_matches',
        'success',
        null,
        1500,
        25
      );

      expect(logId).toBeDefined();

      const logs = await dbService.getScrapingLogs({ taskType: 'live_matches' });
      expect(logs).toHaveLength(1);
      expect(logs[0].task_type).toBe('live_matches');
      expect(logs[0].status).toBe('success');
      expect(logs[0].execution_time).toBe(1500);
      expect(logs[0].records_processed).toBe(25);
    });

    it('should filter scraping logs', async () => {
      await dbService.logScrapingActivity('live_matches', 'success');
      await dbService.logScrapingActivity('historical_data', 'error', 'Network timeout');
      await dbService.logScrapingActivity('live_matches', 'success');

      const successLogs = await dbService.getScrapingLogs({ status: 'success' });
      expect(successLogs).toHaveLength(2);

      const errorLogs = await dbService.getScrapingLogs({ status: 'error' });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].error_message).toBe('Network timeout');
    });
  });

  describe('Utility methods', () => {
    let league, match;

    beforeEach(async () => {
      league = await dbService.createLeague({
        name: 'Test League',
        country: 'Test Country'
      });
      match = await dbService.createMatch({
        leagueId: league.leagueId,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'finished'
      });
    });

    it('should get match with details', async () => {
      await dbService.createMatchEvent({
        matchId: match.matchId,
        eventType: 'goal',
        minute: 45,
        playerName: 'Player 1'
      });
      await dbService.createMatchStat({
        matchId: match.matchId,
        statName: 'possession',
        homeValue: '60',
        awayValue: '40'
      });

      const matchDetails = await dbService.getMatchWithDetails(match.matchId);
      
      expect(matchDetails.match.homeTeam).toBe('Arsenal');
      expect(matchDetails.events).toHaveLength(1);
      expect(matchDetails.stats).toHaveLength(1);
      expect(matchDetails.events[0].eventType).toBe('goal');
      expect(matchDetails.stats[0].statName).toBe('possession');
    });

    it('should get league with matches', async () => {
      await dbService.createMatch({
        leagueId: league.leagueId,
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester United',
        status: 'scheduled'
      });

      const leagueDetails = await dbService.getLeagueWithMatches(league.leagueId);
      
      expect(leagueDetails.league.name).toBe('Test League');
      expect(leagueDetails.matches).toHaveLength(2);
    });
  });

  describe('Health check', () => {
    it('should return healthy status', async () => {
      const health = await dbService.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.database).toBe('connected');
      expect(health.counts).toBeDefined();
      expect(typeof health.counts.leagues).toBe('number');
      expect(typeof health.counts.matches).toBe('number');
      expect(typeof health.counts.events).toBe('number');
    });
  });
});