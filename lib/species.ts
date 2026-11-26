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
  /** False when the species is not caught from the shore (closed_seasons.yaml s_obale: false, e.g. dolphinfish). */
  s_obale: boolean;
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

const slug = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** A row of the official minimum-size table that My catch can check (fish not in the guide). */
export interface SizeOnlySpecies {
  key: string; // "mjera:<hr names>"
  naziv: Text;
  min_velicina: string;
  lovostaj_danas: boolean;
}

/**
 * Rows of rules/min_sizes.yaml whose fish are not (all) in the guide – e.g. špar, pic, pagar, srdela.
 * Rows with a note (eel: banned, bluefin tuna: trophy only) and permanently banned species are left out.
 */
export function sizeOnlySpecies(rules: RuleSet, isoDate: string, guideMinKeys: string[]): SizeOnlySpecies[] {
  return rules.minSizes.velicine
    // fish only: no octopus (kg, in the guide), sea urchins (echinoderms are banned, prohibited.yaml) or shellfish (mm)
    .filter((m) => !m.napomena && !/kg|mm/.test(m.min) && !/kamenica|kapica|ježin/.test(m.vrsta.hr))
    .map((m) => ({ m, names: m.vrsta.hr.split(/,\s*/) }))
    .filter(({ names }) => !names.every((n) => guideMinKeys.some((k) => n.startsWith(k))))
    .map(({ m, names }) => {
      const cs = rules.closedSeasons.lovostaji.find((c) => names.some((n) => slug(n) === slug(c.key) || slug(n).startsWith(slug(c.key))));
      return { m, cs };
    })
    .filter(({ cs }) => !cs?.trajno_zabranjeno)
    .map(({ m, cs }) => ({
      key: `mjera:${m.vrsta.hr}`,
      naziv: { ...m.vrsta, hr: m.vrsta.hr.charAt(0).toUpperCase() + m.vrsta.hr.slice(1), en: m.vrsta.en.charAt(0).toUpperCase() + m.vrsta.en.slice(1) },
      min_velicina: m.min,
      lovostaj_danas: !!cs && validOn(isoDate, cs) && inAnyPeriod(isoDate, cs.razdoblja),
    }));
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
      s_obale: closed?.s_obale !== false,
    };
  });
  const minKeys = s.vrste.map((v) => v.min_kljuc).filter((k): k is string => !!k);
  return { napomena: s.napomena, izvor_slika: s.izvor, vrste, posebne: specialSpecies(dir), mjere: sizeOnlySpecies(rules, isoDate, minKeys) };
}
