// src/hooks/useCodes.tsx
import { useEffect, useState } from 'react';
import { useCodesStore } from '../store/codeStore';
import type { GameId } from '../../electron/common/types';

/**
 * A simplified hook that connects to the central store to provide code data
 * for the currently selected game and handles UI-specific effects.
 */
export function useCodes(currentGame: GameId) {
  // Select required state and actions from the Zustand store
  const { allData, loading, error, fetchInitialData, refreshAll } = useCodesStore(state => ({
    allData: state.allData,
    loading: state.loading,
    error: state.error,
    fetchInitialData: state.fetchInitialData,
    refreshAll: state.refreshAll,
  }));

  // Local state for the "flash" effect on new codes
  const [flash, setFlash] = useState<Set<string>>(new Set());
  
  // Subscribe to just the `newCodes` piece of state for handling the flash effect
  const newCodes = useCodesStore(state => state.newCodes);

  // Memoize the data for the current game to prevent unnecessary re-renders
  const data = allData[currentGame] ?? { active: [], inactive: [] };

  // Trigger the initial data fetch on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Set up the 60-second polling interval
  useEffect(() => {
    const intervalId = setInterval(() => refreshAll(true), 60_000);
    return () => clearInterval(intervalId);
  }, [refreshAll]);
  
  // Watch for new codes for the *current* game and trigger the flash effect
  useEffect(() => {
    const newCodesForCurrentGame = newCodes.find((x) => x.game === currentGame);
    if (newCodesForCurrentGame?.codes.length) {
      setFlash(new Set(newCodesForCurrentGame.codes));
      const timer = setTimeout(() => setFlash(new Set()), 5000);
      return () => clearTimeout(timer);
    }
  }, [newCodes, currentGame]);

  return { data, loading, error, flash };
}
