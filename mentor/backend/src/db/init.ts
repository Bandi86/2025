import { openDb } from '../db';
import fs from 'fs/promises';
import path from 'path';

export const initializeDatabase = async () => {
  try {
    const db = await openDb();
    
    // Read the schema file from the correct path
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    // Execute the schema to create all tables
    await db.exec(schema);
    
    console.log('Database initialized successfully with all tables');
    
    // Enable foreign key constraints
    await db.exec('PRAGMA foreign_keys = ON;');
    
    await db.close();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
