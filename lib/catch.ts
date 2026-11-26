import type { RuleSet, Text } from "./rules/types";
import { toIso } from "./rules/dates";
import { speciesGuide, type SpeciesTip } from "./species";

/** One fish (or cephalopod) the angler has caught today. */
export interface CatchItem {
  key: string; // species key from data/species/species.yaml
  duljina_cm?: number | null;
  masa_kg?: number | null;
}

export type CatchStatus = "zadrzi" | "pusti" | "izmjeri";

export interface CatchVerdict {
  key: string;
  naziv: Text;
  status: CatchStatus;
  razlog: Text;
  napomene: Text[];
  min: string | null;
  masa_kg: number | null;
}

export interface CatchResult {
  stavke: CatchVerdict[];
  zadrzano_kg: number;
  limit_kg: number;
  preostalo_kg: number;
  /** Kept fish without a weight – the total may be higher than shown. */
  bez_mase: number;
  limit_dosegnut: boolean;
  mrecfish: Text | null;
  mrecfish_linkovi: { info_url: string; ios_url: string };
}

const T = (hr: string, en: string): Text => ({ hr, en });
const CEPHALOPODS = new Set(["hobotnica", "lignja"]);

/** "20 cm" -> {v:20,u:"cm"}, "1 kg" -> {v:1,u:"kg"}, "promjer čahure 50 mm" -> {v:50,u:"mm"}. */
export function parseMin(min: string | null): { v: number; u: "cm" | "kg" | "mm" } | null {
  const m = min ? /(\d+(?:[.,]\d+)?)\s*(cm|kg|mm)/.exec(min) : null;
  return m ? { v: Number(m[1].replace(",", ".")), u: m[2] as "cm" | "kg" | "mm" } : null;
}

/**
 * Checks today's catch against closed seasons, minimum sizes, per-species piece limits
 * and the 5 kg daily limit (+ one fish that takes you over it). Items are checked in
 * the order they were caught.
 */
export function checkCatch(rules: RuleSet, isoDate: string, items: CatchItem[]): CatchResult {
  const guide = new Map<string, SpeciesTip>(speciesGuide(rules, isoDate).vrste.map((s) => [s.key, s]));
  const lim = rules.general.dnevni_limit;
  const marking = new Set(rules.general.oznacavanje.vrste_djelomicno.map((n) => n.toLowerCase()));
  const pieces: Record<string, number> = {};
  let kept = 0;
  let overUsed = false;
  let noMass = 0;
  let lampuga = false;

  const stavke = items.map((it): CatchVerdict => {
    const s = guide.get(it.key);
    const naziv = s?.naziv ?? T(it.key, it.key);
    const min = s?.min_velicina ?? null;
    const masa = it.masa_kg != null && it.masa_kg > 0 ? it.masa_kg : null;
    const out: CatchVerdict = { key: it.key, naziv, status: "zadrzi", razlog: T("", ""), napomene: [], min, masa_kg: masa };
    const pusti = (r: Text) => ({ ...out, status: "pusti" as const, razlog: r });

    if (!s) return pusti(T("Nepoznata vrsta – ako nisi siguran, vrati je u more.", "Unknown species – if unsure, release it."));
    if (s.lovostaj_danas) return pusti(T("Danas je u lovostaju – vrati je u more.", "Closed season today – release it."));

    const pm = parseMin(min);
    if (pm) {
      if (pm.u === "kg") {
        if (masa == null) return { ...out, status: "izmjeri", razlog: T(`Izvaži je: najmanje ${min}.`, `Weigh it: minimum ${min}.`) };
        if (masa < pm.v) return pusti(T(`Premala (${masa} kg < ${min}) – vrati je u more.`, `Too small (${masa} kg < ${min}) – release it.`));
      } else {
        const len = it.duljina_cm;
        if (len == null || len <= 0) return { ...out, status: "izmjeri", razlog: T(`Izmjeri je: najmanje ${min}.`, `Measure it: minimum ${min}.`) };
        const lenInUnit = pm.u === "mm" ? len * 10 : len;
        if (lenInUnit < pm.v) return pusti(T(`Premala (${len} cm < ${min}) – vrati je u more.`, `Too small (${len} cm < ${min}) – release it.`));
      }
    }

    const maxPieces = lim.komada[it.key];
    if (maxPieces != null) {
      pieces[it.key] = (pieces[it.key] ?? 0) + 1;
      if (pieces[it.key] > maxPieces)
        return pusti(T(`Dnevno smiješ zadržati najviše ${maxPieces} kom.`, `You may keep at most ${maxPieces} per day.`));
    }

    if (masa != null) {
      if (kept >= lim.ukupno_kg || (kept + masa > lim.ukupno_kg && overUsed))
        return pusti(T(`Dosegnut je dnevni limit od ${lim.ukupno_kg} kg.`, `The daily limit of ${lim.ukupno_kg} kg is reached.`));
      if (kept + masa > lim.ukupno_kg) {
        overUsed = true;
        out.napomene.push(T("Ova riba prelazi 5 kg – smiješ je zadržati, ali nakon nje više ništa.", "This fish takes you over 5 kg – you may keep it, but nothing after it."));
      }
      kept += masa;
    } else noMass++;

    out.razlog = min ? T(`Smiješ je zadržati (najmanje ${min}).`, `You may keep it (minimum ${min}).`) : T("Smiješ je zadržati.", "You may keep it.");
    if (CEPHALOPODS.has(it.key)) out.napomene.push(T("Označi ulov: zareži između očiju.", "Mark it: make a cut between the eyes."));
    else if ([s.naziv.hr.toLowerCase(), s.key].some((n) => [...marking].some((m) => n.startsWith(m))))
      out.napomene.push(T("Označi ulov: odreži donji dio repne peraje.", "Mark it: cut off the lower part of the tail fin."));
    if (it.key === "lampuga") lampuga = true;
    return out;
  });

  const kgRounded = Math.round(kept * 100) / 100;
  const phases = rules.general.evidencija.faze.map((f) => toIso(f.od) ?? "");
  const mrecfish = lampuga && isoDate >= phases[0]
    ? T("Lampugu moraš prijaviti u aplikaciji mRecFish u roku 24 sata.", "You must report dolphinfish in the mRecFish app within 24 hours.")
    : isoDate >= (phases[1] ?? "9999")
      ? T("Prijavi ulov u aplikaciji mRecFish u roku 24 sata od završetka ribolova.", "Report your catch in the mRecFish app within 24 hours of finishing.")
      : null;

  return {
    stavke,
    zadrzano_kg: kgRounded,
    limit_kg: lim.ukupno_kg,
    preostalo_kg: Math.max(0, Math.round((lim.ukupno_kg - kept) * 100) / 100),
    bez_mase: noMass,
    limit_dosegnut: kept >= lim.ukupno_kg,
    mrecfish,
    mrecfish_linkovi: { info_url: rules.permits.mrecfish.info_url, ios_url: rules.permits.mrecfish.ios_url },
  };
}
