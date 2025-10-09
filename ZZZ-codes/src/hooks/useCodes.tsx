// src/hooks/useCodes.ts
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import type { Game, Payload } from "../types";
import { toPayload } from "../lib/api-helpers";

const GAMES: Game[] = ["genshin", "starrail", "honkai", "themis", "zenless"];

export function useCodes(currentGame: Game) {
    // Estado principal
    const [data, setData] = useState<Payload>({ active: [], inactive: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Caché en memoria para todos los juegos
    const [allData, setAllData] = useState<Partial<Record<Game, Payload>>>({});
    const [lastActiveByGame, setLastActiveByGame] = useState<Partial<Record<Game, Set<string>>>>({});

    // Estado para resaltar códigos nuevos
    const [flash, setFlash] = useState<Set<string>>(new Set());

    async function refreshAll(showToast = false) {
        try {
            const results = await Promise.all(
                GAMES.map(async (g) => {
                    const raw = await window.api.codes.list(g);
                    return [g, toPayload(raw)] as const;
                })
            );

            const nextAllData: Partial<Record<Game, Payload>> = {};
            const nextLastActive: Partial<Record<Game, Set<string>>> = {};
            const newPerGame: Array<{ game: Game; codes: string[] }> = [];

            for (const [g, payload] of results) {
                nextAllData[g] = payload;
                const prevActive = lastActiveByGame[g] ?? new Set<string>();
                const currentActiveCodes = payload.active.map((c) => c.code);
                const currentActiveSet = new Set(currentActiveCodes);

                const newCodes = currentActiveCodes.filter((c) => !prevActive.has(c));
                if (newCodes.length > 0) {
                    newPerGame.push({ game: g, codes: newCodes });
                }
                nextLastActive[g] = currentActiveSet;
            }

            setAllData(nextAllData);
            setLastActiveByGame(nextLastActive);

            if (showToast) {
                // 👇 AQUÍ ESTÁ LA CORRECCIÓN
                toast.info("Códigos actualizados", { icon: <span>🔄</span> });
        }

            if (newPerGame.length > 0 && typeof Notification !== "undefined" && Notification.permission === "granted") {
            const body = newPerGame
                .map(({ game: g, codes }) => `${g}: ${codes.slice(0, 4).join(", ")}${codes.length > 4 ? "…" : ""}`)
                .join("\n");
            new Notification("Nuevos códigos activos", { body });
        }

        const newCodesForCurrentGame = newPerGame.find((x) => x.game === currentGame);
        if (newCodesForCurrentGame?.codes.length) {
            setFlash(new Set(newCodesForCurrentGame.codes));
            setTimeout(() => setFlash(new Set()), 5000);
        }
    } catch (e: any) {
        setError(e?.message ?? "Error al refrescar");
        toast.error("Error al refrescar");
    } finally {
        setLoading(false);
    }
}

// Carga inicial y solicitud de permisos de notificación
useEffect(() => {
    setLoading(true);
    refreshAll(false);

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(() => { });
    }
}, []);

// Efecto para cambiar los datos mostrados cuando cambia el juego
useEffect(() => {
    const cachedData = allData[currentGame];
    if (cachedData) {
        setData(cachedData);
    }
    // Si no está en caché, la carga inicial o el polling lo traerán eventualmente
}, [currentGame, allData]);

// Polling para refrescar todos los códigos cada 60 segundos
useEffect(() => {
    const intervalId = setInterval(() => refreshAll(true), 60_000);
    return () => clearInterval(intervalId);
}, [currentGame, allData, lastActiveByGame]); // Dependencias para recrear el intervalo si cambian

// Sincronizar los datos del juego actual en la UI
useEffect(() => {
    if (allData[currentGame]) {
        setData(allData[currentGame]!);
    }
}, [currentGame, allData]);

return { data, loading, error, flash };
}