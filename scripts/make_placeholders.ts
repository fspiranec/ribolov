/**
 * Generates data/manual/placeholders.geojson: APPROXIMATE boxes/polygons so the
 * app never shows green inside a known restricted area before real data is imported.
 *
 * Every feature has placeholder: true. The rules engine caps such hits at "žuto"
 * and warns the user. TODO: replace with geometries digitised from NN 125/2020,
 * ribarstvo.hr maps and the Bioportal WFS (scripts/import/bioportal.ts).
 *
 * Run: npx tsx scripts/make_placeholders.ts
 */
import fs from "node:fs";
import path from "node:path";

type Box = [minLon: number, minLat: number, maxLon: number, maxLat: number];
const PRIORITY: Record<string, number> = {
  hr_more: 0,
  ihtioloski_rezervat: 1,
  stroga_zastita: 2,
  nacionalni_park: 6,
  posebni_rezervat_more: 7,
  park_prirode: 8,
  posebno_staniste: 9,
  posebna_regulacija: 10,
};

function box([a, b, c, d]: Box) {
  return { type: "Polygon", coordinates: [[[a, b], [c, b], [c, d], [a, d], [a, b]]] };
}

/** ~1.2 km box around a point (for river mouths and small bays). */
function around(lon: number, lat: number, r = 0.008): Box {
  return [lon - r, lat - r, lon + r, lat + r];
}

function f(layer: string, rule_key: string, name: string, geometry: object, extra: object = {}) {
  return {
    type: "Feature",
    properties: { layer, priority: PRIORITY[layer], rule_key, name, source: "placeholder (make_placeholders.ts)", placeholder: true, todo: "Digitalizirati stvarnu geometriju iz propisa/službenih karata.", ...extra },
    geometry,
  };
}

const features = [
  // Rough outline of the Croatian fishing sea incl. coast and islands (land is excluded via depth).
  // TODO: official boundary (territorial sea + exclusive economic zone).
  f("hr_more", "hr_more", "Ribolovno more RH (približno)", {
    type: "Polygon",
    coordinates: [[
      [13.48, 45.70], [15.2, 45.45], [16.2, 44.2], [17.4, 43.3], [18.6, 42.55], [18.55, 42.38],
      [17.5, 41.9], [16.0, 42.2], [15.2, 42.7], [14.0, 43.5], [13.2, 44.3], [12.9, 45.1], [13.2, 45.6], [13.48, 45.70],
    ]],
  }),

  // 1. Special ichthyological reserve (NN 125/2020).
  f("ihtioloski_rezervat", "ihtioloski_rezervat", "Uvala Šćuza (Medulinski zaljev)", box(around(13.935, 44.805, 0.006))),

  // 6. National parks.
  f("nacionalni_park", "nacionalni_park", "NP Brijuni", box([13.70, 44.88, 13.80, 44.95])),
  f("nacionalni_park", "nacionalni_park", "NP Kornati", box([15.15, 43.70, 15.45, 43.90])),
  f("nacionalni_park", "nacionalni_park", "NP Mljet", box([17.30, 42.73, 17.42, 42.80])),

  // 7. Special marine reserves.
  f("posebni_rezervat_more", "posebni_rezervat_more", "Limski zaljev", box([13.62, 45.125, 13.76, 45.14])),
  f("posebni_rezervat_more", "posebni_rezervat_more", "Malostonski zaljev", box([17.50, 42.78, 17.72, 42.90])),
  f("posebni_rezervat_more", "posebni_rezervat_more", "Malo more", box([17.60, 42.86, 17.66, 42.89])),

  // 8. Nature parks.
  f("park_prirode", "park_prirode", "PP Telašćica", box([15.12, 43.85, 15.25, 43.93])),
  f("park_prirode", "park_prirode", "PP Lastovsko otočje", box([16.70, 42.68, 17.05, 42.82])),

  // 9. 13 special habitats (river mouths and bays).
  ...(
    [
      ["Ušće Dragonje", 13.615, 45.475],
      ["Ušće Mirne", 13.60, 45.32],
      ["Ušće Zrmanje", 15.58, 44.20],
      ["Ušće Guduće", 15.93, 43.83],
      ["Ušće Jadra", 16.48, 43.535],
      ["Ušće Žrnovnice", 16.555, 43.51],
      ["Ušće Cetine", 16.69, 43.44],
      ["Ušće Neretve", 17.45, 43.02],
      ["Pantan", 16.275, 43.515],
      ["Uvala Klimno", 14.62, 45.15],
      ["Pirovački zaljev", 15.67, 43.82],
      ["Morinje i Jadrtovac", 15.955, 43.67],
      ["Rijeka dubrovačka", 18.11, 42.67],
    ] as const
  ).map(([n, lon, lat]) => f("posebno_staniste", "posebno_staniste", n, box(around(lon, lat)))),

  // 10. Areas with special gear regulation.
  f("posebna_regulacija", "posebna_regulacija", "Velebitski kanal", box([14.80, 44.40, 15.30, 45.00])),
  f("posebna_regulacija", "posebna_regulacija", "Novigradsko i Karinsko more", box([15.45, 44.15, 15.65, 44.22])),
  f("posebna_regulacija", "posebna_regulacija", "Prokljansko jezero", box([15.84, 43.79, 15.92, 43.84])),
  f("posebna_regulacija", "posebna_regulacija_marina", "Marinski zaljev", box([16.08, 43.50, 16.13, 43.53])),
  f("posebna_regulacija", "posebna_regulacija", "Neretvanski kanal", box([17.10, 42.95, 17.45, 43.10])),
  f("posebna_regulacija", "posebna_regulacija", "Ušće Raše", box([14.03, 45.00, 14.08, 45.07])),
];

const out = path.join(process.cwd(), "data/manual/placeholders.geojson");
fs.writeFileSync(out, JSON.stringify({ type: "FeatureCollection", features }, null, 1));
console.log(`Wrote ${features.length} placeholder features to ${out}`);
