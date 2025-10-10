// electron/services/scheduler.service.ts
import type { GameId } from "../common/types";
import { refreshCodes } from "./codes.service";

const GAMES: GameId[] = ["genshin", "starrail", "honkai", "themis", "zenless"];
let timer: NodeJS.Timeout | null = null;

export function startCodesScheduler(intervalMs = 60_000) {
    stopCodesScheduler();
    timer = setInterval(async () => {
        try {
            await Promise.all(GAMES.map(g => refreshCodes(g)));
        } catch {
            // silenciar en background
        }
    }, intervalMs);
}

export function stopCodesScheduler() {
    if (timer) clearInterval(timer);
    timer = null;
}
