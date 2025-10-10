// electron/services/codes.service.ts
import { fetchJson } from "../core/http";
import { API_BASE, TTL } from "../core/env";
import type { CodesPayload, GameId } from "../common/types";
import { getCache, upsertCache } from "../repos/cache.repo";
import { logSvc } from "../core/logger";

const keyFor = (g: GameId) => `${g}/codes`;

export async function listCodes(game: GameId): Promise<CodesPayload> {
    const cached = getCache<CodesPayload>(keyFor(game));
    if (cached) return cached;
    const data = await fetchJson<CodesPayload>(`${API_BASE}/${game}/codes`);
    upsertCache(keyFor(game), data, TTL.CODES);
    logSvc.debug("listCodes (miss)", game);
    return data;
}

export async function refreshCodes(game: GameId): Promise<CodesPayload> {
    const data = await fetchJson<CodesPayload>(`${API_BASE}/${game}/codes`);
    upsertCache(keyFor(game), data, TTL.CODES);
    logSvc.debug("refreshCodes", game);
    return data;
}
