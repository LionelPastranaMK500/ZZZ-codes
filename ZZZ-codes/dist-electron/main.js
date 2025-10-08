"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const electron = require("electron");
const node_path = require("node:path");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
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
let db;
function getDb() {
  if (db) return db;
  const dataDir = path.join(electron.app.getPath("userData"), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "app.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(MIGRATION_SQL);
  return db;
}
const API_BASE = "https://api.ennead.cc/mihoyo";
const USER_AGENT = "ZZZ-Codes/1.0";
const TTL = {
  CODES: 15 * 60
  // 15min
};
async function fetchJson(url, { retries = 1, timeoutMs = 12e3 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal
      });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw new Error("fetchJson failed");
}
function getCache(key) {
  const row = getDb().prepare(
    "SELECT payload_json, fetched_at, ttl_seconds FROM cache_entries WHERE key = ?"
  ).get(key);
  if (!row) return null;
  const now = Math.floor(Date.now() / 1e3);
  if (now > row.fetched_at + row.ttl_seconds) return null;
  return JSON.parse(row.payload_json);
}
function upsertCache(key, payload, ttlSeconds) {
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
const LEVEL_ORDER = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};
const DEFAULT_LEVEL = process.env.NODE_ENV === "production" ? "info" : "debug";
function createLogger(namespace, level = DEFAULT_LEVEL) {
  const min = LEVEL_ORDER[level];
  function fmt(lvl, args) {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return [`[${ts}] [${lvl.toUpperCase()}] [${namespace}]`, ...args];
  }
  return {
    debug: (...a) => LEVEL_ORDER["debug"] >= min && console.debug(...fmt("debug", a)),
    info: (...a) => LEVEL_ORDER["info"] >= min && console.info(...fmt("info", a)),
    warn: (...a) => LEVEL_ORDER["warn"] >= min && console.warn(...fmt("warn", a)),
    error: (...a) => LEVEL_ORDER["error"] >= min && console.error(...fmt("error", a)),
    setLevel: (lvl) => void (level = lvl),
    get level() {
      return level;
    }
  };
}
const logIPC = createLogger("ipc");
const logSvc = createLogger("service");
const keyFor = (g) => `${g}/codes`;
async function listCodes(game) {
  const cached = getCache(keyFor(game));
  if (cached) return cached;
  const data = await fetchJson(`${API_BASE}/${game}/codes`);
  upsertCache(keyFor(game), data, TTL.CODES);
  logSvc.debug("listCodes (miss)", game);
  return data;
}
async function refreshCodes(game) {
  const data = await fetchJson(`${API_BASE}/${game}/codes`);
  upsertCache(keyFor(game), data, TTL.CODES);
  logSvc.debug("refreshCodes", game);
  return data;
}
function registerCodesIpc() {
  electron.ipcMain.handle("codes:list", async (_evt, game) => listCodes(game));
  electron.ipcMain.handle("codes:refresh", async (_evt, game) => refreshCodes(game));
}
function getPref(key) {
  const row = getDb().prepare("SELECT value FROM user_prefs WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : null;
}
function setPref(key, value) {
  const now = Math.floor(Date.now() / 1e3);
  getDb().prepare(
    `INSERT INTO user_prefs(key, value, updated_at)
       VALUES(@key, @val, @ts)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
  ).run({ key, val: JSON.stringify(value), ts: now });
}
class AppError extends Error {
  constructor(message, code = "APP_ERROR", cause) {
    super(message);
    // 👇 importante: que sea string, no literal "AppError"
    __publicField(this, "name", "AppError");
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
class ValidationError extends AppError {
  constructor(message) {
    super(message, "VALIDATION_ERROR");
    __publicField(this, "name", "ValidationError");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
function registerPrefsIpc() {
  electron.ipcMain.handle("prefs:get", async (_evt, key) => {
    if (!key || typeof key !== "string") {
      throw new ValidationError("prefs:get requiere una clave string");
    }
    const val = getPref(key);
    logIPC.debug("prefs:get", key, val);
    return val;
  });
  electron.ipcMain.handle("prefs:set", async (_evt, key, value) => {
    if (!key || typeof key !== "string") {
      throw new ValidationError("prefs:set requiere una clave string");
    }
    setPref(key, value);
    logIPC.debug("prefs:set", key, value);
    return true;
  });
}
const GAMES = ["genshin", "starrail", "honkai", "themis", "zenless"];
let timer = null;
function startCodesScheduler(intervalMs = 6e4) {
  stopCodesScheduler();
  timer = setInterval(async () => {
    try {
      await Promise.all(GAMES.map((g) => refreshCodes(g)));
    } catch {
    }
  }, intervalMs);
}
function stopCodesScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
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
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(node_path.join(__dirname, "..", "dist", "index.html"));
}
electron.app.whenReady().then(() => {
  electron.Menu.setApplicationMenu(null);
  getDb();
  registerCodesIpc();
  registerPrefsIpc();
  startCodesScheduler();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
