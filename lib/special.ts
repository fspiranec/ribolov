import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Level, Text } from "./rules/types";

/** Protected, invasive and dangerous species (data/species/special.yaml). Education, not legal text. */
export type SpecialCategory = "zasticena" | "invazivna" | "opasna";
/** pusti = release; prijavi = non-native species: photo and report; pravila = normal rules apply (with a warning). */
export type SpecialCatch = "pusti" | "prijavi" | "pravila";

export interface SpecialSpecies {
  key: string;
  kategorija: SpecialCategory;
  ulov: SpecialCatch;
  razina: Exclude<Level, "zeleno">;
  naziv: Text;
  latinski: string;
  recenica: Text;
  sto_uciniti: Text;
  /** Optional own message for My catch (e.g. turtle: call 112). */
  razlog_ulov: Text | null;
  /** First aid for stings, when relevant. */
  prva_pomoc: Text | null;
  /** "Report a sighting" link for invasive species. */
  prijava_url: string | null;
  slika: string | null;
  needs_check: boolean;
}

type Raw = Omit<SpecialSpecies, "prva_pomoc" | "prijava_url" | "slika" | "needs_check" | "razlog_ulov"> & {
  razlog_ulov?: Text;
  prva_pomoc?: boolean;
  prijava?: boolean;
  needs_check?: boolean;
  slika?: string;
};

const ORDER: SpecialCategory[] = ["zasticena", "invazivna", "opasna"];
let cache: SpecialSpecies[] | null = null;

export function specialSpecies(dir = path.join(process.cwd(), "data/species")): SpecialSpecies[] {
  if (cache) return cache;
  const y = yaml.load(fs.readFileSync(path.join(dir, "special.yaml"), "utf8")) as { prijava_url: string; prva_pomoc: Text; vrste: Raw[] };
  const wf = path.join(dir, "special_wiki.json");
  const wiki: Record<string, { slika: string | null }> = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, "utf8")).vrste : {};
  cache = y.vrste
    .map((v) => ({
      key: v.key,
      kategorija: v.kategorija,
      ulov: v.ulov,
      razina: v.razina,
      naziv: v.naziv,
      latinski: v.latinski,
      recenica: v.recenica,
      sto_uciniti: v.sto_uciniti,
      razlog_ulov: v.razlog_ulov ?? null,
      prva_pomoc: v.prva_pomoc ? y.prva_pomoc : null,
      prijava_url: v.prijava ? y.prijava_url : null,
      slika: v.slika ?? wiki[v.key]?.slika ?? null,
      needs_check: Boolean(v.needs_check),
    }))
    .sort((a, b) => ORDER.indexOf(a.kategorija) - ORDER.indexOf(b.kategorija));
  return cache;
}

export const specialByKey = (key: string) => specialSpecies().find((s) => s.key === key) ?? null;
