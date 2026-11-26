import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import golden from "./golden_points.json";
import { fixtureZones } from "./fixtures/zones";
import { GeoJsonZoneProvider } from "@/lib/zones/geojson";
import { evaluatePin, parsePinParams } from "@/lib/pin";
import { loadRules } from "@/lib/rules/load";
import { checkCatch } from "@/lib/catch";
import { speciesGuide } from "@/lib/species";
import { c, hasTr, LOCALES, t, type Key, type Lang } from "@/lib/i18n";
import type { Text } from "@/lib/rules/types";

const LANGS: Lang[] = ["de", "it", "pl", "cs", "sl"];
const root = path.join(__dirname, "..");
const rules = loadRules(path.join(root, "rules"));

/** Every {hr, en} object anywhere inside a value. */
function texts(v: unknown, out: Text[] = []): Text[] {
  if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.hr === "string" && typeof o.en === "string") out.push(o as unknown as Text);
    Object.values(o).forEach((x) => texts(x, out));
  }
  return out;
}

async function allApiTexts(): Promise<Text[]> {
  const zones = new GeoJsonZoneProvider([fixtureZones()]);
  const out: Text[] = [];
  for (const g of golden as { lat: number; lon: number; date: string; mode?: string; permit?: string; time?: string }[]) {
    const q = new URLSearchParams({ lat: String(g.lat), lon: String(g.lon), date: g.date, mode: g.mode ?? "obala", permit: g.permit ?? "rekreacijska" });
    if (g.time) q.set("time", g.time);
    const r = await evaluatePin(parsePinParams(q).params!, {
      rules,
      zones,
      getDepth: async () => ({ elevation_m: -40, dubina_m: 40, izvor: "stub" }),
      now: () => new Date("2026-07-15T17:30:00Z"),
    });
    texts(r, out);
  }
  texts(checkCatch(rules, "2026-09-01", [{ key: "komarca", duljina_cm: 10 }, { key: "hobotnica" }, { key: "lampuga", duljina_cm: 60, masa_kg: 6 }, { key: "lampuga", duljina_cm: 60, masa_kg: 1 }]), out);
  texts(checkCatch(rules, "2026-09-01", [{ key: "periska" }, { key: "napuhaca" }, { key: "pauk" }, { key: "raza_zutulja" }]), out);
  return out;
}

describe("translations", () => {
  it("every rule and tip text is translated into every language", async () => {
    const all = [...texts(rules), ...texts(yaml.load(fs.readFileSync(path.join(root, "data/species/species.yaml"), "utf8"))),
      ...texts(yaml.load(fs.readFileSync(path.join(root, "data/species/special.yaml"), "utf8"))),
      ...texts(yaml.load(fs.readFileSync(path.join(root, "data/recipes.yaml"), "utf8"))),
      ...texts(yaml.load(fs.readFileSync(path.join(root, "data/privacy.yaml"), "utf8"))), ...(await allApiTexts())];
    const missing: string[] = [];
    for (const lang of LANGS)
      for (const x of all) if (!x[lang] && !hasTr(x.en, lang)) missing.push(`${lang}: ${x.en}`);
    expect([...new Set(missing)]).toEqual([]);
  });

  it("every UI string is translated", () => {
    const src = fs.readFileSync(path.join(root, "lib/i18n.ts"), "utf8");
    const block = (name: string) => {
      const i = src.indexOf(`const ${name} = {`);
      return src.slice(i, src.indexOf("} as const", i));
    };
    // dict has explicit 7-language rows; dict2 relies on locales/*.json
    const keys = [...block("dict2").matchAll(/^\s{2}(\w+): \[/gm)].map((m) => m[1]) as Key[];
    const missing: string[] = [];
    for (const lang of LANGS) for (const k of keys) if (t(k, lang) === t(k, "en") && !/^(GPS|Natura 2000|partner|Details|Trapula)$/.test(t(k, "en"))) {
      // identical to English is allowed only if the locale explicitly says so
      if (!hasTr(t(k, "en"), lang)) missing.push(`${lang}: ${k}`);
    }
    expect(missing).toEqual([]);
  });

  it("locales keep the same {placeholders} as the English source", () => {
    const bad: string[] = [];
    for (const lang of LANGS)
      for (const [en, tr] of Object.entries(LOCALES[lang] ?? {})) {
        const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
        if (ph(en) !== ph(tr)) bad.push(`${lang}: ${en}`);
      }
    expect(bad).toEqual([]);
  });

  it("builds sentences from templates", () => {
    expect(c({ hr: "", en: "Too small (18 cm < 20 cm) – release it." }, "de")).toBe("Zu klein (18 cm < 20 cm) – zurücksetzen.");
    expect(c({ hr: "", en: "Spiny spider crab: closed season ends – open again from 1. 12." }, "de")).toBe("Große Seespinne: Schonzeit endet – ab 1. 12. wieder erlaubt");
    expect(c({ hr: "", en: "Sunset in 30 min (16:26)." }, "de")).toBe("Sonnenuntergang in 30 Min. (16:26).");
  });
});

// keep species guide import used (names come from Wikipedia + manual file)
void speciesGuide;
