import fs from "node:fs";
import path from "node:path";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

type Island = { f: Feature<Polygon | MultiPolygon, { naziv: string }>; bbox: number[] };
let cache: Island[] | null = null;

export function loadIslands(file = path.join(process.cwd(), "data/imported/osm_otoci.geojson")): Island[] {
  if (cache) return cache;
  if (!fs.existsSync(file)) return (cache = []);
  const fc = JSON.parse(fs.readFileSync(file, "utf8")) as FeatureCollection<Polygon | MultiPolygon, { naziv: string }>;
  cache = fc.features.map((f) => ({ f, bbox: turf.bbox(f) }));
  return cache;
}

/** Croatian islands as polygons, for tests (no file). */
export function islandsFrom(fc: FeatureCollection<Polygon | MultiPolygon, { naziv: string }>): Island[] {
  return fc.features.map((f) => ({ f, bbox: turf.bbox(f) }));
}

/**
 * Which island the spot is on (or right next to, when it is in the sea up to `nearKm` off its shore);
 * null = mainland or open sea. Used so that a shop across the sea is not the "nearest" one.
 */
export function islandAt(lat: number, lon: number, islands: Island[] = loadIslands(), nearKm = 0.5): string | null {
  const pt = turf.point([lon, lat]);
  const pad = nearKm / 80; // degrees, generous
  let near: { n: string; d: number } | null = null;
  for (const { f, bbox } of islands) {
    if (lon < bbox[0] - pad || lon > bbox[2] + pad || lat < bbox[1] - pad || lat > bbox[3] + pad) continue;
    if (turf.booleanPointInPolygon(pt, f)) return f.properties.naziv || "otok";
    const line = turf.polygonToLine(f);
    const lines = line.type === "FeatureCollection" ? line.features : [line];
    for (const l of lines) {
      const d = turf.pointToLineDistance(pt, l as Feature<GeoJSON.LineString | GeoJSON.MultiLineString> as never, { units: "kilometers" });
      if (d <= nearKm && (!near || d < near.d)) near = { n: f.properties.naziv || "otok", d };
    }
  }
  return near?.n ?? null;
}
