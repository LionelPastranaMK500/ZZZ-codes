// electron/ipc/codes.ipc.ts
import { ipcMain } from "electron";
import type { GameId } from "../core/types";
import { listCodes, refreshCodes } from "../services/codes.service";

export function registerCodesIpc() {
    ipcMain.handle("codes:list", async (_evt, game: GameId) => listCodes(game));
    ipcMain.handle("codes:refresh", async (_evt, game: GameId) => refreshCodes(game));
}
