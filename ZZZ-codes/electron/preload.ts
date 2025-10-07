import { contextBridge, ipcRenderer } from "electron";
import type { GameId } from "./db";

contextBridge.exposeInMainWorld("api", {
  codes: {
    list: (game: GameId) => ipcRenderer.invoke("codes:list", game),
    refresh: (game: GameId) => ipcRenderer.invoke("codes:refresh", game),
  },
});
