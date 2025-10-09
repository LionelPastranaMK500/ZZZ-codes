// src/App.tsx
import { useState, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import type { Game } from "./types";
import { useCodes } from "./hooks/useCodes";
import { Header } from "./components/Header";
import { Controls, TabKey } from "./components/controls";
import { CodeTable } from "./components/CodeTable";

export default function App() {
  // --- Estados de UI ---
  const [game, setGame] = useState<Game>("zenless");
  const [tab, setTab] = useState<TabKey>("active");
  const [q, setQ] = useState("");
  const [translate, setTranslate] = useState(false);

  // --- Lógica y Datos (desde el custom hook) ---
  const { data, loading, error, flash } = useCodes(game);

  // --- Lógica de Filtrado ---
  const filteredData = useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    const query = norm(q);

    const filterArray = (arr: typeof data.active) =>
      query
        ? arr.filter(
            (c) =>
              norm(c.code).includes(query) ||
              c.rewards?.some((r) => norm(r).includes(query))
          )
        : arr;

    return {
      active: filterArray(data.active),
      inactive: filterArray(data.inactive),
    };
  }, [data, q]);

  // --- Renderizado ---
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <ToastContainer position="top-right" theme="dark" pauseOnFocusLoss={false} />

      <Header selectedGame={game} onGameChange={setGame} />

      <Controls
        activeTab={tab}
        onTabChange={setTab}
        activeCount={filteredData.active.length}
        inactiveCount={filteredData.inactive.length}
        searchValue={q}
        onSearchChange={setQ}
        translateValue={translate}
        onTranslateChange={setTranslate}
      />

      <CodeTable
        codes={tab === "active" ? filteredData.active : filteredData.inactive}
        game={game}
        tab={tab}
        loading={loading}
        translate={translate}
        flashSet={flash}
        error={error}
      />
    </div>
  );
}