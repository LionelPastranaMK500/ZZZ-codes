// src/components/Header.tsx
import type { Game } from "../types";

const GAMES: Game[] = ["genshin", "starrail", "honkai", "themis", "zenless"];

type HeaderProps = {
    selectedGame: Game;
    onGameChange: (game: Game) => void;
};

export function Header({ selectedGame, onGameChange }: HeaderProps) {
    return (
        <header className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Hoyoverse</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Códigos activos e inactivos por juego (auto-refresh cada 60s)
                </p>
            </div>
            <div className="flex gap-3">
                <select
                    className="bg-gray-800 px-3 py-2 rounded-xl"
                    value={selectedGame}
                    onChange={(e) => onGameChange(e.target.value as Game)}
                >
                    {GAMES.map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </select>
            </div>
        </header>
    );
}