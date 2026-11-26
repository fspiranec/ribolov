/**
 * Imports protected areas, park management zones and Natura 2000 from the
 * Bioportal WFS (https://services.bioportal.hr/wfs).
 *
 *   npm run import:bioportal -- --list   # print available feature types
 *   npm run import:bioportal             # import layers configured in bioportal.config.json
 *
 * Only features whose centroid lies in the Croatian sea polygon are kept, and
 * each feature is classified by a regex on its name (see the config file).
 */
import fs from "node:fs";
import path from "node:path";
import type { Feature, FeatureCollection } from "geojson";
import { countBy, hrSea, inHrSea, writeCollection } from "./common";

type Rule = { match: string; layer: string; rule_key: string; priority: number };
type LayerCfg = { typeName: string; nameField: string; matchFields?: string[]; needs_legal_check?: boolean; classify: Rule[] };
const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts/import/bioportal.config.json"), "utf8")) as {
  wfs: string;
  layers: LayerCfg[];
};

async function list() {
  const url = `${cfg.wfs}?service=WFS&request=GetCapabilities`;
  const xml = await (await fetch(url)).text();
  const names = [...xml.matchAll(/<Name>([^<]+)<\/Name>\s*<Title>([^<]*)<\/Title>/g)];
  console.log(`${names.length} feature types at ${cfg.wfs}:`);
  for (const m of names) console.log(`  ${m[1]}${m[2] ? `  –  ${m[2]}` : ""}`);
  console.log("\nUpiši odgovarajuće typeName vrijednosti u scripts/import/bioportal.config.json.");
}

async function fetchLayer(l: LayerCfg): Promise<FeatureCollection> {
  const q = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: l.typeName,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
  });
  const r = await fetch(`${cfg.wfs}?${q}`);
  if (!r.ok) throw new Error(`WFS ${l.typeName}: HTTP ${r.status}`);
  return (await r.json()) as FeatureCollection;
}

async function main() {
  if (process.argv.includes("--list")) return list();
  const sea = hrSea();
  const all: Feature[] = [];
  for (const l of cfg.layers) {
    if (l.typeName.startsWith("TODO")) {
      console.warn(`! ${l.typeName}: not configured, skipped (run with --list)`);
      continue;
    }
    console.log(`Fetching ${l.typeName} ...`);
    const fc = await fetchLayer(l);
    let kept = 0;
    for (const f of fc.features) {
      if (!f.geometry || !inHrSea(f, sea)) continue;
      const name = String(f.properties?.[l.nameField] ?? "");
      const rule = l.classify.find((c) => (l.matchFields ?? [l.nameField]).some((k) => new RegExp(c.match, "i").test(String(f.properties?.[k] ?? ""))));
      if (!rule) continue;
      kept++;
      all.push({
        type: "Feature",
        geometry: f.geometry,
        properties: {
          layer: rule.layer,
          rule_key: rule.rule_key,
          priority: rule.priority,
          name,
          source: `Bioportal WFS ${l.typeName}`,
          placeholder: false,
          needs_legal_check: Boolean(l.needs_legal_check),
        },
      });
    }
    console.log(`  ${fc.features.length} fetched, ${kept} kept`);
  }
  console.log("Po sloju:", countBy(all, (f) => String(f.properties?.layer)));
  writeCollection("bioportal.geojson", all, "Bioportal (MINGOR / ZZOP)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
