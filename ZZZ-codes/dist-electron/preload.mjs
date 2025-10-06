"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  onMainMessage(cb) {
    const handler = (_e, msg) => cb(msg);
    electron.ipcRenderer.on("main-process-message", handler);
    return () => electron.ipcRenderer.removeListener("main-process-message", handler);
  }
});
