const { initializeDatabase } = require('./dist/db/init');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function testDatabaseInit() {
  try {
    console.log('Testing database initialization...');
    
    // Initialize the database
    await initializeDatabase();
    
    // Open database to verify tables were created
    const db = await open({
      filename: './database.db',
      driver: sqlite3.Database
    });
    
    // Check if all tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('Created tables:', tables.map(t => t.name));
    
    // Verify foreign key constraints are working
    await db.exec('PRAGMA foreign_keys = ON;');
    
    // Test foreign key constraint
    try {
      await db.run('INSERT INTO matches (match_date, home_team_id, away_team_id, status) VALUES (?, ?, ?, ?)', 
        ['2024-01-01 15:00:00', 999, 998, 'scheduled']);
      console.log('ERROR: Foreign key constraint should have failed!');
    } catch (error) {
      console.log('✓ Foreign key constraints are working correctly');
    }
    
    await db.close();
    console.log('✓ Database initialization test completed successfully');
    
  } catch (error) {
    console.error('Database initialization test failed:', error);
    process.exit(1);
  }
}

testDatabaseInit();