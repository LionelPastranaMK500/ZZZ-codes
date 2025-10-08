// electron/core/http.ts
import { USER_AGENT } from "./env";

export async function fetchJson<T = unknown>(
    url: string,
    { retries = 1, timeoutMs = 12_000 }: { retries?: number; timeoutMs?: number } = {}
): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(url, {
                headers: { "User-Agent": USER_AGENT },
                signal: controller.signal,
            });
            clearTimeout(id);
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
            return (await res.json()) as T;
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        }
    }
    // Unreachable
    throw new Error("fetchJson failed");
}
