import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { getCache, setCache, getDb, type GameId } from './db';
import { join } from 'node:path';

const API_BASE = 'https://api.ennead.cc/mihoyo';
const CODES_TTL = 15 * 60;

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ZZZ-Codes/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 768,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });


  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, '..', 'dist', 'index.html'));
  }
}

function registerIpc() {
  ipcMain.handle('codes:list', async (_evt, game: GameId) => {
    const key = `${game}/codes`;
    const cached = getCache(key);
    if (cached) return cached;

    const data = await fetchJson(`${API_BASE}/${game}/codes`);
    setCache(key, data, CODES_TTL);
    return data;
  });

  ipcMain.handle('codes:refresh', async (_evt, game: GameId) => {
    const data = await fetchJson(`${API_BASE}/${game}/codes`);
    setCache(`${game}/codes`, data, CODES_TTL);
    return data;
  });
}

app.whenReady().then(() => {
  getDb();
  registerIpc();
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
