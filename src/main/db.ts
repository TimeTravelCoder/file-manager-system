import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// Ensure userData path is available (might need to wait for app ready in some cases, 
// but usually safe if imported after app start or lazily)
// For safety, we can export a function to get the DB or init it.

let db: Database.Database | null = null;

export function getDB() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'file_manager.db');
    console.log('Database path:', dbPath);
    db = new Database(dbPath);
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      extension TEXT NOT NULL,
      created_at TEXT NOT NULL,
      archived_at TEXT,
      status TEXT DEFAULT 'active' -- 'active', 'archived', 'deleted'
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS file_tags (
      file_id INTEGER,
      tag_id INTEGER,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY(file_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migration: Add usage_count if not exists
  try {
    const tableInfo = database.prepare("PRAGMA table_info(tags)").all() as any[];
    const hasUsageCount = tableInfo.some(col => col.name === 'usage_count');
    if (!hasUsageCount) {
      database.exec("ALTER TABLE tags ADD COLUMN usage_count INTEGER DEFAULT 0");
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

export default getDB;
