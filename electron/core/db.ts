// electron/core/db.ts
import { app } from "electron";
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS user_prefs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS redeemed_codes (
  game TEXT NOT NULL,
  code TEXT PRIMARY KEY,
  redeemed_at INTEGER NOT NULL,
  reward_json TEXT,
  source TEXT
);
CREATE INDEX IF NOT EXISTS idx_redeemed_game ON redeemed_codes(game);
CREATE TABLE IF NOT EXISTS read_news (
  game TEXT NOT NULL,
  article_id TEXT PRIMARY KEY,
  category TEXT,
  read_at INTEGER NOT NULL,
  url TEXT
);
CREATE INDEX IF NOT EXISTS idx_read_news_game ON read_news(game);
CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  ttl_seconds INTEGER NOT NULL
);
INSERT OR IGNORE INTO schema_version(version, applied_at)
VALUES (1, strftime('%s','now'));
`;

let db: Database.Database;

export function getDb() {
    if (db) return db;
    const dataDir = join(app.getPath("userData"), "data");
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    const dbPath = join(dataDir, "app.db");

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(MIGRATION_SQL);
    return db;
}
