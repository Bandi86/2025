const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const DatabaseManager = require('./database');

class LegacyMigrator {
  constructor() {
    this.legacyDbPath = path.join(__dirname, '../../archive/flashscore.db');
    this.newDbManager = new DatabaseManager();
  }

  async migrateLegacyData() {
    // Check if legacy database exists
    if (!fs.existsSync(this.legacyDbPath)) {
      console.log('No legacy database found, skipping migration');
      return;
    }

    console.log('Starting legacy data migration...');

    // Initialize new database
    await this.newDbManager.initialize();

    // Open legacy database
    const legacyDb = new sqlite3.Database(this.legacyDbPath);

    try {
      // Migrate Leagues
      await this.migrateTable(legacyDb, 'Leagues', [
        'league_id', 'name', 'country', 'season'
      ]);

      // Migrate Matches
      await this.migrateTable(legacyDb, 'Matches', [
        'match_id', 'league_id', 'home_team', 'away_team', 
        'match_datetime', 'status', 'final_score', 'half_time_score', 'flashscore_url'
      ]);

      // Migrate MatchEvents
      await this.migrateTable(legacyDb, 'MatchEvents', [
        'event_id', 'match_id', 'event_type', 'minute', 'player_name', 'description'
      ]);

      // Migrate MatchStats
      await this.migrateTable(legacyDb, 'MatchStats', [
        'stat_id', 'match_id', 'stat_name', 'home_value', 'away_value'
      ]);

      console.log('Legacy data migration completed successfully');

    } catch (error) {
      console.error('Error during legacy migration:', error);
      throw error;
    } finally {
      legacyDb.close();
      await this.newDbManager.close();
    }
  }

  async migrateTable(legacyDb, tableName, columns) {
    return new Promise((resolve, reject) => {
      const columnList = columns.join(', ');
      const placeholders = columns.map(() => '?').join(', ');
      
      legacyDb.all(`SELECT ${columnList} FROM ${tableName}`, [], async (err, rows) => {
        if (err) {
          if (err.message.includes('no such table')) {
            console.log(`Table ${tableName} not found in legacy database, skipping`);
            resolve();
            return;
          }
          reject(err);
          return;
        }

        console.log(`Migrating ${rows.length} records from ${tableName}`);

        try {
          for (const row of rows) {
            const values = columns.map(col => row[col]);
            await this.newDbManager.runQuery(
              `INSERT OR REPLACE INTO ${tableName} (${columnList}) VALUES (${placeholders})`,
              values
            );
          }
          console.log(`Successfully migrated ${tableName}`);
          resolve();
        } catch (insertError) {
          reject(insertError);
        }
      });
    });
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new LegacyMigrator();
  migrator.migrateLegacyData()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = LegacyMigrator;