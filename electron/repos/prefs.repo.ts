// electron/repos/prefs.repo.ts
import { getDb } from "../core/db";

export function getPref<T = unknown>(key: string): T | null {
    const row = getDb()
        .prepare("SELECT value FROM user_prefs WHERE key = ?")
        .get(key) as { value: string } | undefined;
    return row ? (JSON.parse(row.value) as T) : null;
}

export function setPref(key: string, value: unknown) {
    const now = Math.floor(Date.now() / 1000);
    getDb()
        .prepare(
            `INSERT INTO user_prefs(key, value, updated_at)
       VALUES(@key, @val, @ts)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
        )
        .run({ key, val: JSON.stringify(value), ts: now });
}
