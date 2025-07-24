const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(__dirname, '../../data/flashscore.db');
    this.db = null;
    this.currentVersion = 1;
    this.migrations = [];
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.setupMigrations();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Database connected successfully');
          resolve();
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  setupMigrations() {
    // Migration 1: Initial schema with enhanced structure
    this.migrations.push({
      version: 1,
      description: 'Initial enhanced schema with timestamps and indexes',
      up: async () => {
        await this.runQuery(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await this.runQuery(`
          CREATE TABLE IF NOT EXISTS Leagues (
            league_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            country TEXT NOT NULL,
            season TEXT,
            flashscore_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await this.runQuery(`
          CREATE TABLE IF NOT EXISTS Matches (
            match_id TEXT PRIMARY KEY,
            league_id TEXT NOT NULL,
            home_team TEXT NOT NULL,
            away_team TEXT NOT NULL,
            match_datetime DATETIME,
            status TEXT,
            final_score TEXT,
            half_time_score TEXT,
            flashscore_url TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (league_id) REFERENCES Leagues(league_id)
          )
        `);

        await this.runQuery(`
          CREATE TABLE IF NOT EXISTS MatchEvents (
            event_id TEXT PRIMARY KEY,
            match_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            minute INTEGER,
            player_name TEXT,
            description TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (match_id) REFERENCES Matches(match_id)
          )
        `);

        await this.runQuery(`
          CREATE TABLE IF NOT EXISTS MatchStats (
            stat_id TEXT PRIMARY KEY,
            match_id TEXT NOT NULL,
            stat_name TEXT NOT NULL,
            home_value TEXT,
            away_value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (match_id) REFERENCES Matches(match_id)
          )
        `);

        await this.runQuery(`
          CREATE TABLE IF NOT EXISTS ScrapingLogs (
            log_id TEXT PRIMARY KEY,
            task_type TEXT NOT NULL,
            status TEXT NOT NULL,
            error_message TEXT,
            execution_time INTEGER,
            records_processed INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indexes for performance optimization
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_matches_datetime ON Matches(match_datetime)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_matches_status ON Matches(status)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_matches_league_id ON Matches(league_id)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_matches_last_updated ON Matches(last_updated)');
        
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_events_match_id ON MatchEvents(match_id)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_events_type ON MatchEvents(event_type)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_events_timestamp ON MatchEvents(timestamp)');
        
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_stats_match_id ON MatchStats(match_id)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_stats_name ON MatchStats(stat_name)');
        
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON ScrapingLogs(timestamp)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_logs_task_type ON ScrapingLogs(task_type)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_logs_status ON ScrapingLogs(status)');
        
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_leagues_country ON Leagues(country)');
        await this.runQuery('CREATE INDEX IF NOT EXISTS idx_leagues_season ON Leagues(season)');
      }
    });
  }

  async runMigrations() {
    try {
      // Get current database version
      const currentVersion = await this.getCurrentVersion();
      console.log(`Current database version: ${currentVersion}`);

      // Run pending migrations
      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          console.log(`Running migration ${migration.version}: ${migration.description}`);
          await migration.up();
          await this.recordMigration(migration.version);
          console.log(`Migration ${migration.version} completed successfully`);
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async getCurrentVersion() {
    try {
      const result = await this.getQuery('SELECT MAX(version) as version FROM schema_migrations');
      return result ? result.version || 0 : 0;
    } catch (error) {
      // If table doesn't exist, we're at version 0
      return 0;
    }
  }

  async recordMigration(version) {
    await this.runQuery('INSERT INTO schema_migrations (version) VALUES (?)', [version]);
  }

  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async initialize() {
    await this.connect();
    await this.runMigrations();
  }
}

module.exports = DatabaseManager;