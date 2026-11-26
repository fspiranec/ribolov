/**
 * Imports fishing-tackle shops (OSM shop=fishing) on the Croatian coast via Overpass.
 * Output: data/shops.json. Partner shops can be added to data/partners.json
 * (same fields + "partner": true) and are listed first.
 * Data © OpenStreetMap contributors (ODbL).
 *
 *   npm run import:shops
 */
import fs from "node:fs";
import path from "node:path";

const OVERPASS = process.env.OVERPASS_URL ?? "https://overpass.kumi.systems/api/interpreter";
const QUERY = `[out:json][timeout:120];
area["ISO3166-1"="HR"][admin_level=2]->.hr;
nwr["shop"="fishing"](area.hr);
out center tags;`;

type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

async function main() {
  const r = await fetch(OVERPASS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ribolov-more-import/0.1" },
    body: "data=" + encodeURIComponent(QUERY),
  });
  if (!r.ok) throw new Error(`Overpass HTTP ${r.status}`);
  const els = ((await r.json()) as { elements: El[] }).elements;
  const shops = els
    .map((e) => {
      const t = e.tags ?? {};
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      const addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
      return {
        naziv: t.name ?? "Ribolovna oprema",
        adresa: addr,
        grad: t["addr:city"] ?? "",
        telefon: [t.phone ?? t["contact:phone"]].filter(Boolean) as string[],
        web: t.website ?? t["contact:website"] ?? null,
        radno_vrijeme: t.opening_hours ?? null,
        lat: lat ?? null,
        lon: lon ?? null,
        partner: false,
        izvor: `OSM ${e.type}/${e.id}`,
      };
    })
    .filter((s) => s.lat != null);
  const out = path.join(process.cwd(), "data/shops.json");
  fs.writeFileSync(out, JSON.stringify({ izvor: "© OpenStreetMap contributors", trgovine: shops }, null, 1));
  console.log(`${shops.length} shops -> data/shops.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
