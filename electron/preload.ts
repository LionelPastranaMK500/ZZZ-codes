// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";
import type { GameId } from "./core/types";

contextBridge.exposeInMainWorld("api", {
  codes: {
    list: (game: GameId) => ipcRenderer.invoke("codes:list", game),
    refresh: (game: GameId) => ipcRenderer.invoke("codes:refresh", game),
  },
  prefs: {
    get: (k: string) => ipcRenderer.invoke("prefs:get", k),
    set: (k: string, v: any) => ipcRenderer.invoke("prefs:set", k, v),
  },
});
