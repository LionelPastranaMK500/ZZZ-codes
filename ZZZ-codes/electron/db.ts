import { app } from "electron";
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

export type GameId = "genshin" | "starrail" | "honkai" | "themis" | "zenless";

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
  -- genshin | starrail | honkai | themis | zenless
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
  -- notices | events | info
  read_at INTEGER NOT NULL,
  url TEXT
);
CREATE INDEX IF NOT EXISTS idx_read_news_game ON read_news(game);
CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY, -- ej: 'zenless/codes'
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
  const userDir = app.getPath("userData");
  const dataDir = join(userDir, "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const dbPath = join(dataDir, "app.db");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(MIGRATION_SQL);
  return db;
}

export function getCache(key: string) {
  const row = getDb()
    .prepare(
      "SELECT payload_json, fetched_at, ttl_seconds FROM cache_entries WHERE key = ?"
    )
    .get(key) as { payload_json: string; fetched_at: number; ttl_seconds: number } | undefined;

  if (!row) return null;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = row.fetched_at + row.ttl_seconds;
  if (now > expiresAt) return null;
  return JSON.parse(row.payload_json);
}

export function setCache(key: string, payload: unknown, ttlSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  getDb()
    .prepare(
      `INSERT INTO cache_entries(key, payload_json, fetched_at, ttl_seconds)
       VALUES(@key, @payload_json, @fetched_at, @ttl_seconds)
       ON CONFLICT(key) DO UPDATE SET
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at,
         ttl_seconds = excluded.ttl_seconds`
    )
    .run({
      key,
      payload_json: JSON.stringify(payload),
      fetched_at: now,
      ttl_seconds: ttlSeconds,
    });
}
