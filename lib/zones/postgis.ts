import { Pool } from "pg";
import type { ZoneHit, ZoneProvider } from "./types";

/** Zone provider backed by the PostGIS `zones` table (see db/schema.sql). */
export class PostgisZoneProvider implements ZoneProvider {
  constructor(private pool: Pool) {}

  async loadedLayers(): Promise<Set<string>> {
    const r = await this.pool.query<{ layer: string }>(
      "SELECT DISTINCT layer FROM zones WHERE NOT placeholder",
    );
    return new Set(r.rows.map((x) => x.layer));
  }

  async query(lat: number, lon: number, radiusM: number): Promise<ZoneHit[]> {
    const sql = `
      WITH p AS (SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326) AS pt)
      SELECT z.layer, z.priority, z.rule_key, z.name, z.source, z.placeholder,
             z.needs_legal_check, z.props,
             GeometryType(z.geom) AS gtype,
             ST_Intersects(z.geom, p.pt) AS inside,
             ST_Distance(z.geom::geography, p.pt::geography) AS distance_m,
             CASE WHEN GeometryType(z.geom) IN ('POLYGON', 'MULTIPOLYGON')
                  THEN ST_Distance(ST_Boundary(z.geom)::geography, p.pt::geography) END AS boundary_m
      FROM zones z, p
      WHERE ST_DWithin(z.geom::geography, p.pt::geography, $3)
        -- once a layer has real (imported) features, its placeholders are ignored
        AND (NOT z.placeholder OR z.layer NOT IN (SELECT layer FROM zones WHERE NOT placeholder))`;
    const r = await this.pool.query(sql, [lon, lat, radiusM]);
    return r.rows.map((x) => {
      const gtype = String(x.gtype);
      const geomKind: ZoneHit["geomKind"] = gtype.includes("POLYGON")
        ? "polygon"
        : gtype.includes("POINT")
          ? "point"
          : "line";
      return {
        layer: x.layer,
        priority: x.priority,
        rule_key: x.rule_key,
        name: x.name,
        source: x.source,
        placeholder: x.placeholder,
        needs_legal_check: x.needs_legal_check,
        props: x.props ?? {},
        geomKind,
        inside: geomKind === "polygon" && x.inside,
        distance_m: Number(x.distance_m),
        boundary_m: x.boundary_m == null ? null : Number(x.boundary_m),
      };
    });
  }
}
