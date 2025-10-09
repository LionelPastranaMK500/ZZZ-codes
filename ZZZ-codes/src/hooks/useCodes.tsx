// src/hooks/useCodes.tsx
import { useState, useEffect, useRef } from "react";
// 👇 LÍNEA 1 CORREGIDA: Se quita la importación de "ToastId"
import { toast } from "react-toastify";
import type { Game, Payload } from "../types";
import { toPayload } from "../lib/api-helpers";

const GAMES: Game[] = ["genshin", "starrail", "honkai", "themis", "zenless"];
const REFRESH_TOAST_ID = "refresh-toast";

export function useCodes(currentGame: Game) {
    // --- Estados principales (sin cambios) ---
    const [data, setData] = useState<Payload>({ active: [], inactive: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allData, setAllData] = useState<Partial<Record<Game, Payload>>>({});
    const [lastActiveByGame, setLastActiveByGame] = useState<Partial<Record<Game, Set<string>>>>({});
    const [flash, setFlash] = useState<Set<string>>(new Set());

    // --- NUEVOS ESTADOS para notificaciones inteligentes ---
    const [isFocused, setIsFocused] = useState(true);
    const [backgroundRefreshCount, setBackgroundRefreshCount] = useState(0);
    // 👇 LÍNEA 2 CORREGIDA: Se usa el tipo correcto para el ID del toast
    const toastId = useRef<string | number | null>(null);

    // --- Lógica de actualización (modificada) ---
    async function refreshAll(isPollingRefresh = false) {
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

            // --- LÓGICA DE TOAST MODIFICADA ---
            if (isPollingRefresh) {
                if (isFocused) {
                    if (toast.isActive(REFRESH_TOAST_ID) && toastId.current) {
                        toast.update(toastId.current, { render: "Códigos actualizados" });
                    } else {
                        toastId.current = toast.info("Códigos actualizados", { icon: <span>🔄</span>, toastId: REFRESH_TOAST_ID });
                    }
                } else {
                    setBackgroundRefreshCount((count) => count + 1);
                }
            }

            // Notificaciones del sistema (sin cambios)
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

    // --- NUEVO EFECTO: Detectar si la ventana está activa ---
    useEffect(() => {
        const onFocus = () => setIsFocused(true);
        const onBlur = () => setIsFocused(false);

        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    // --- NUEVO EFECTO: Mostrar toast acumulado al volver a la app ---
    useEffect(() => {
        if (isFocused && backgroundRefreshCount > 0) {
            const message = `Códigos actualizados (x${backgroundRefreshCount})`;
            if (toast.isActive(REFRESH_TOAST_ID) && toastId.current) {
                toast.update(toastId.current, { render: message });
            } else {
                toastId.current = toast.info(message, { icon: <span>🔄</span>, toastId: REFRESH_TOAST_ID });
            }
            setBackgroundRefreshCount(0);
        }
    }, [isFocused, backgroundRefreshCount]);


    // Carga inicial (sin cambios)
    useEffect(() => {
        setLoading(true);
        refreshAll(false);
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => { });
        }
    }, []);

    // Cambiar de juego (sin cambios)
    useEffect(() => {
        const cachedData = allData[currentGame];
        if (cachedData) setData(cachedData);
    }, [currentGame, allData]);

    // Polling (dependencias actualizadas)
    useEffect(() => {
        const intervalId = setInterval(() => refreshAll(true), 60_000);
        return () => clearInterval(intervalId);
    }, [isFocused, allData, lastActiveByGame]);

    // Sincronizar datos (sin cambios)
    useEffect(() => {
        if (allData[currentGame]) setData(allData[currentGame]!);
    }, [currentGame, allData]);

    return { data, loading, error, flash };
}