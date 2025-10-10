// src/lib/game-dictionaries.ts
import type { GameId } from "../../electron/common/types";

const DICTS: Record<GameId, Record<string, string>> = {
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
        Polychrome: "Película",
        Polychromes: "Películas",
        "Official Investigator Log": "Registro de Investigador Oficial",
        "Senior Investigator Log": "Registro de Investigador Senior",
        "W-Engine Power Supply": "Suministro de energía de W-Engine",
        "W-Engine Energy Module": "Módulo de energía de W-Engine",
        "Crystallized Plating Agent": "Agente de recubrimiento cristalizado",
        "Bangboo Algorithm Module": "Módulo de algoritmo Bangboo",
        "Bangboo System Widget": "Widget del sistema Bangboo",
        "Ether Plating Agent": "Agente de recubrimiento de Éter",
        "Ether Battery": "Batería de Éter",
        Denny: "Denique",
        Dennies: "Deniques",
    },
};

export function translateReward(line: string, game: GameId): string {
    let out = line.replace(/×/g, "x");
    const dict = DICTS[game] ?? {};
    for (const [en, es] of Object.entries(dict)) out = out.replaceAll(en, es);
    return out.replace(/,\s*,/g, ", ");
}