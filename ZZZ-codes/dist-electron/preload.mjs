"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // seguir recibiendo mensajes de prueba si quieres
  onMainMessage(cb) {
    const handler = (_e, msg) => cb(msg);
    electron.ipcRenderer.on("main-process-message", handler);
    return () => electron.ipcRenderer.removeListener("main-process-message", handler);
  },
  // 👉 nueva función para pedir los códigos al main
  getCodes: () => electron.ipcRenderer.invoke("codes:fetch")
});
