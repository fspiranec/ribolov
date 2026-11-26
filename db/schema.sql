CREATE EXTENSION IF NOT EXISTS postgis;

-- One row per spatial feature. rule_key links to an entry in /rules/areas.yaml.
CREATE TABLE IF NOT EXISTS zones (
  id               SERIAL PRIMARY KEY,
  layer            TEXT NOT NULL,          -- e.g. 'ihtioloski_rezervat', 'luka', 'plaza'
  priority         INTEGER NOT NULL,       -- 1..12 from the spec table, 0 = sea boundary
  rule_key         TEXT NOT NULL,
  name             TEXT,
  source           TEXT,                   -- where the geometry came from
  placeholder      BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE = approximate, must be digitised
  needs_legal_check BOOLEAN NOT NULL DEFAULT FALSE,
  props            JSONB NOT NULL DEFAULT '{}'::jsonb,
  geom             geometry(Geometry, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS zones_geom_idx ON zones USING GIST (geom);
CREATE INDEX IF NOT EXISTS zones_geog_idx ON zones USING GIST ((geom::geography));
CREATE INDEX IF NOT EXISTS zones_layer_idx ON zones (layer);
