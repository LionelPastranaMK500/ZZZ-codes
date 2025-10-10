// src/components/CodeTable.tsx
import type { CodeItem, GameId } from "../../electron/common/types";
import { translateReward } from "../lib/game-dictionaries";
import { CopyButton } from "./CopyButton";

type TabKey = "active" | "inactive";

type CodeTableProps = {
    codes: CodeItem[];
    game: GameId;
    tab: TabKey;
    loading: boolean;
    translate: boolean;
    flashSet: Set<string>;
    error: string | null;
};

export function CodeTable({ codes, game, tab, loading, translate, flashSet, error }: CodeTableProps) {
    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan={3} className="py-6 px-3 text-center text-gray-400">
                        Cargando códigos…
                    </td>
                </tr>
            );
        }

        if (codes.length === 0) {
            return (
                <tr>
                    <td colSpan={3} className="py-6 px-3 text-center text-gray-400">
                        {tab === "active" ? "No hay códigos activos." : "No hay códigos inactivos."}
                    </td>
                </tr>
            );
        }

        return codes.map((c) => (
            <tr
                key={c.code}
                className={`hover:bg-gray-800/60 transition ${flashSet.has(c.code) && tab === "active" ? "animate-pulse bg-sky-900/30 ring-1 ring-sky-700/40" : ""
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
                        <span
                            className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800/80
                            px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-300"
                        >
                            Inactivo
                        </span>
                    )}
                </td>
            </tr>
        ));
    };

    return (
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
                        {renderTableBody()}
                    </tbody>
                </table>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">Error al cargar: {error}</p>}

            {!error && (
                <p className="mt-3 text-xs text-gray-400">
                    {tab === "active"
                        ? "Consejo: copia un código con el botón “Copiar”."
                        : "Los inactivos se muestran solo de referencia."}
                </p>
            )}
        </div>
    );
}