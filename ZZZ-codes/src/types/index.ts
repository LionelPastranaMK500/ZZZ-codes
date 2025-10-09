// src/types/index.ts
export type Game = "genshin" | "starrail" | "honkai" | "themis" | "zenless";

export type CodeItem = {
    code: string;
    rewards: string[];
    [k: string]: any;
};

export type Payload = {
    active: CodeItem[];
    inactive: CodeItem[];
};