import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Text } from "./rules/types";

/** A simple recipe for a fish tourists catch from the shore (data/recipes.yaml). Suggestions, not rules. */
export interface Recipe {
  key: string;
  /** Species key (fish guide or special species) for "How to prepare it", or null. */
  riba: string | null;
  naziv: Text;
  vrijeme_min: number;
  /** How to clean this particular fish (shown in the recipe, before the ingredients). */
  ciscenje: Text[];
  sastojci: Text[];
  koraci: Text[];
  prica: Text;
  /** "dobro_za_more": e.g. an invasive species – eating it helps the sea. */
  istaknuto: "dobro_za_more" | null;
  /** Optional credit, e.g. a local tavern, and a link. */
  autor: string | null;
  link: string | null;
}

export interface Recipes {
  /** Optional general cleaning guide (when there are recipes for several fish). */
  ciscenje: { naslov: Text; koraci: Text[] } | null;
  recepti: Recipe[];
}

let cache: Recipes | null = null;

export function loadRecipes(file = path.join(process.cwd(), "data/recipes.yaml")): Recipes {
  if (cache) return cache;
  if (!fs.existsSync(file)) return (cache = { ciscenje: null, recepti: [] });
  const y = yaml.load(fs.readFileSync(file, "utf8")) as Recipes & { recepti: (Partial<Recipe> & Recipe)[] };
  cache = {
    ciscenje: y.ciscenje ?? null,
    recepti: y.recepti.map((r) => ({
      key: r.key,
      riba: r.riba ?? null,
      naziv: r.naziv,
      vrijeme_min: r.vrijeme_min,
      ciscenje: r.ciscenje ?? [],
      sastojci: r.sastojci ?? [],
      koraci: r.koraci ?? [],
      prica: r.prica,
      istaknuto: r.istaknuto ?? null,
      autor: r.autor ?? null,
      link: r.link ?? null,
    })),
  };
  return cache;
}
