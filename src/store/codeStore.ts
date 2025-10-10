// src/store/codesStore.ts
import { create } from 'zustand';
import type { GameId, CodesPayload } from '../../electron/common/types';
import { toPayload } from '../lib/api-helpers';

const GAMES: GameId[] = ["genshin", "starrail", "honkai", "themis", "zenless"];

interface CodesState {
  allData: Partial<Record<GameId, CodesPayload>>;
  lastActiveByGame: Partial<Record<GameId, Set<string>>>;
  loading: boolean;
  error: string | null;
  newCodes: Array<{ game: GameId; codes: string[] }>;
  fetchInitialData: () => Promise<void>;
  refreshAll: (isPollingRefresh: boolean) => Promise<void>;
  clearNewCodes: () => void;
}

export const useCodesStore = create<CodesState>((set, get) => ({
  allData: {},
  lastActiveByGame: {},
  loading: true,
  error: null,
  newCodes: [],

  clearNewCodes: () => set({ newCodes: [] }),

  refreshAll: async (isPollingRefresh: boolean) => {
    if (!isPollingRefresh) {
        set({ loading: true, error: null });
    }

    try {
      const results = await Promise.all(
        GAMES.map(async (g) => {
          const raw = await window.api.codes.list(g);
          return [g, toPayload(raw)] as const;
        })
      );

      const nextAllData: Partial<Record<GameId, CodesPayload>> = {};
      const nextLastActive: Partial<Record<GameId, Set<string>>> = {};
      const newPerGame: Array<{ game: GameId; codes: string[] }> = [];
      const lastActiveByGame = get().lastActiveByGame;

      for (const [g, payload] of results) {
        // --- Data Cleaning ---
        // Ensure a code is not in both active and inactive lists (active wins)
        const activeCodes = new Set(payload.active.map(c => c.code));
        payload.inactive = payload.inactive.filter(c => !activeCodes.has(c.code));
        
        // Ensure no duplicate codes within the active list itself
        const seenActive = new Set<string>();
        payload.active = payload.active.filter(c => {
            if (seenActive.has(c.code)) {
                return false;
            }
            seenActive.add(c.code);
            return true;
        });
        
        nextAllData[g] = payload;
        
        const prevActive = lastActiveByGame[g] ?? new Set<string>();
        const currentActiveCodes = payload.active.map((c) => c.code);
        const currentActiveSet = new Set(currentActiveCodes);
        // Only notify on polling refreshes to avoid spamming on initial load
        const foundNewCodes = currentActiveCodes.filter((c) => !prevActive.has(c));

        if (foundNewCodes.length > 0 && isPollingRefresh) { 
          newPerGame.push({ game: g, codes: foundNewCodes });
        }
        nextLastActive[g] = currentActiveSet;
      }

      set({
        allData: nextAllData,
        lastActiveByGame: nextLastActive,
        newCodes: newPerGame,
        error: null,
      });

    } catch (e: any) {
      set({ error: e?.message ?? "Error al refrescar" });
    } finally {
      set({ loading: false });
    }
  },

  fetchInitialData: async () => {
    // Only fetch if data is empty
    if (Object.keys(get().allData).length === 0) {
      await get().refreshAll(false);
    }
  },
}));