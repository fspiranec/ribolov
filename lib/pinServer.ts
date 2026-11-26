import fs from "node:fs";
import path from "node:path";
import { evaluatePin, type PermitSeller, type PinParams, type PinResult, type Shop } from "./pin";
import { loadRules } from "./rules/load";
import { getZoneProvider } from "./zones";
import { getDepth } from "./env/depth";
import { getDaySeries, getWeather } from "./env/weather";
import { getPlace } from "./env/place";
import { islandAt } from "./islands";

/** Server-only: evaluatePin with the real data sources. Used by /api/pin and the server-rendered page. */

let sellers: PermitSeller[] | null = null;
/** Official licence sellers, from `npm run import:sellers` (empty if not imported). */
function loadSellers(): PermitSeller[] {
  if (sellers) return sellers;
  const f = path.join(process.cwd(), "data/permit_sellers.json");
  sellers = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")).prodavaci as PermitSeller[]) : [];
  return sellers;
}

let shops: Shop[] | null = null;
/** OSM tackle shops (npm run import:shops) + partner shops (data/partners.json). */
function loadShops(): Shop[] {
  if (shops) return shops;
  const read = (n: string) => {
    const f = path.join(process.cwd(), "data", n);
    return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")).trgovine as Shop[]) : [];
  };
  shops = [...read("partners.json").map((s) => ({ ...s, partner: true })), ...read("shops.json")];
  return shops;
}

let sources: { izvor: string; datum: string }[] | null = null;
/** Area data sources and import dates (data/imported/_meta.json, written by the import scripts). */
function loadSources() {
  if (sources) return sources;
  const f = path.join(process.cwd(), "data/imported/_meta.json");
  const meta: Record<string, { izvor: string; datum: string }> = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  const by = new Map<string, string>();
  for (const m of Object.values(meta)) if (!by.has(m.izvor) || by.get(m.izvor)! < m.datum) by.set(m.izvor, m.datum);
  sources = [...by].map(([izvor, datum]) => ({ izvor, datum }));
  return sources;
}

const islandCache = new Map<string, string | null>();
/** islandAt with a cache: shops and sellers do not move. */
function cachedIsland(lat: number, lon: number): string | null {
  const k = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (!islandCache.has(k)) islandCache.set(k, islandAt(lat, lon));
  return islandCache.get(k)!;
}

export function runPin(params: PinParams): Promise<PinResult> {
  return evaluatePin(params, {
    rules: loadRules(),
    zones: getZoneProvider(),
    getDepth,
    getWeather,
    getDaySeries,
    sellers: loadSellers(),
    shops: loadShops(),
    getPlace,
    getIsland: cachedIsland,
    dataSources: loadSources(),
  });
}
