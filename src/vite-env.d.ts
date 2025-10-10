/// <reference types="vite/client" />

import type { GameId, CodesPayload } from "../../electron/common/types";

// Define la API expuesta desde el proceso de preload al de renderizado.
declare global {
  interface Window {
    api: {
      codes: {
        list: (game: GameId) => Promise<CodesPayload>;
        refresh: (game: GameId) => Promise<CodesPayload>;
      };
      prefs: {
        get: <T = unknown>(k: string) => Promise<T | null>;
        set: (k: string, v: any) => Promise<boolean>;
      }
    };
  }
}