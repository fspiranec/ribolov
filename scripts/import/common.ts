import fs from "node:fs";
import path from "node:path";
import { booleanPointInPolygon, centroid } from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";

export const ROOT = process.cwd();
export const IMPORTED = path.join(ROOT, "data/imported");

/** Writes a layer and records its source and import date in data/imported/_meta.json (shown in the app). */
export function writeCollection(file: string, features: Feature[], izvor: string): void {
  fs.mkdirSync(IMPORTED, { recursive: true });
  const out = path.join(IMPORTED, file);
  fs.writeFileSync(out, JSON.stringify({ type: "FeatureCollection", features } satisfies FeatureCollection));
  const metaFile = path.join(IMPORTED, "_meta.json");
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
  meta[file] = { izvor, datum: new Date().toISOString().slice(0, 10), broj: features.length };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
  console.log(`  -> ${path.relative(ROOT, out)} (${features.length} features)`);
}

/** Approximate Croatian sea polygon from data/manual/placeholders.geojson. */
export function hrSea(): Feature<Polygon> {
  const fc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/manual/placeholders.geojson"), "utf8")) as FeatureCollection;
  const f = fc.features.find((x) => x.properties?.layer === "hr_more");
  if (!f) throw new Error("hr_more missing; run: npx tsx scripts/make_placeholders.ts");
  return f as Feature<Polygon>;
}

export function inHrSea(f: Feature<Geometry>, sea = hrSea()): boolean {
  return booleanPointInPolygon(centroid(f), sea);
}

export function countBy<T>(xs: T[], key: (x: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of xs) out[key(x)] = (out[key(x)] ?? 0) + 1;
  return out;
}
