# Pomoćnik za ribolov na moru (web MVP)

Klikneš na kartu, a aplikacija kaže smiješ li tu loviti. Uz to prikaže ribolovnu zonu, zaštićena područja, vrste u lovostaju, minimalne veličine, dopuštene alate, dubinu, vrijeme, more, sunce i mjesec.

> **Informativni alat, nije službeno tumačenje propisa.**

Sva logika pravila je na serveru (`GET /api/pin`), pa će buduća Android aplikacija koristiti isti API.

## Pokretanje

Treba Node.js 20+ (testirano na Node 26). Docker je potreban samo za PostGIS.

```powershell
npm install
npx tsx scripts/make_placeholders.ts   # približne geometrije (već su u repozitoriju)
npm run import:osm                     # luke i plaže iz OSM-a -> data/imported
npm run import:bioportal               # NP, PP, rezervati, upravljačke zone -> data/imported
npm run dev                            # http://localhost:3000
npm test                               # unit testovi + zlatni skup točaka
```

Ako `DATABASE_URL` nije postavljen, API učitava GeoJSON datoteke iz `data/manual` i `data/imported` u memoriju. Za MVP je to dovoljno.

### S PostGIS-om

```powershell
npm run db:up                          # docker compose: postgis/postgis:16-3.4, shema iz db/schema.sql
copy .env.example .env.local           # DATABASE_URL=postgres://ribolov:ribolov@localhost:5432/ribolov
$env:DATABASE_URL="postgres://ribolov:ribolov@localhost:5432/ribolov"; npm run import:db
```

API tada koristi `ST_Intersects` i `ST_DWithin` (geography, u metrima) nad tablicom `zones`.

### Ostali uvozi

| Naredba | Što radi |
|---|---|
| `npm run import:osm` | Overpass: `harbour`, `leisure=marina`, `landuse=harbour`, `natural=beach`, `leisure=beach_resort`. Javni `overpass-api.de` odbija automatske upite, pa postavi `OVERPASS_URL` (npr. `https://overpass.kumi.systems/api/interpreter`) ili koristi vlastitu instancu. |
| `npm run import:bioportal -- --list` | Popis slojeva na Bioportal WFS-u. |
| `npm run import:bioportal` | Uvozi slojeve iz `scripts/import/bioportal.config.json` (zaštićena područja, upravljačke zone). |
| `npm run import:emodnet` | Preuzima EMODnet DTM GeoTIFF u `data/bathymetry/` (50–100 MB). Bez te datoteke dubina se čita iz EMODnet REST servisa. |
| `npm run import:zones` | Učitava `data/manual/ribolovne_zone.shp`, ako postoji. HTRS96/TM se automatski preračunava u WGS84. |
| `npm run import:db` | Učitava sav GeoJSON u PostGIS. |

## API

```
GET /api/pin?lat=43.03&lon=16.05&date=2026-07-15&time=14:00&permit=sportska,parangal,vrse&mode=brod
```

- `permit`: `rekreacijska` | `sportska` plus posebne dozvole (`parangal`, `vrse`, `osti`, `rasvjeta`, `velika_riba`), odvojene zarezom. Može i zasebno: `posebne=`.
- `mode`: `obala` | `brod` | `podvodni`.
- `time` (neobavezno, lokalno vrijeme): za podvodni ribolov (od izlaska do zalaska sunca) i za sat prognoze.
- Odgovor sadrži: `semafor` (`zeleno` | `zuto` | `crveno`), `razlog`, `izvor`, `gdje`, `alati`, `danas`, `dubina`, `vrijeme`, `sunce_mjesec`, `obavijesti`, `upozorenja`, `zadnja_provjera` i `odricanje`. Svi tekstovi su na hrvatskom i engleskom (`{hr, en}`). Svaka pravna tvrdnja nosi `izvor`, `clanak`, `url`, `vrijedi_od`, `vrijedi_do` i `needs_legal_check`.

### Dozvole, trgovine, vodič kroz ribe

- **Kupnja dozvole** (`dozvola` u odgovoru): poveznica na službenu web-trgovinu Ministarstva (https://ribarstvo.mps.hr/default.aspx?id=5010), cijene iz `rules/permits.yaml` (provjereno 2026-11-26) i 3 najbliža ovlaštena prodavača. Prodavači dolaze sa službenog popisa: `npm run import:sellers`, geokodirano preko Nominatima, rezultat u `data/permit_sellers.json`.
- **Ribolovni pribor** (`trgovine`): OSM `shop=fishing`, uvoz s `npm run import:shops` u `data/shops.json`. **Partnerske trgovine** (suradnje) upisuju se u `data/partners.json` i prikazuju prve, ako su unutar 50 km.
- **Vodič kroz ribe** (`GET /api/species?date=`): 18 vrsta sa savjetima (udica, mamci, tehnika, kada, gdje) i lokalnim nazivima. Uz svaku vrstu ide i današnji status (minimalna veličina, lovostaj). Savjeti su u `data/species/species.yaml`, a slike i opisi dolaze s Wikipedije (`npm run import:species`, CC BY-SA).
- **Točka na kopnu** (npr. GPS osobe koja lovi s obale) ne prekida provjeru: `na_kopnu: true` i napomena da pravila vrijede za more ispred.
- **Jezici sučelja:** HR, EN, DE, IT, PL, CS, SL. Tekstovi pravila i savjeta postoje samo na hrvatskom i engleskom; ostali jezici prikazuju engleski. TODO: prijevod sadržaja.
- TODO: lokalni nazivi riba (`lokalni_nazivi`) su okvirni i treba ih nadopuniti po regijama.

### Aktivnost riba (`aktivnost`)

Procjena od 0 do 100 po satu, u stilu drugih ribolovnih aplikacija. Nije pravilo i ne utječe na semafor.

- **Solunarna teorija:** prolaz mjeseca iznad ili ispod promatrača je glavni period (+40, pada do 0 kroz 90 min), a izlazak i zalazak mjeseca su sporedni (+20 kroz 60 min).
- **Sunce i mjesec:** svitanje i sumrak daju +15, a mlađak i uštap do +10.
- **Vrijeme (Open-Meteo):** tlak koji polako pada daje +10, a nagli pad (pred oluju) −10. Udari vjetra iznad 50 km/h daju −15, a valovi viši od 2 m −10.
- **Izlaz:** satne ocjene, dva najbolja dvosatna termina, glavni i sporedni periodi te dnevna ocjena.

Težine su naš izbor (`lib/env/activity.ts`). Procjena nije znanstveno pouzdana i tako piše u aplikaciji.

## Kako se odlučuje

1. Točka mora biti unutar ribolovnog mora RH (`hr_more`). Ako EMODnet kaže da je točka iznad razine mora, odgovor je „kopno”.
2. Prostorni presjek sa svim slojevima, plus udaljenosti do luka, plaža i uzgajališta (do 20 km).
3. Za svaki pogođeni sloj vrijede pravila iz `rules/areas.yaml` na odabrani datum. Sezone mogu prelaziti preko nove godine.
4. Filtriranje po dozvoli i načinu ribolova.
5. Najstroža razina pobjeđuje (`crveno` > `zuto` > `zeleno`), a ostala pravila idu u `obavijesti`.
6. Ako je točka unutar 100 m od granice područja, dodaje se upozorenje i rezultat je barem žut.
7. Podvodni ribolov: crveno ako dozvola nije sportska ili ako je izvan razdoblja od izlaska do zalaska sunca. Podsjetnik se prikazuje uvijek.

Zaštitna pravila (nikad zeleno kad podaci nisu sigurni):

- **Približna geometrija** (`placeholder: true`): crveno se spušta na žuto, uz upozorenje. Čim se za sloj uveze stvarna geometrija, njegovi se placeholderi ignoriraju.
- **Neučitan kritični sloj** (luke, plaže, NP, PP, rezervati, stroga zaštita): odgovor je žut („podaci nisu potpuni”).
- **Objekt zadan samo točkom** (npr. OSM luka) ili **poligon plaže na kopnu**: unutar 150 m od luke, odnosno 100 m od plaže, odgovor je žut („provjeri”).

## Struktura

```
app/                 Next.js (karta, kartica, /api/pin)
lib/pin.ts           logika pin-upita (čista funkcija, testirana)
lib/rules/           učitavanje YAML-a i usporedba datuma
lib/zones/           prostorni upiti: PostGIS ili GeoJSON u memoriji
lib/env/             dubina (EMODnet), vrijeme (Open-Meteo, cache 1 h / 0,05°), sunce i mjesec (suncalc)
rules/*.yaml         sva pravila kao podaci
data/manual/         ručne i približne geometrije
data/imported/       rezultat uvoznih skripti (nije u gitu)
scripts/import/      uvozne skripte
tests/               unit testovi i zlatni skup (tests/golden_points.json, 20 točaka)
```

## Licence i pripisi

- **Open-Meteo** je besplatan samo za nekomercijalnu upotrebu. **Za komercijalnu verziju potreban je plaćeni plan** (https://open-meteo.com/en/pricing).
- **OSM** podaci: „© OpenStreetMap contributors” (ODbL) prikazuje se na karti. Rasterske pločice `tile.openstreetmap.org` nisu za produkcijski promet; za produkciju treba vlastiti ili komercijalni izvor pločica.
- **GeoNames** (nazivi mjesta, `npm run import:places`): CC BY 4.0, navesti „GeoNames”.
- **Slike riba**: Wikipedia/Wikimedia Commons (CC BY-SA), prednost imaju fotografije žive ribe s engleske Wikipedije. TODO: ručno odabrati najbolje fotografije (polje `slika` u `data/species/species.yaml`) i navesti autore.
- **EMODnet Bathymetry**, **Bioportal (MINGOR / Zavod za zaštitu okoliša i prirode)**: navesti izvor u aplikaciji.

## Otvoreni zadaci

Pregled za novog suradnika: [HANDOVER.md](HANDOVER.md).
Sve što još treba odraditi (pravna provjera, geometrije, prijevodi, slike…) je u [TODO.md](TODO.md).
Kako se ažuriraju pravila kad se promijeni zakon: [docs/AZURIRANJE_PRAVILA.md](docs/AZURIRANJE_PRAVILA.md).
