// electron/repos/cache.repo.ts
import { getDb } from "../core/db";

export function getCache<T = unknown>(key: string): T | null {
    const row = getDb()
        .prepare(
            "SELECT payload_json, fetched_at, ttl_seconds FROM cache_entries WHERE key = ?"
        )
        .get(key) as { payload_json: string; fetched_at: number; ttl_seconds: number } | undefined;

    if (!row) return null;
    const now = Math.floor(Date.now() / 1000);
    if (now > row.fetched_at + row.ttl_seconds) return null;
    return JSON.parse(row.payload_json) as T;
}

export function upsertCache(key: string, payload: unknown, ttlSeconds: number) {
    const now = Math.floor(Date.now() / 1000);
    getDb()
        .prepare(
            `INSERT INTO cache_entries(key, payload_json, fetched_at, ttl_seconds)
       VALUES(@key, @payload_json, @fetched_at, @ttl_seconds)
       ON CONFLICT(key) DO UPDATE SET
         payload_json = excluded.payload_json,
         fetched_at = excluded.fetched_at,
         ttl_seconds = excluded.ttl_seconds`
        )
        .run({
            key,
            payload_json: JSON.stringify(payload),
            fetched_at: now,
            ttl_seconds: ttlSeconds,
        });
}
