# Ručni podaci

- `placeholders.geojson` – PRIBLIŽNE geometrije (placeholder: true), generira `scripts/make_placeholders.ts`.
  TODO: digitalizirati stvarne geometrije iz NN 125/2020 i karata na ribarstvo.hr.
- `uzgajalista.geojson` – prazno. TODO: podaci Ministarstva poljoprivrede ili županija.
  Svojstva: `layer: uzgajaliste`, `rule_key: uzgajaliste_riba | uzgajaliste_skoljkasa`, `priority: 5`.
- `ribolovne_zone.shp` – ako postoji, učitava ga `npm run import:zones` (SHP se traži od Uprave ribarstva).
