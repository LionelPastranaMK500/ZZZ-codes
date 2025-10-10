// src/lib/api-helpers.ts
import type { CodeItem, CodesPayload } from "../../electron/common/types";

export function toPayload(raw: any): CodesPayload {
    const normList = (arr: any[]): CodeItem[] =>
        (arr ?? []).map((x: any) => {
            let rewards: string[] = [];
            if (Array.isArray(x?.rewards)) {
                rewards =
                    typeof x.rewards[0] === "string"
                        ? x.rewards
                        : x.rewards.map((r: any) => r?.name ?? String(r));
            }
            return { code: String(x?.code ?? ""), rewards };
        });

    if (raw && Array.isArray(raw.active) && Array.isArray(raw.inactive)) {
        return { active: normList(raw.active), inactive: normList(raw.inactive) };
    }
    return { active: [], inactive: [] };
}