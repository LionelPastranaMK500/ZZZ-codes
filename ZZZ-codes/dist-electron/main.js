"use strict";
const electron = require("electron");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const node_path = require("node:path");
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
let db;
function getDb() {
  if (db) return db;
  const userDir = electron.app.getPath("userData");
  const dataDir = path.join(userDir, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "app.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(MIGRATION_SQL);
  return db;
}
function getCache(key) {
  const row = getDb().prepare(
    "SELECT payload_json, fetched_at, ttl_seconds FROM cache_entries WHERE key = ?"
  ).get(key);
  if (!row) return null;
  const now = Math.floor(Date.now() / 1e3);
  const expiresAt = row.fetched_at + row.ttl_seconds;
  if (now > expiresAt) return null;
  return JSON.parse(row.payload_json);
}
function setCache(key, payload, ttlSeconds) {
  const now = Math.floor(Date.now() / 1e3);
  getDb().prepare(
    `INSERT INTO cache_entries(key, payload_json, fetched_at, ttl_seconds)
       VALUES(@key, @payload_json, @fetched_at, @ttl_seconds)
       ON CONFLICT(key) DO UPDATE SET
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at,
         ttl_seconds = excluded.ttl_seconds`
  ).run({
    key,
    payload_json: JSON.stringify(payload),
    fetched_at: now,
    ttl_seconds: ttlSeconds
  });
}
const API_BASE = "https://api.ennead.cc/mihoyo";
const CODES_TTL = 15 * 60;
async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "ZZZ-Codes/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1100,
    height: 768,
    webPreferences: {
      preload: node_path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(node_path.join(__dirname, "..", "dist", "index.html"));
  }
}
function registerIpc() {
  electron.ipcMain.handle("codes:list", async (_evt, game) => {
    const key = `${game}/codes`;
    const cached = getCache(key);
    if (cached) return cached;
    const data = await fetchJson(`${API_BASE}/${game}/codes`);
    setCache(key, data, CODES_TTL);
    return data;
  });
  electron.ipcMain.handle("codes:refresh", async (_evt, game) => {
    const data = await fetchJson(`${API_BASE}/${game}/codes`);
    setCache(`${game}/codes`, data, CODES_TTL);
    return data;
  });
}
electron.app.whenReady().then(() => {
  getDb();
  registerIpc();
  electron.Menu.setApplicationMenu(null);
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
