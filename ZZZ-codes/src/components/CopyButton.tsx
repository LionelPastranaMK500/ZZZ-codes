// src/components/CopyButton.tsx
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
    const [ok, setOk] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 900);
    };

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-md border border-sky-400/30 bg-sky-400/10
                    px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-400/20 active:scale-[.98]
                    transition shadow-sm"
            title="Copiar código"
        >
            {ok ? "¡Copiado!" : "Copiar"}
        </button>
    );
}