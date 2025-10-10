// electron/core/logger.ts
type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

// Cambia este valor si quieres silenciar en producción:
const DEFAULT_LEVEL: Level = process.env.NODE_ENV === "production" ? "info" : "debug";

export function createLogger(namespace: string, level: Level = DEFAULT_LEVEL) {
    const min = LEVEL_ORDER[level];

    function fmt(lvl: Level, args: any[]) {
        const ts = new Date().toISOString();
        return [`[${ts}] [${lvl.toUpperCase()}] [${namespace}]`, ...args];
    }

    return {
        debug: (...a: any[]) => LEVEL_ORDER["debug"] >= min && console.debug(...fmt("debug", a)),
        info: (...a: any[]) => LEVEL_ORDER["info"] >= min && console.info(...fmt("info", a)),
        warn: (...a: any[]) => LEVEL_ORDER["warn"] >= min && console.warn(...fmt("warn", a)),
        error: (...a: any[]) => LEVEL_ORDER["error"] >= min && console.error(...fmt("error", a)),
        setLevel: (lvl: Level) => void (level = lvl),
        get level() { return level; },
    };
}

export const logMain = createLogger("main");
export const logIPC = createLogger("ipc");
export const logDB = createLogger("db");
export const logRepo = createLogger("repo");
export const logSvc = createLogger("service");
export const logSched = createLogger("scheduler");
