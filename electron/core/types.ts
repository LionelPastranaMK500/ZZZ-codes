// electron/core/types.ts
export type GameId = "genshin" | "starrail" | "honkai" | "themis" | "zenless";

export type CodeItem = {
    code: string;
    rewards: string[];
    [k: string]: unknown;
};

export type CodesPayload = {
    active: CodeItem[];
    inactive: CodeItem[];
};
