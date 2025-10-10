// src/App.tsx
import { useState, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import type { GameId } from "../electron/common/types";
import { useCodes } from "./hooks/useCodes";
import { Header } from "./components/Header";
import { Controls, TabKey } from "./components/controls";
import { CodeTable } from "./components/CodeTable";
import { NotificationManager } from "./components/NotificationManager"; // <-- IMPORT

export default function App() {
  // --- UI State ---
  const [game, setGame] = useState<GameId>("zenless");
  const [tab, setTab] = useState<TabKey>("active");
  const [q, setQ] = useState("");
  const [translate, setTranslate] = useState(false);

  // --- Data Logic (from our refactored hook) ---
  const { data, loading, error, flash } = useCodes(game);

  // --- Filtering Logic (no changes needed) ---
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

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <ToastContainer position="top-right" theme="dark" pauseOnFocusLoss={false} />
      <NotificationManager /> {/* <-- ADD NOTIFICATION MANAGER */}

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
