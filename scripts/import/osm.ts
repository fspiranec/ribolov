/**
 * Imports ports/marinas and beaches from OpenStreetMap via the Overpass API.
 * Output: data/imported/osm_luke.geojson, data/imported/osm_plaze.geojson
 * Data © OpenStreetMap contributors (ODbL) – attribution is shown on the map.
 *
 * Run: npm run import:osm
 */
import osmtogeojson from "osmtogeojson";
import type { Feature, Geometry } from "geojson";
import { countBy, hrSea, inHrSea, writeCollection } from "./common";

const OVERPASS = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
// south, west, north, east – Croatian coast; non-HR results are filtered with the sea polygon.
const BBOX = "42.3,13.0,45.7,19.0";

const QUERY = `
[out:json][timeout:300];
(
  nwr["harbour"](${BBOX});
  nwr["leisure"="marina"](${BBOX});
  nwr["landuse"="harbour"](${BBOX});
  nwr["landuse"="port"](${BBOX});
  nwr["industrial"="port"](${BBOX});
  way["landuse"="industrial"](${BBOX});
  relation["landuse"="industrial"](${BBOX});
  nwr["natural"="beach"](${BBOX});
  nwr["leisure"="beach_resort"](${BBOX});
);
out geom;`;

type Layer = "luka" | "plaza" | "industrija";
function classify(tags: Record<string, string>): Layer | null {
  if (tags.natural === "beach" || tags.leisure === "beach_resort") return "plaza";
  if (tags.harbour || tags.leisure === "marina" || tags.landuse === "harbour" || tags.landuse === "port" || tags.industrial === "port") return "luka";
  // Industrial sites by the sea often have their own (industrial) port that is not mapped separately.
  if (tags.landuse === "industrial") return "industrija";
  return null;
}
const PRIORITY: Record<Layer, number> = { luka: 3, plaza: 4, industrija: 4 };

async function main() {
  console.log(`Overpass: ${OVERPASS}`);
  const res = await fetch(OVERPASS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ribolov-more-import/0.1" },
    body: "data=" + encodeURIComponent(QUERY),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
  const osm = await res.json();
  const gj = osmtogeojson(osm) as { features: Feature<Geometry>[] };
  const sea = hrSea();

  const out: Record<Layer, Feature[]> = { luka: [], plaza: [], industrija: [] };
  for (const f of gj.features) {
    const tags = (f.properties?.tags ?? f.properties ?? {}) as Record<string, string>;
    const layer = classify(tags);
    if (!layer || !inHrSea(f, sea)) continue;
    if (layer === "industrija" && f.geometry.type === "Point") continue;
    const feat: Feature = {
      type: "Feature",
      geometry: f.geometry,
      properties: {
        layer,
        rule_key: layer,
        priority: PRIORITY[layer],
        name: tags.name ?? tags["name:hr"] ?? null,
        source: `OSM ${f.id}`,
        placeholder: false,
        needs_legal_check: true,
        osm_tags: tags,
      },
    };
    out[layer].push(feat);
  }
  for (const [k, v] of Object.entries(out)) console.log(k, countBy(v, (f) => f.geometry.type));
  writeCollection("osm_luke.geojson", out.luka, "OpenStreetMap");
  writeCollection("osm_plaze.geojson", out.plaza, "OpenStreetMap");
  writeCollection("osm_industrija.geojson", out.industrija, "OpenStreetMap");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
