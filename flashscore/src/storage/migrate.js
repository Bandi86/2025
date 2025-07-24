#!/usr/bin/env node

const DatabaseManager = require('./database');
const path = require('path');

async function runMigrations() {
  const dbManager = new DatabaseManager();
  
  try {
    console.log('Starting database migrations...');
    await dbManager.initialize();
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

async function checkMigrationStatus() {
  const dbManager = new DatabaseManager();
  
  try {
    await dbManager.connect();
    const currentVersion = await dbManager.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    const pendingMigrations = dbManager.migrations.filter(m => m.version > currentVersion);
    if (pendingMigrations.length > 0) {
      console.log('Pending migrations:');
      pendingMigrations.forEach(m => {
        console.log(`  - Version ${m.version}: ${m.description}`);
      });
    } else {
      console.log('Database is up to date');
    }
  } catch (error) {
    console.error('Error checking migration status:', error);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'migrate':
    runMigrations();
    break;
  case 'status':
    checkMigrationStatus();
    break;
  default:
    console.log('Usage:');
    console.log('  node migrate.js up      - Run pending migrations');
    console.log('  node migrate.js status  - Check migration status');
    process.exit(1);
}