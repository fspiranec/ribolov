import path from "node:path";
import { Pool } from "pg";
import { GeoJsonZoneProvider } from "./geojson";
import { PostgisZoneProvider } from "./postgis";
import type { ZoneProvider } from "./types";

let provider: ZoneProvider | null = null;

/**
 * PostGIS when DATABASE_URL is set, otherwise the GeoJSON files in
 * data/manual and data/imported are loaded into memory.
 */
export function getZoneProvider(): ZoneProvider {
  if (provider) return provider;
  if (process.env.DATABASE_URL) {
    provider = new PostgisZoneProvider(new Pool({ connectionString: process.env.DATABASE_URL }));
  } else {
    const root = process.cwd();
    provider = GeoJsonZoneProvider.fromDirs([path.join(root, "data/manual"), path.join(root, "data/imported")]);
  }
  return provider;
}

export type { ZoneHit, ZoneProvider } from "./types";
