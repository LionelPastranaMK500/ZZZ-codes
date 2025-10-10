// electron/repos/activity.repo.ts
import { getDb } from "../core/db";
import type { GameId } from "../core/types";

export type ReadCategory = "notices" | "events" | "info";

export type RedeemedCodeRow = {
    game: GameId;
    code: string;
    redeemed_at: number;   // epoch seconds
    reward_json?: string | null;
    source?: string | null;
};

export function isCodeRedeemed(code: string): boolean {
    const row = getDb()
        .prepare("SELECT 1 FROM redeemed_codes WHERE code = ? LIMIT 1")
        .get(code) as { 1: 1 } | undefined;
    return !!row;
}

export function insertRedeemedCode(entry: Omit<RedeemedCodeRow, "redeemed_at"> & { redeemed_at?: number }) {
    const now = Math.floor(Date.now() / 1000);
    getDb()
        .prepare(
            `INSERT OR IGNORE INTO redeemed_codes(game, code, redeemed_at, reward_json, source)
       VALUES(@game, @code, @redeemed_at, @reward_json, @source)`
        )
        .run({
            ...entry,
            redeemed_at: entry.redeemed_at ?? now,
        });
}

export function listRedeemedCodes(game?: GameId): RedeemedCodeRow[] {
    const db = getDb();
    if (game) {
        return db
            .prepare("SELECT game, code, redeemed_at, reward_json, source FROM redeemed_codes WHERE game = ? ORDER BY redeemed_at DESC")
            .all(game) as RedeemedCodeRow[];
    }
    return db
        .prepare("SELECT game, code, redeemed_at, reward_json, source FROM redeemed_codes ORDER BY redeemed_at DESC")
        .all() as RedeemedCodeRow[];
}

// -------- read_news ---------

export type ReadNewsRow = {
    game: GameId;
    article_id: string;
    category: ReadCategory | null;
    read_at: number;
    url: string | null;
};

export function markArticleRead(params: {
    game: GameId; article_id: string; category?: ReadCategory | null; url?: string | null; read_at?: number;
}) {
    const now = Math.floor(Date.now() / 1000);
    getDb()
        .prepare(
            `INSERT OR IGNORE INTO read_news(game, article_id, category, read_at, url)
       VALUES(@game, @article_id, @category, @read_at, @url)`
        )
        .run({
            game: params.game,
            article_id: params.article_id,
            category: params.category ?? null,
            read_at: params.read_at ?? now,
            url: params.url ?? null,
        });
}

export function isArticleRead(article_id: string): boolean {
    const row = getDb()
        .prepare("SELECT 1 FROM read_news WHERE article_id = ? LIMIT 1")
        .get(article_id) as { 1: 1 } | undefined;
    return !!row;
}

export function listReadNews(game?: GameId, category?: ReadCategory | null): ReadNewsRow[] {
    const db = getDb();
    if (game && typeof category !== "undefined") {
        return db
            .prepare(`SELECT game, article_id, category, read_at, url
                FROM read_news WHERE game = ? AND category IS ? ORDER BY read_at DESC`)
            .all(game, category) as ReadNewsRow[];
    }
    if (game) {
        return db
            .prepare(`SELECT game, article_id, category, read_at, url
                FROM read_news WHERE game = ? ORDER BY read_at DESC`)
            .all(game) as ReadNewsRow[];
    }
    return db
        .prepare(`SELECT game, article_id, category, read_at, url
              FROM read_news ORDER BY read_at DESC`)
        .all() as ReadNewsRow[];
}
