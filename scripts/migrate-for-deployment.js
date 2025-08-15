#!/usr/bin/env node

/**
 * Migration script to ensure all database tables are properly created for deployment
 * This runs before the application starts in production
 */

import { execSync } from 'child_process';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    console.log('🔄 Starting database migration for deployment...');
    
    // Run drizzle-kit push with auto-confirm
    console.log('📊 Applying schema changes...');
    execSync('printf "y\\ny\\ny\\ny\\ny\\n" | npx drizzle-kit push', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    // Ensure sessions table exists with proper structure
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
    `);
    
    // Verify critical tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log('✅ Database tables verified:', tables.length, 'tables found');
    
    const requiredTables = [
      'schools', 'users', 'grades', 'students', 
      'passes', 'sessions', 'audits', 'kiosk_devices'
    ];
    
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export default runMigration;