/**
 * Loads every *.geojson in data/manual and data/imported into the PostGIS `zones` table
 * (replacing its contents). Requires DATABASE_URL (see .env.example) and `npm run db:up`.
 *
 *   npm run import:db
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import type { FeatureCollection } from "geojson";

const url = process.env.DATABASE_URL ?? "postgres://ribolov:ribolov@localhost:5432/ribolov";
const dirs = ["data/manual", "data/imported"].map((d) => path.join(process.cwd(), d));

async function main() {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  const counts: Record<string, number> = {};
  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE zones RESTART IDENTITY");
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir).filter((n) => n.endsWith(".geojson"))) {
        const fc = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as FeatureCollection;
        for (const f of fc.features) {
          if (!f.geometry) continue;
          const p = f.properties ?? {};
          await client.query(
            `INSERT INTO zones (layer, priority, rule_key, name, source, placeholder, needs_legal_check, props, geom)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8, ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON($9), 4326)))`,
            [p.layer, p.priority ?? 99, p.rule_key, p.name ?? null, p.source ?? file, Boolean(p.placeholder), Boolean(p.needs_legal_check), p, JSON.stringify(f.geometry)],
          );
          const k = `${p.layer}${p.placeholder ? " (placeholder)" : ""}`;
          counts[k] = (counts[k] ?? 0) + 1;
        }
        console.log(`  ${file}: ${fc.features.length}`);
      }
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
  console.log("Uvezeno po sloju:");
  console.table(counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
