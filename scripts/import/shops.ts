/**
 * Imports shops that sell fishing tackle on the Croatian coast via Overpass, and the
 * outlines of Croatian islands (so a shop across the sea is not recommended as "nearest").
 *
 * Shops: shop=fishing; Decathlon (sports shop with a fishing section); "lov i ribolov" and
 * other shops whose name says ribolov / ribički / fishing; shops tagged fishing=yes / sport=fishing.
 * Missing town names are filled from the local GeoNames list (data/places.json).
 * Partner shops can be added to data/partners.json (same fields + "partner": true) and are listed first.
 *
 * Output: data/shops.json, data/imported/osm_otoci.geojson (+ _meta.json).
 * Data © OpenStreetMap contributors (ODbL).
 *
 *   npm run import:shops
 */
import fs from "node:fs";
import path from "node:path";
import * as turf from "@turf/turf";
import osmtogeojson from "osmtogeojson";
import type { Feature, MultiPolygon, Polygon } from "geojson";

const SERVERS = [process.env.OVERPASS_URL, "https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"].filter(Boolean) as string[];

const SHOPS = `[out:json][timeout:180];
area["ISO3166-1"="HR"][admin_level=2]->.hr;
(
  nwr["shop"="fishing"](area.hr);
  nwr["shop"]["fishing"~"yes|only"](area.hr);
  nwr["shop"]["sport"~"fishing"](area.hr);
  nwr["shop"]["brand"~"^Decathlon",i](area.hr);
  nwr["shop"]["name"~"^Decathlon",i](area.hr);
  nwr["shop"]["name"~"ribolov|ribi[čc]k|fishing",i](area.hr);
);
out center tags;`;

// Islands: place=island ways and multipolygon relations, with geometry.
const ISLANDS = `[out:json][timeout:300];
area["ISO3166-1"="HR"][admin_level=2]->.hr;
(
  way["place"="island"](area.hr);
  relation["place"="island"](area.hr);
);
out geom;`;

const MIN_ISLAND_KM2 = 1; // skip islets: nobody sells tackle there

type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

async function overpass(query: string): Promise<{ elements: El[] }> {
  for (const url of SERVERS) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ribolov-more-import/0.1" },
        body: "data=" + encodeURIComponent(query),
      });
      if (r.ok) return (await r.json()) as { elements: El[] };
      console.warn(`${url}: HTTP ${r.status}`);
    } catch (e) {
      console.warn(`${url}: ${String(e)}`);
    }
  }
  throw new Error("no Overpass server answered");
}

/** Shop kinds we keep; everything else (seafood, hairdressers named "Angel"…) is dropped. */
const DROP_SHOPS = new Set(["seafood", "hairdresser", "car", "car_repair", "optician", "jewelry", "furniture", "gift", "art", "beauty"]);

function kind(t: Record<string, string>): "ribolov" | "sport" | null {
  if (DROP_SHOPS.has(t.shop)) return null;
  if (/^decathlon/i.test(t.brand ?? "") || /^decathlon/i.test(t.name ?? "")) return "sport";
  if (t.shop === "fishing" || /yes|only/.test(t.fishing ?? "") || /fishing/.test(t.sport ?? "")) return "ribolov";
  if (/ribolov|ribi[čc]k|fishing/i.test(t.name ?? "")) return "ribolov";
  return null;
}

type Place = { naziv: string; lat: number; lon: number; stanovnika: number };
const places: Place[] = (() => {
  const f = path.join(process.cwd(), "data/places.json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).mjesta : [];
})();

function nearestPlace(lat: number, lon: number): string {
  let best: { n: string; d: number } | null = null;
  for (const p of places) {
    if (Math.abs(p.lat - lat) > 0.1 || Math.abs(p.lon - lon) > 0.15) continue;
    const d = turf.distance([lon, lat], [p.lon, p.lat]);
    if (d <= 8 && (!best || d < best.d)) best = { n: p.naziv, d };
  }
  return best?.n ?? "";
}

async function islands(): Promise<Feature<Polygon | MultiPolygon, { naziv: string; km2: number }>[]> {
  const raw = await overpass(ISLANDS);
  const gj = osmtogeojson(raw as never) as GeoJSON.FeatureCollection;
  const out: Feature<Polygon | MultiPolygon, { naziv: string; km2: number }>[] = [];
  for (const f of gj.features) {
    if (f.geometry?.type !== "Polygon" && f.geometry?.type !== "MultiPolygon") continue;
    const km2 = turf.area(f as Feature<Polygon | MultiPolygon>) / 1e6;
    if (km2 < MIN_ISLAND_KM2) continue;
    const simple = turf.simplify(f as Feature<Polygon | MultiPolygon>, { tolerance: 0.0005, highQuality: false });
    const name = (f.properties as Record<string, string> | null)?.name ?? "";
    out.push({ type: "Feature", geometry: simple.geometry, properties: { naziv: name, km2: Math.round(km2) } });
  }
  return out;
}

function islandOf(lat: number, lon: number, isl: Feature<Polygon | MultiPolygon, { naziv: string }>[]): string | null {
  const pt = turf.point([lon, lat]);
  for (const f of isl) if (turf.booleanPointInPolygon(pt, f)) return f.properties.naziv || "otok";
  return null;
}

async function main() {
  const isl = await islands();
  console.log(`${isl.length} islands ≥ ${MIN_ISLAND_KM2} km²`);
  const els = (await overpass(SHOPS)).elements;
  const seen = new Set<string>();
  const shops = els
    .map((e) => {
      const t = e.tags ?? {};
      const k = kind(t);
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      if (!k || lat == null || lon == null) return null;
      const addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
      return {
        naziv: t.name ?? (k === "sport" ? "Decathlon" : "Ribolovna oprema"),
        vrsta: k,
        adresa: addr,
        grad: t["addr:city"] ?? t["addr:place"] ?? nearestPlace(lat, lon),
        telefon: [t.phone ?? t["contact:phone"]].filter(Boolean) as string[],
        web: t.website ?? t["contact:website"] ?? null,
        radno_vrijeme: t.opening_hours ?? null,
        lat,
        lon,
        otok: islandOf(lat, lon, isl),
        partner: false,
        izvor: `OSM ${e.type}/${e.id}`,
      };
    })
    .filter((s): s is NonNullable<typeof s> => {
      if (!s) return false;
      const key = `${s.naziv}|${s.lat.toFixed(4)}|${s.lon.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  fs.writeFileSync(path.join(process.cwd(), "data/shops.json"), JSON.stringify({ izvor: "© OpenStreetMap contributors", trgovine: shops }, null, 1));
  const islFile = path.join(process.cwd(), "data/imported/osm_otoci.geojson");
  fs.writeFileSync(islFile, JSON.stringify({ type: "FeatureCollection", features: isl }));
  const metaFile = path.join(process.cwd(), "data/imported/_meta.json");
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
  meta["osm_otoci.geojson"] = { izvor: "OpenStreetMap", datum: new Date().toISOString().slice(0, 10), broj: isl.length };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
  const by = shops.reduce<Record<string, number>>((a, s) => ((a[s.vrsta] = (a[s.vrsta] ?? 0) + 1), a), {});
  console.log(`${shops.length} shops (${JSON.stringify(by)}), ${shops.filter((s) => s.otok).length} on islands -> data/shops.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
