import fs from "node:fs";
import path from "node:path";

export interface Place {
  naziv: string; // nearest settlement, e.g. "Komiža"
  udaljenost_km: number; // distance from the spot to the settlement centre
}

type P = { naziv: string; lat: number; lon: number; stanovnika: number };
let places: P[] | null = null;

function load(): P[] {
  if (places) return places;
  const f = path.join(process.cwd(), "data/places.json");
  places = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")).mjesta as P[]) : [];
  return places;
}

function km(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Nearest settlement from GeoNames (data/places.json, `npm run import:places`).
 * Larger places win when they are almost as close: a tourist knows "Komiža",
 * not the hamlet 300 m closer.
 */
export async function getPlace(lat: number, lon: number): Promise<Place | null> {
  let best: { p: P; d: number; score: number } | null = null;
  for (const p of load()) {
    if (Math.abs(p.lat - lat) > 0.3 || Math.abs(p.lon - lon) > 0.4) continue;
    const d = km(lat, lon, p.lat, p.lon);
    const score = d / (1 + Math.log10(1 + p.stanovnika) * 0.35);
    if (!best || score < best.score) best = { p, d, score };
  }
  return best ? { naziv: best.p.naziv, udaljenost_km: Math.round(best.d * 10) / 10 } : null;
}
