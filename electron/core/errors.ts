// electron/core/errors.ts
export class AppError extends Error {
    // 👇 importante: que sea string, no literal "AppError"
    override name: string = "AppError";
    constructor(
        message: string,
        public readonly code: string = "APP_ERROR",
        public readonly cause?: unknown
    ) {
        super(message);
        // Mantener la cadena de prototipos correcta en TS/Node
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class HttpError extends AppError {
    override name: string = "HttpError";
    constructor(
        public readonly status: number,
        message = `HTTP ${status}`,
        cause?: unknown
    ) {
        super(message, "HTTP_ERROR", cause);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class DbError extends AppError {
    override name: string = "DbError";
    constructor(message: string, cause?: unknown) {
        super(message, "DB_ERROR", cause);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ValidationError extends AppError {
    override name: string = "ValidationError";
    constructor(message: string) {
        super(message, "VALIDATION_ERROR");
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Convierte cualquier error a algo serializable (útil para IPC). */
export function serializeError(err: unknown) {
    const e = err as any;
    return {
        name: e?.name ?? "Error",
        message: e?.message ?? String(e),
        code: e?.code ?? undefined,
        status: e?.status ?? undefined,
        stack: e?.stack ?? undefined,
    };
}
