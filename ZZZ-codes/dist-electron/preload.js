"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  codes: {
    list: (game) => electron.ipcRenderer.invoke("codes:list", game),
    refresh: (game) => electron.ipcRenderer.invoke("codes:refresh", game)
  }
});
