export { };

declare global {
    interface Window {
        api: {
            codes: {
                list: (game: "genshin" | "starrail" | "honkai" | "themis" | "zenless") => Promise<any>;
                refresh: (game: "genshin" | "starrail" | "honkai" | "themis" | "zenless") => Promise<any>;
            };
        };
    }
}
