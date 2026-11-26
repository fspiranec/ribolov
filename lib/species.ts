import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { inAnyPeriod, validOn } from "./rules/dates";
import type { RuleSet, Text } from "./rules/types";
import { specialSpecies } from "./special";

export interface SpeciesTip {
  key: string;
  naziv: Text;
  latinski: string;
  lokalni_nazivi: string[];
  udica: string;
  mamci: Text;
  tehnika: Text;
  kada: Text;
  gdje: Text;
  prepoznavanje: Text | null;
  mjeseci: number[];
  doba: ("zora" | "dan" | "sumrak" | "noc")[];
  /** Month of the date is in the best season. */
  sezona_sada: boolean;
  /** 0..3: in season (+2), right time of day for the given hour (+1); 0 if closed season. */
  ocjena_sada: number;
  slika: string | null;
  opis: Text | null;
  wiki_url: { hr: string | null; en: string | null } | null;
  min_velicina: string | null;
  lovostaj_danas: boolean;
}

type Raw = Omit<SpeciesTip, "slika" | "opis" | "wiki_url" | "min_velicina" | "lovostaj_danas" | "sezona_sada" | "ocjena_sada"> & {
  min_kljuc: string | null;
  /** Optional hand-picked image URL (overrides Wikipedia). */
  slika?: string;
};

/** Rough local-time windows for each part of the day. */
const DOBA: Record<string, (h: number) => boolean> = {
  zora: (h) => h >= 5 && h < 9,
  dan: (h) => h >= 9 && h < 17,
  sumrak: (h) => h >= 17 && h < 21,
  noc: (h) => h >= 21 || h < 5,
};
type Wiki = Record<string, { slika: string | null; opis: { hr: string | null; en: string | null }; url: { hr: string | null; en: string | null } }>;

type Names = Record<string, Record<string, string | null>>;
let cache: { napomena: Text; vrste: Raw[]; wiki: Wiki; izvor: string; names: Names } | null = null;

const OTHER_LANGS = ["de", "it", "pl", "cs", "sl"] as const;

/** Species name in all languages: Wikipedia (names.json) + manual fixes; else the Croatian name. */
function withNames(n: Text, key: string, names: Names): Text {
  const out: Text = { ...n };
  for (const l of OTHER_LANGS) out[l] = names[key]?.[l] ?? n.hr;
  return out;
}

function load(dir = path.join(process.cwd(), "data/species")) {
  if (cache) return cache;
  const y = yaml.load(fs.readFileSync(path.join(dir, "species.yaml"), "utf8")) as { napomena: Text; vrste: Raw[] };
  const wf = path.join(dir, "wiki.json");
  const w = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, "utf8")) : { vrste: {}, izvor: "" };
  const read = (n: string) => (fs.existsSync(path.join(dir, n)) ? JSON.parse(fs.readFileSync(path.join(dir, n), "utf8")) : {});
  const auto: Names = read("names.json");
  const manual: Names = read("names_manual.json");
  const names: Names = {};
  for (const k of new Set([...Object.keys(auto), ...Object.keys(manual)])) {
    if (k.startsWith("_")) continue;
    names[k] = { ...auto[k], ...manual[k] };
    for (const [l, v] of Object.entries(names[k])) if (v == null) delete names[k][l];
  }
  cache = { napomena: y.napomena, vrste: y.vrste, wiki: w.vrste, izvor: w.izvor, names };
  return cache;
}

/** Species guide with tips, photo, and today's legal status (min size, closed season). */
export function speciesGuide(rules: RuleSet, isoDate: string, hour: number | null = null, dir?: string) {
  const month = Number(isoDate.slice(5, 7));
  const s = load(dir);
  const vrste: SpeciesTip[] = s.vrste.map((v) => {
    const w = s.wiki[v.key];
    const min = v.min_kljuc
      ? rules.minSizes.velicine.find((m) => m.vrsta.hr.split(/,\s*/).some((n) => n.startsWith(v.min_kljuc!)))
      : undefined;
    const closed = rules.closedSeasons.lovostaji.find((c) => c.key === v.key);
    const lovostaj = !!closed && validOn(isoDate, closed) && inAnyPeriod(isoDate, closed.razdoblja);
    const sezona = (v.mjeseci ?? []).includes(month);
    const doba = hour != null && (v.doba ?? []).some((d) => DOBA[d]?.(hour));
    const opis = w ? { hr: w.opis.hr ?? w.opis.en ?? "", en: w.opis.en ?? w.opis.hr ?? "" } : null;
    return {
      key: v.key,
      naziv: withNames(v.naziv, v.key, s.names),
      latinski: v.latinski,
      lokalni_nazivi: v.lokalni_nazivi ?? [],
      udica: v.udica,
      mamci: v.mamci,
      tehnika: v.tehnika,
      kada: v.kada,
      gdje: v.gdje,
      prepoznavanje: v.prepoznavanje ?? null,
      mjeseci: v.mjeseci ?? [],
      doba: v.doba ?? [],
      sezona_sada: sezona,
      ocjena_sada: lovostaj ? 0 : (sezona ? 2 : 0) + (doba ? 1 : 0),
      slika: v.slika ?? w?.slika ?? null,
      opis: opis && (opis.hr || opis.en) ? opis : null,
      wiki_url: w?.url ?? null,
      min_velicina: min?.min ?? null,
      lovostaj_danas: lovostaj,
    };
  });
  return { napomena: s.napomena, izvor_slika: s.izvor, vrste, posebne: specialSpecies(dir) };
}
