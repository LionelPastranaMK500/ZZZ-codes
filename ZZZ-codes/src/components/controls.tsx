// src/components/Controls.tsx
export type TabKey = "active" | "inactive";

type ControlsProps = {
    activeTab: TabKey;
    onTabChange: (tab: TabKey) => void;
    activeCount: number;
    inactiveCount: number;
    searchValue: string;
    onSearchChange: (value: string) => void;
    translateValue: boolean;
    onTranslateChange: (value: boolean) => void;
};

export function Controls({
    activeTab,
    onTabChange,
    activeCount,
    inactiveCount,
    searchValue,
    onSearchChange,
    translateValue,
    onTranslateChange,
}: ControlsProps) {
    const tabs = [
        { key: "active", label: `Activos (${activeCount})` },
        { key: "inactive", label: `Inactivos (${inactiveCount})` },
    ] as const;

    return (
        <div className="px-6 mt-2">
            <div className="flex flex-wrap items-center gap-3">
                {/* Navegación de Pestañas */}
                <nav className="inline-flex rounded-xl border border-gray-700 bg-gray-900 p-1 shadow-sm">
                    {tabs.map((t) => {
                        const isActive = activeTab === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => onTabChange(t.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition ${isActive ? "bg-sky-600 text-white shadow-sm" : "text-gray-300 hover:bg-gray-800"
                                    }`}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Controles a la derecha */}
                <div className="ml-auto flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-sky-600"
                            checked={translateValue}
                            onChange={(e) => onTranslateChange(e.target.checked)}
                        />
                        Traducir recompensas
                    </label>

                    <input
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar código o recompensa…"
                        className="w-72 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm
                        CodeTableoutline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-800 shadow-sm"
                    />
                </div>
            </div>
        </div>
    );
}