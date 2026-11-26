import fs from "node:fs";
import path from "node:path";
import { booleanPointInPolygon, centroid } from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";

export const ROOT = process.cwd();
export const IMPORTED = path.join(ROOT, "data/imported");

export function writeCollection(file: string, features: Feature[]): void {
  fs.mkdirSync(IMPORTED, { recursive: true });
  const out = path.join(IMPORTED, file);
  fs.writeFileSync(out, JSON.stringify({ type: "FeatureCollection", features } satisfies FeatureCollection));
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
