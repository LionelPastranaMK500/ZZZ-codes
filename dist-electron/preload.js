"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  codes: {
    list: (game) => electron.ipcRenderer.invoke("codes:list", game),
    refresh: (game) => electron.ipcRenderer.invoke("codes:refresh", game)
  },
  prefs: {
    get: (k) => electron.ipcRenderer.invoke("prefs:get", k),
    set: (k, v) => electron.ipcRenderer.invoke("prefs:set", k, v)
  }
});
