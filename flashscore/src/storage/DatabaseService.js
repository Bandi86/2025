const DatabaseManager = require('./database');
const { League, Match, MatchEvent, MatchStat } = require('./models');

class DatabaseService {
  constructor(dbPath = null) {
    this.dbManager = new DatabaseManager(dbPath);
    this.isInitialized = false;
  }

  async initialize() {
    if (!this.isInitialized) {
      await this.dbManager.initialize();
      this.isInitialized = true;
    }
  }

  async close() {
    if (this.isInitialized) {
      await this.dbManager.close();
      this.isInitialized = false;
    }
  }

  // Transaction support
  async runTransaction(callback) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      this.dbManager.db.serialize(() => {
        this.dbManager.db.run('BEGIN TRANSACTION');
        
        Promise.resolve(callback(this))
          .then(result => {
            this.dbManager.db.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          })
          .catch(error => {
            this.dbManager.db.run('ROLLBACK', (rollbackErr) => {
              if (rollbackErr) {
                console.error('Rollback failed:', rollbackErr);
              }
              reject(error);
            });
          });
      });
    });
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // League CRUD operations
  async createLeague(leagueData) {
    await this.ensureInitialized();
    
    const league = new League(leagueData);
    if (!league.validate()) {
      throw new Error(`League validation failed: ${league.getErrors().map(e => e.message).join(', ')}`);
    }

    const dbObj = league.toDatabaseObject();
    const sql = `
      INSERT OR REPLACE INTO Leagues 
      (league_id, name, country, season, flashscore_url, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await this.dbManager.runQuery(sql, [
      dbObj.league_id, dbObj.name, dbObj.country, dbObj.season,
      dbObj.flashscore_url, dbObj.created_at, dbObj.updated_at
    ]);

    return league;
  }

  async getLeague(leagueId) {
    await this.ensureInitialized();
    
    const sql = 'SELECT * FROM Leagues WHERE league_id = ?';
    const row = await this.dbManager.getQuery(sql, [leagueId]);
    
    return row ? League.fromDatabaseObject(row) : null;
  }

  async getLeagues(filters = {}) {
    await this.ensureInitialized();
    
    let sql = 'SELECT * FROM Leagues';
    const params = [];
    const conditions = [];

    if (filters.country) {
      conditions.push('country = ?');
      params.push(filters.country);
    }
    if (filters.season) {
      conditions.push('season = ?');
      params.push(filters.season);
    }
    if (filters.name) {
      conditions.push('name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY country, name';

    const rows = await this.dbManager.allQuery(sql, params);
    return rows.map(row => League.fromDatabaseObject(row));
  }

  async updateLeague(leagueId, updateData) {
    await this.ensureInitialized();
    
    const existingLeague = await this.getLeague(leagueId);
    if (!existingLeague) {
      throw new Error(`League with ID ${leagueId} not found`);
    }

    const updatedLeague = new League({ ...existingLeague.toJSON(), ...updateData });
    if (!updatedLeague.validate()) {
      throw new Error(`League validation failed: ${updatedLeague.getErrors().map(e => e.message).join(', ')}`);
    }

    const dbObj = updatedLeague.toDatabaseObject();
    const sql = `
      UPDATE Leagues 
      SET name = ?, country = ?, season = ?, flashscore_url = ?, updated_at = ?
      WHERE league_id = ?
    `;
    
    await this.dbManager.runQuery(sql, [
      dbObj.name, dbObj.country, dbObj.season, dbObj.flashscore_url,
      dbObj.updated_at, leagueId
    ]);

    return updatedLeague;
  }

  async deleteLeague(leagueId) {
    await this.ensureInitialized();
    
    const sql = 'DELETE FROM Leagues WHERE league_id = ?';
    const result = await this.dbManager.runQuery(sql, [leagueId]);
    
    return result.changes > 0;
  }

  // Match CRUD operations
  async createMatch(matchData) {
    await this.ensureInitialized();
    
    const match = new Match(matchData);
    if (!match.validate()) {
      throw new Error(`Match validation failed: ${match.getErrors().map(e => e.message).join(', ')}`);
    }

    const dbObj = match.toDatabaseObject();
    const sql = `
      INSERT OR REPLACE INTO Matches 
      (match_id, league_id, home_team, away_team, match_datetime, status, 
       final_score, half_time_score, flashscore_url, last_updated, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.dbManager.runQuery(sql, [
      dbObj.match_id, dbObj.league_id, dbObj.home_team, dbObj.away_team,
      dbObj.match_datetime, dbObj.status, dbObj.final_score, dbObj.half_time_score,
      dbObj.flashscore_url, dbObj.last_updated, dbObj.created_at
    ]);

    return match;
  }

  async getMatch(matchId) {
    await this.ensureInitialized();
    
    const sql = 'SELECT * FROM Matches WHERE match_id = ?';
    const row = await this.dbManager.getQuery(sql, [matchId]);
    
    return row ? Match.fromDatabaseObject(row) : null;
  }

  async getMatches(filters = {}) {
    await this.ensureInitialized();
    
    let sql = 'SELECT * FROM Matches';
    const params = [];
    const conditions = [];

    if (filters.leagueId) {
      conditions.push('league_id = ?');
      params.push(filters.leagueId);
    }
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.homeTeam) {
      conditions.push('home_team LIKE ?');
      params.push(`%${filters.homeTeam}%`);
    }
    if (filters.awayTeam) {
      conditions.push('away_team LIKE ?');
      params.push(`%${filters.awayTeam}%`);
    }
    if (filters.dateFrom) {
      conditions.push('match_datetime >= ?');
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('match_datetime <= ?');
      params.push(filters.dateTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY match_datetime DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = await this.dbManager.allQuery(sql, params);
    return rows.map(row => Match.fromDatabaseObject(row));
  }

  async updateMatch(matchId, updateData) {
    await this.ensureInitialized();
    
    const existingMatch = await this.getMatch(matchId);
    if (!existingMatch) {
      throw new Error(`Match with ID ${matchId} not found`);
    }

    const updatedMatch = new Match({ ...existingMatch.toJSON(), ...updateData });
    if (!updatedMatch.validate()) {
      throw new Error(`Match validation failed: ${updatedMatch.getErrors().map(e => e.message).join(', ')}`);
    }

    const dbObj = updatedMatch.toDatabaseObject();
    const sql = `
      UPDATE Matches 
      SET league_id = ?, home_team = ?, away_team = ?, match_datetime = ?, 
          status = ?, final_score = ?, half_time_score = ?, flashscore_url = ?, 
          last_updated = ?
      WHERE match_id = ?
    `;
    
    await this.dbManager.runQuery(sql, [
      dbObj.league_id, dbObj.home_team, dbObj.away_team, dbObj.match_datetime,
      dbObj.status, dbObj.final_score, dbObj.half_time_score, dbObj.flashscore_url,
      dbObj.last_updated, matchId
    ]);

    return updatedMatch;
  }

  async deleteMatch(matchId) {
    await this.ensureInitialized();
    
    const sql = 'DELETE FROM Matches WHERE match_id = ?';
    const result = await this.dbManager.runQuery(sql, [matchId]);
    
    return result.changes > 0;
  }

  // MatchEvent CRUD operations
  async createMatchEvent(eventData) {
    await this.ensureInitialized();
    
    const event = new MatchEvent(eventData);
    if (!event.validate()) {
      throw new Error(`MatchEvent validation failed: ${event.getErrors().map(e => e.message).join(', ')}`);
    }

    const dbObj = event.toDatabaseObject();
    const sql = `
      INSERT INTO MatchEvents 
      (event_id, match_id, event_type, minute, player_name, description, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.dbManager.runQuery(sql, [
      dbObj.event_id, dbObj.match_id, dbObj.event_type, dbObj.minute,
      dbObj.player_name, dbObj.description, dbObj.timestamp
    ]);

    return event;
  }

  async getMatchEvents(matchId) {
    await this.ensureInitialized();
    
    const sql = 'SELECT * FROM MatchEvents WHERE match_id = ? ORDER BY minute ASC, timestamp ASC';
    const rows = await this.dbManager.allQuery(sql, [matchId]);
    
    return rows.map(row => MatchEvent.fromDatabaseObject(row));
  }

  async deleteMatchEvent(eventId) {
    await this.ensureInitialized();
    
    const sql = 'DELETE FROM MatchEvents WHERE event_id = ?';
    const result = await this.dbManager.runQuery(sql, [eventId]);
    
    return result.changes > 0;
  }

  // MatchStat CRUD operations
  async createMatchStat(statData) {
    await this.ensureInitialized();
    
    const stat = new MatchStat(statData);
    if (!stat.validate()) {
      throw new Error(`MatchStat validation failed: ${stat.getErrors().map(e => e.message).join(', ')}`);
    }

    const dbObj = stat.toDatabaseObject();
    const sql = `
      INSERT OR REPLACE INTO MatchStats 
      (stat_id, match_id, stat_name, home_value, away_value, created_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await this.dbManager.runQuery(sql, [
      dbObj.stat_id, dbObj.match_id, dbObj.stat_name, 
      dbObj.home_value, dbObj.away_value, dbObj.created_at
    ]);

    return stat;
  }

  async getMatchStats(matchId) {
    await this.ensureInitialized();
    
    const sql = 'SELECT * FROM MatchStats WHERE match_id = ? ORDER BY stat_name';
    const rows = await this.dbManager.allQuery(sql, [matchId]);
    
    return rows.map(row => MatchStat.fromDatabaseObject(row));
  }

  async deleteMatchStat(statId) {
    await this.ensureInitialized();
    
    const sql = 'DELETE FROM MatchStats WHERE stat_id = ?';
    const result = await this.dbManager.runQuery(sql, [statId]);
    
    return result.changes > 0;
  }

  // Scraping logs
  async logScrapingActivity(taskType, status, errorMessage = null, executionTime = null, recordsProcessed = 0) {
    await this.ensureInitialized();
    
    const logId = require('uuid').v4();
    const sql = `
      INSERT INTO ScrapingLogs 
      (log_id, task_type, status, error_message, execution_time, records_processed, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.dbManager.runQuery(sql, [
      logId, taskType, status, errorMessage, executionTime, recordsProcessed, new Date().toISOString()
    ]);

    return logId;
  }

  async getScrapingLogs(filters = {}) {
    await this.ensureInitialized();
    
    let sql = 'SELECT * FROM ScrapingLogs';
    const params = [];
    const conditions = [];

    if (filters.taskType) {
      conditions.push('task_type = ?');
      params.push(filters.taskType);
    }
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.dateFrom) {
      conditions.push('timestamp >= ?');
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('timestamp <= ?');
      params.push(filters.dateTo);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return await this.dbManager.allQuery(sql, params);
  }

  // Utility methods
  async getMatchWithDetails(matchId) {
    await this.ensureInitialized();
    
    const match = await this.getMatch(matchId);
    if (!match) return null;

    const [events, stats] = await Promise.all([
      this.getMatchEvents(matchId),
      this.getMatchStats(matchId)
    ]);

    return {
      match,
      events,
      stats
    };
  }

  async getLeagueWithMatches(leagueId, matchFilters = {}) {
    await this.ensureInitialized();
    
    const league = await this.getLeague(leagueId);
    if (!league) return null;

    const matches = await this.getMatches({ ...matchFilters, leagueId });

    return {
      league,
      matches
    };
  }

  async cleanupOldLogs(daysToKeep = 30) {
    await this.ensureInitialized();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const sql = 'DELETE FROM ScrapingLogs WHERE timestamp < ?';
    const result = await this.dbManager.runQuery(sql, [cutoffDate.toISOString()]);
    
    return result.changes;
  }

  // Health check
  async healthCheck() {
    try {
      await this.ensureInitialized();
      
      // Test basic database connectivity
      const result = await this.dbManager.getQuery('SELECT 1 as test');
      
      // Get some basic stats
      const [leagueCount, matchCount, eventCount] = await Promise.all([
        this.dbManager.getQuery('SELECT COUNT(*) as count FROM Leagues'),
        this.dbManager.getQuery('SELECT COUNT(*) as count FROM Matches'),
        this.dbManager.getQuery('SELECT COUNT(*) as count FROM MatchEvents')
      ]);

      return {
        status: 'healthy',
        database: 'connected',
        counts: {
          leagues: leagueCount.count,
          matches: matchCount.count,
          events: eventCount.count
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = DatabaseService;