/**
 * Imports fishing zones and sub-zones (11 zones, 40 sub-zones) from
 * data/manual/ribolovne_zone.shp (the SHP is requested from Uprava ribarstva).
 * The MPS WMS (geoportal.mps.hr) only gives images, so it is not used for import.
 *
 *   npm run import:zones
 *   ZONA_FIELD=ZONA PODZONA_FIELD=PODZONA npm run import:zones
 *
 * HTRS96/TM (EPSG:3765) coordinates are reprojected to WGS84 automatically.
 */
import fs from "node:fs";
import path from "node:path";
import proj4 from "proj4";
import * as shapefile from "shapefile";
import type { Feature, Geometry, Position } from "geojson";
import { writeCollection } from "./common";

const SHP = path.join(process.cwd(), "data/manual/ribolovne_zone.shp");
const HTRS96 = "+proj=tmerc +lat_0=0 +lon_0=16.5 +k=0.9999 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

function reproject(g: Geometry, fn: (p: Position) => Position): Geometry {
  const map = (c: unknown): unknown => (typeof (c as number[])[0] === "number" ? fn(c as Position) : (c as unknown[]).map(map));
  if (g.type === "GeometryCollection") return { ...g, geometries: g.geometries.map((x) => reproject(x, fn)) };
  return { ...g, coordinates: map(g.coordinates) } as Geometry;
}

function firstCoord(g: Geometry): Position {
  let c: unknown = g.type === "GeometryCollection" ? [] : g.coordinates;
  while (Array.isArray(c) && typeof c[0] !== "number") c = c[0];
  return c as Position;
}

async function main() {
  if (!fs.existsSync(SHP)) {
    console.log(`TODO: ${path.relative(process.cwd(), SHP)} not found. Request the SHP from Uprava ribarstva and place it there.`);
    return;
  }
  const src = await shapefile.open(SHP, SHP.replace(/\.shp$/, ".dbf"), { encoding: "utf-8" });
  const features: Feature[] = [];
  let fields: string[] | null = null;
  for (;;) {
    const r = await src.read();
    if (r.done) break;
    const f = r.value as Feature<Geometry>;
    if (!fields) {
      fields = Object.keys(f.properties ?? {});
      console.log("Polja u DBF-u:", fields.join(", "));
    }
    let geom = f.geometry;
    const [x] = firstCoord(geom);
    if (Math.abs(x) > 180) geom = reproject(geom, (p) => proj4(HTRS96, "WGS84", p as [number, number]));
    const p = f.properties ?? {};
    const zona = String(p[process.env.ZONA_FIELD ?? "ZONA"] ?? "");
    const podzona = String(p[process.env.PODZONA_FIELD ?? "PODZONA"] ?? "");
    features.push({
      type: "Feature",
      geometry: geom,
      properties: {
        layer: "ribolovna_zona",
        rule_key: "ribolovna_zona",
        priority: 12,
        name: podzona || zona || null,
        zona: zona || null,
        podzona: podzona || null,
        source: "Uprava ribarstva SHP",
        placeholder: false,
        attrs: p,
      },
    });
  }
  if (features.length && !features[0].properties?.zona)
    console.warn("! ZONA/PODZONA fields not found – set ZONA_FIELD / PODZONA_FIELD (see field list above).");
  writeCollection("ribolovne_zone.geojson", features, "Uprava ribarstva");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
