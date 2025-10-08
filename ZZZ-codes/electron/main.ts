// electron/main.ts
import { app, BrowserWindow, Menu } from "electron";
import { join } from "node:path";
import { getDb } from "./core/db";
import { registerCodesIpc } from "./ipc/codes.icp.ts";
import { registerPrefsIpc } from "./ipc/prefs.ipc.ts";
import { startCodesScheduler } from "./services/scheduler.service";

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 768,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  getDb();
  registerCodesIpc();
  registerPrefsIpc();         // ✅ prefs
  startCodesScheduler();      // ✅ background refresh (60s)

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
