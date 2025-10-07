import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ===== Tipos ===== */
type Game = "genshin" | "starrail" | "honkai" | "themis" | "zenless";
type CodeItem = { code: string; rewards: string[]; [k: string]: any };
type Payload = { active: CodeItem[]; inactive: CodeItem[] };

/* ===== window.api (preload) ===== */
declare global {
  interface Window {
    api: {
      codes: {
        list: (game: Game) => Promise<any>;
      };
    };
  }
}

/* ===== Normalizar API ===== */
function toPayload(raw: any): Payload {
  const normList = (arr: any[]): CodeItem[] =>
    (arr ?? []).map((x: any) => {
      let rewards: string[] = [];
      if (Array.isArray(x?.rewards)) {
        rewards =
          typeof x.rewards[0] === "string"
            ? x.rewards
            : x.rewards.map((r: any) => r?.name ?? String(r));
      }
      return { code: String(x?.code ?? ""), rewards };
    });

  if (raw && Array.isArray(raw.active) && Array.isArray(raw.inactive)) {
    return { active: normList(raw.active), inactive: normList(raw.inactive) };
  }
  return { active: [], inactive: [] };
}

/* ===== Diccionarios por juego (extiéndelos cuando veas más textos) ===== */
const DICTS: Record<Game, Record<string, string>> = {
  genshin: {
    Primogem: "Protogema",
    Primogems: "Protogemas",
    Mora: "Mora",
    "Hero's Wit": "Ingenio del Héroe",
    "Adventurer's Experience": "Experiencia del Aventurero",
    "Mystic Enhancement Ore": "Mineral de Mejora Mística",
    "Fine Enhancement Ore": "Mineral de Mejora Fino",
    Fragile: "Frágil",
    Resin: "Resina",
  },
  starrail: {
    "Stellar Jade": "Jade Estelar",
    "Star Rail Pass": "Pase del Expreso",
    "Star Rail Special Pass": "Pase Especial del Expreso",
    Credit: "Créditos",
    Credits: "Créditos",
    "Traveler's Guide": "Guía del Viajero",
    "Refined Aether": "Éter Refinado",
  },
  honkai: {
    Crystals: "Cristales",
    Crystal: "Cristal",
    Coins: "Monedas",
    Asterite: "Asterita",
    Stamina: "Energía",
    "Equipment Material": "Material de Equipo",
  },
  themis: {
    "S-Chip": "S-Chip",
    Chip: "Chip",
    Stellin: "Stellin",
    AP: "Energía (AP)",
    "Oracle of Justice": "Oráculo de Justicia",
  },
  zenless: {
    Polychrome: "Policromo",
    "Official Investigator Log": "Registro de Investigador Oficial",
    "Senior Investigator Log": "Registro de Investigador Senior",
    "W-Engine Power Supply": "Suministro de energía de W-Engine",
    "W-Engine Energy Module": "Módulo de energía de W-Engine",
    "Crystallized Plating Agent": "Agente de recubrimiento cristalizado",
    "Bangboo Algorithm Module": "Módulo de algoritmo Bangboo",
    "Bangboo System Widget": "Widget del sistema Bangboo",
    "Ether Plating Agent": "Agente de recubrimiento de Éter",
    "Ether Battery": "Batería de Éter",
    Denny: "Denny",
    Dennies: "Dennies",
  },
};

function translateReward(line: string, game: Game): string {
  let out = line.replace(/×/g, "x");
  const dict = DICTS[game] ?? {};
  for (const [en, es] of Object.entries(dict)) out = out.replaceAll(en, es);
  return out.replace(/,\s*,/g, ", ");
}

/* ===== UI: Botón copiar ===== */
function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 900);
      }}
      className="inline-flex items-center gap-2 rounded-md border border-sky-400/30 bg-sky-400/10
                 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-400/20 active:scale-[.98]
                 transition shadow-sm"
      title="Copiar código"
    >
      {ok ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

/* ===== App ===== */
type TabKey = "active" | "inactive";
const GAMES: Game[] = ["genshin", "starrail", "honkai", "themis", "zenless"];

export default function App() {
  const [game, setGame] = useState<Game>("zenless");
  const [data, setData] = useState<Payload>({ active: [], inactive: [] });
  const [tab, setTab] = useState<TabKey>("active");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [translate, setTranslate] = useState(false);

  // cache de todos los juegos y último set de activos por juego
  const [allData, setAllData] = useState<Partial<Record<Game, Payload>>>({});
  const [lastActiveByGame, setLastActiveByGame] = useState<
    Partial<Record<Game, Set<string>>>
  >({});

  const [flash, setFlash] = useState<Set<string>>(new Set());

  // cargar todos los juegos (para detección global) y el seleccionado para mostrar
  async function refreshAll(showToast = false) {
    try {
      const results = await Promise.all(
        GAMES.map(async (g) => {
          const raw = await window.api.codes.list(g);
          return [g, toPayload(raw)] as const;
        })
      );

      // actualizar cache y detectar nuevos por juego
      const nextAll: Partial<Record<Game, Payload>> = { ...allData };
      const nextLast: Partial<Record<Game, Set<string>>> = { ...lastActiveByGame };
      const newPerGame: Array<{ game: Game; codes: string[] }> = [];

      for (const [g, payload] of results) {
        nextAll[g] = payload;

        const prev = lastActiveByGame[g] ?? new Set<string>();
        const nowArr = payload.active.map((c) => c.code);
        const nowSet = new Set(nowArr);
        const nuevos = nowArr.filter((c) => !prev.has(c));
        if (nuevos.length) newPerGame.push({ game: g, codes: nuevos });
        nextLast[g] = nowSet;
      }

      setAllData(nextAll);
      setLastActiveByGame(nextLast);

      // actualizar tabla si tenemos el seleccionado en la tanda
      if (nextAll[game]) setData(nextAll[game]!);

      // toast de “refrescado”
      if (showToast) toast.info(`Códigos actualizados`, { icon: <span>🔄</span> });

      // notificación del sistema si hay nuevos (cualquier juego)
      if (newPerGame.length && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const body = newPerGame
          .map(({ game: g, codes }) => `${g}: ${codes.slice(0, 4).join(", ")}${codes.length > 4 ? "…" : ""}`)
          .join("\n");
        new Notification("Nuevos códigos activos", { body });
      }

      // highlight si los nuevos son del juego visible
      const currentGameNew = newPerGame.find((x) => x.game === game);
      if (currentGameNew?.codes.length) {
        setFlash(new Set(currentGameNew.codes));
        setTimeout(() => setFlash(new Set()), 5000);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error al refrescar");
      toast.error("Error al refrescar");
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial: todos + set visible
  useEffect(() => {
    setLoading(true);
    refreshAll(false);
    // permiso notificaciones del sistema
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // cuando cambia el juego seleccionado, muestra desde cache si hay
  useEffect(() => {
    const cached = allData[game];
    if (cached) setData(cached);
    else {
      // si aún no está cacheado, pide solo ese juego
      (async () => {
        setLoading(true);
        try {
          const raw = await window.api.codes.list(game);
          const payload = toPayload(raw);
          setAllData((prev) => ({ ...prev, [game]: payload }));
          setData(payload);
          setLastActiveByGame((prev) => ({ ...prev, [game]: new Set(payload.active.map((c) => c.code)) }));
        } catch (e: any) {
          setError(e?.message ?? "Error");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [game]);

  // Polling global cada 60s
  useEffect(() => {
    const id = setInterval(() => refreshAll(true), 60_000);
    return () => clearInterval(id);
  }, [game, allData, lastActiveByGame]);

  // filtro por búsqueda
  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    const filt = (arr: CodeItem[]) =>
      q
        ? arr.filter(
            (c) =>
              norm(c.code).includes(norm(q)) ||
              c.rewards?.some((r) => norm(r).includes(norm(q)))
          )
        : arr;
    return { active: filt(data.active), inactive: filt(data.inactive) };
  }, [data, q]);

  const current = tab === "active" ? filtered.active : filtered.inactive;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Toasts internos (solo refresco) */}
      <ToastContainer position="top-right" theme="dark" pauseOnFocusLoss={false} />

      {/* Header */}
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
            value={game}
            onChange={(e) => setGame(e.target.value as Game)}
          >
            {GAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Controles */}
      <div className="px-6 mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <nav className="inline-flex rounded-xl border border-gray-700 bg-gray-900 p-1 shadow-sm">
            {([
              { key: "active", label: `Activos (${filtered.active.length})` },
              { key: "inactive", label: `Inactivos (${filtered.inactive.length})` },
            ] as { key: TabKey; label: string }[]).map((t) => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition ${
                    isActive ? "bg-sky-600 text-white shadow-sm" : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-sky-600"
                checked={translate}
                onChange={(e) => setTranslate(e.target.checked)}
              />
              Traducir recompensas (todos los juegos)
            </label>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar código o recompensa…"
              className="w-72 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm
                         outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-800 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="px-6 mt-5">
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60">
              <tr className="text-gray-300 uppercase text-xs">
                <th className="text-left py-2.5 px-3">Código</th>
                <th className="text-left py-2.5 px-3">Recompensas</th>
                <th className="text-right py-2.5 px-3">{tab === "active" ? "Acciones" : "Estado"}</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t [&>tr]:border-gray-800">
              {loading && (
                <tr>
                  <td colSpan={3} className="py-6 px-3 text-center text-gray-400">
                    Cargando códigos…
                  </td>
                </tr>
              )}

              {!loading &&
                current.map((c) => (
                  <tr
                    key={c.code}
                    className={`hover:bg-gray-800/60 transition ${
                      flash.has(c.code) && tab === "active" ? "animate-pulse bg-sky-900/30 ring-1 ring-sky-700/40" : ""
                    }`}
                  >
                    <td className="py-3 px-3 align-top">
                      <span className="font-mono text-base text-gray-100">{c.code}</span>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <ul className="text-xs text-gray-300 leading-5 list-disc pl-5">
                        {(translate ? c.rewards.map((r) => translateReward(r, game)) : c.rewards).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 px-3 align-top text-right">
                      {tab === "active" ? (
                        <CopyButton text={c.code} />
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800/80
                                         px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-300">
                          Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

              {!loading && current.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 px-3 text-center text-gray-400">
                    {tab === "active" ? "No hay códigos activos." : "No hay códigos inactivos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">Error al cargar: {error}</p>}

        {!error && (
          <p className="mt-3 text-xs text-gray-400">
            {tab === "active" ? "Consejo: copia un código con el botón “Copiar”." : "Los inactivos se muestran solo de referencia."}
          </p>
        )}
      </div>
    </div>
  );
}
