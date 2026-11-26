/**
 * TEST FIXTURE geometries. Simple boxes around known places so the golden tests
 * are deterministic. These are NOT real legal boundaries and are never loaded by the app.
 */
import type { FeatureCollection, Geometry } from "geojson";

type Box = [number, number, number, number];
const box = ([a, b, c, d]: Box) => ({
  type: "Polygon" as const,
  coordinates: [[[a, b], [c, b], [c, d], [a, d], [a, b]]],
});

function f(layer: string, rule_key: string, priority: number, name: string, geometry: Geometry, extra: Record<string, unknown> = {}) {
  return {
    type: "Feature" as const,
    properties: { layer, rule_key, priority, name, source: "test-fixture", placeholder: false, ...extra },
    geometry,
  };
}

export function fixtureZones(opts: { realScuza?: boolean } = {}): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      f("hr_more", "hr_more", 0, "HR more (fixture)", box([12.9, 41.8, 19.0, 45.8])),
      f("ihtioloski_rezervat", "ihtioloski_rezervat", 1, "Uvala Šćuza", box([13.929, 44.799, 13.941, 44.811]), {
        placeholder: !opts.realScuza,
      }),
      f("stroga_zastita", "stroga_zastita", 2, "Telašćica 1A", box([15.18, 43.88, 15.19, 43.885])),
      f("luka", "luka", 3, "Luka Split", box([16.435, 43.5, 16.445, 43.506])),
      f("luka", "luka", 3, "Luka Hvar (točka)", { type: "Point", coordinates: [16.441, 43.172] }),
      f("plaza", "plaza", 4, "Plaža Makarska", box([17.01, 43.29, 17.02, 43.296])),
      f("uzgajaliste", "uzgajaliste_riba", 5, "Uzgajalište (fixture)", box([15.7, 43.6, 15.703, 43.602])),
      f("nacionalni_park", "nacionalni_park", 6, "NP Kornati", box([15.15, 43.7, 15.45, 43.9])),
      f("posebni_rezervat_more", "posebni_rezervat_more", 7, "Limski zaljev", box([13.62, 45.125, 13.76, 45.14])),
      f("park_prirode", "park_prirode", 8, "PP Telašćica", box([15.12, 43.85, 15.25, 43.93])),
      f("posebno_staniste", "posebno_staniste", 9, "Ušće Neretve", box([17.4, 43.0, 17.46, 43.04])),
      f("natura2000", "natura2000", 11, "Natura fixture Vis", box([15.95, 42.95, 16.05, 43.05])),
      f("ribolovna_zona", "ribolovna_zona", 12, "Zona E (fixture)", box([15.8, 42.8, 16.3, 43.2]), {
        zona: "E",
        podzona: "E-fixture",
      }),
    ],
  };
}
