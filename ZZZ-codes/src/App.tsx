import { useEffect, useState } from "react";

type Game = "genshin" | "starrail" | "honkai" | "themis" | "zenless";

const GAMES: Game[] = ["genshin", "starrail", "honkai", "themis", "zenless"];

export default function App() {
  const [game, setGame] = useState<Game>("zenless");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(g: Game) {
    try {
      setLoading(true);
      setError(null);
      const res = await window.api.codes.list(g);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const res = await window.api.codes.refresh(game);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(game);
  }, [game]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Hoyoverse Codes</h1>
          <div className="flex gap-3">
            <select
              className="bg-gray-800 px-3 py-2 rounded-xl"
              value={game}
              onChange={(e) => setGame(e.target.value as Game)}
            >
              {GAMES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <button
              className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>
        </header>

        {error && <div className="text-red-400">{error}</div>}

        <section className="bg-gray-900 rounded-2xl shadow p-4">
          <pre className="text-sm overflow-auto">
            {data ? JSON.stringify(data, null, 2) : "Sin datos"}
          </pre>
        </section>
      </div>
    </div>
  );
}
