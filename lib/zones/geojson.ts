import fs from "node:fs";
import path from "node:path";
import { bbox as turfBbox, booleanPointInPolygon, distance, lineString, point, pointToLineDistance } from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { ZoneHit, ZoneProvider } from "./types";

type Indexed = { f: Feature<Geometry>; bb: number[] };

/** Rings / lines of a geometry, as coordinate arrays. */
function lines(g: Geometry): Position[][] {
  switch (g.type) {
    case "Polygon":
      return g.coordinates;
    case "MultiPolygon":
      return g.coordinates.flat();
    case "LineString":
      return [g.coordinates];
    case "MultiLineString":
      return g.coordinates;
    case "GeometryCollection":
      return g.geometries.flatMap(lines);
    default:
      return [];
  }
}

function points(g: Geometry): Position[] {
  if (g.type === "Point") return [g.coordinates];
  if (g.type === "MultiPoint") return g.coordinates;
  return [];
}

function kind(g: Geometry): ZoneHit["geomKind"] {
  if (g.type === "Polygon" || g.type === "MultiPolygon") return "polygon";
  if (g.type === "Point" || g.type === "MultiPoint") return "point";
  return "line";
}

/**
 * In-memory zone provider over GeoJSON files. Used in tests and in dev when no
 * DATABASE_URL is configured. Fine for thousands of features; use PostGIS beyond that.
 */
export class GeoJsonZoneProvider implements ZoneProvider {
  private items: Indexed[];

  constructor(collections: FeatureCollection[]) {
    this.items = collections
      .flatMap((c) => c.features)
      .filter((f) => f.geometry)
      .map((f) => ({ f: f as Feature<Geometry>, bb: turfBbox(f) }));
    // Once a layer has real (imported) features, its placeholders are dropped.
    const real = new Set(this.items.filter((i) => !i.f.properties?.placeholder).map((i) => i.f.properties?.layer));
    this.items = this.items.filter((i) => !i.f.properties?.placeholder || !real.has(i.f.properties?.layer));
  }

  static fromFiles(files: string[]): GeoJsonZoneProvider {
    const cols = files
      .filter((p) => fs.existsSync(p))
      .map((p) => JSON.parse(fs.readFileSync(p, "utf8")) as FeatureCollection);
    return new GeoJsonZoneProvider(cols);
  }

  /** All *.geojson in the given directories. */
  static fromDirs(dirs: string[]): GeoJsonZoneProvider {
    const files = dirs.flatMap((d) =>
      fs.existsSync(d)
        ? fs.readdirSync(d).filter((n) => n.endsWith(".geojson")).map((n) => path.join(d, n))
        : [],
    );
    return GeoJsonZoneProvider.fromFiles(files);
  }

  async loadedLayers(): Promise<Set<string>> {
    const s = new Set<string>();
    for (const { f } of this.items) if (!f.properties?.placeholder) s.add(String(f.properties?.layer));
    return s;
  }

  async query(lat: number, lon: number, radiusM: number): Promise<ZoneHit[]> {
    const pt = point([lon, lat]);
    const dLat = radiusM / 111_000;
    const dLon = dLat / Math.cos((lat * Math.PI) / 180);
    const out: ZoneHit[] = [];
    for (const { f, bb } of this.items) {
      if (lon < bb[0] - dLon || lon > bb[2] + dLon || lat < bb[1] - dLat || lat > bb[3] + dLat) continue;
      const g = f.geometry;
      const k = kind(g);
      let inside = false;
      let boundary: number | null = null;
      let dist: number;
      if (k === "point") {
        dist = Math.min(...points(g).map((c) => distance(pt, point(c), { units: "meters" })));
      } else {
        const d = Math.min(
          ...lines(g).map((ring) =>
            ring.length > 1 ? pointToLineDistance(pt, lineString(ring), { units: "meters" }) : Infinity,
          ),
        );
        if (k === "polygon") {
          inside = booleanPointInPolygon(pt, f as Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
          boundary = d;
        }
        dist = inside ? 0 : d;
      }
      if (dist > radiusM) continue;
      const p = f.properties ?? {};
      out.push({
        layer: String(p.layer),
        priority: Number(p.priority ?? 99),
        rule_key: String(p.rule_key),
        name: (p.name as string) ?? null,
        source: (p.source as string) ?? null,
        placeholder: Boolean(p.placeholder),
        needs_legal_check: Boolean(p.needs_legal_check),
        props: p,
        geomKind: k,
        inside,
        distance_m: dist,
        boundary_m: boundary,
      });
    }
    return out;
  }
}
