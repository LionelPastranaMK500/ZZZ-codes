// electron/ipc/prefs.ipc.ts
import { ipcMain } from "electron";
import { getPref, setPref } from "../repos/prefs.repo";
import { ValidationError } from "../core/errors";
import { logIPC } from "../core/logger";

export function registerPrefsIpc() {
    ipcMain.handle("prefs:get", async (_evt, key: string) => {
        if (!key || typeof key !== "string") {
            throw new ValidationError("prefs:get requiere una clave string");
        }
        const val = getPref<any>(key);
        logIPC.debug("prefs:get", key, val);
        return val; // puede ser null
    });

    ipcMain.handle("prefs:set", async (_evt, key: string, value: unknown) => {
        if (!key || typeof key !== "string") {
            throw new ValidationError("prefs:set requiere una clave string");
        }
        setPref(key, value);
        logIPC.debug("prefs:set", key, value);
        return true;
    });
}
