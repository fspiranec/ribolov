# Handover – Pomoćnik za ribolov na moru

Stanje na dan 26. 11. 2026. Ovaj dokument je za svakoga tko nastavlja rad na projektu: čovjeka ili novu AI sesiju.

> **Za novu AI sesiju – počni ovdje:** trenutni zadatak je **plan dorade** u [docs/PLAN_DORADE.md](docs/PLAN_DORADE.md) (vlasnikov dokument). Stanje po koracima je u §0 ispod. Prije rada pročitaj §5 (odluke vlasnika), a nakon svake promjene pokreni `npm test`. Vlasnik piše na hrvatskom i želi kratke, jasne odgovore.

## 0. Plan dorade – stanje (26. 11. 2026.)

Redoslijed iz [docs/PLAN_DORADE.md](docs/PLAN_DORADE.md):

1. **Zone zabrana s izvorom i datumom; blaži status** – ✅ gotovo
   - novi OSM sloj `industrija` (`data/imported/osm_industrija.geojson`, 945 zona, `landuse=industrial`); unutar 200 m odgovor je žut, pravilo `industrija` u `rules/areas.yaml`. Luke sad uključuju i `landuse=port` / `industrial=port` (501). Industrijska luka Koromačno u OSM-u nije ucrtana posebno, a zona Holcim je ~2 km od testne točke 44.958, 14.104.
   - uvozi pišu izvor i datum u `data/imported/_meta.json`; API vraća `izvori_podataka`, a presuda ih prikazuje uz „pravila provjerena …”, s godinom.
   - zeleni naslov je sada „Nema poznatih zabrana”, s tekstom „Za ovo mjesto nemamo podatke o zabranama. Vrijede opća pravila…”.
2. **Brzi popravci** – ✅ gotovo
   - „Idući dani” imaju oznaku „najjači udari / valovi”, a boje se računaju za svaku vrijednost posebno;
   - broj u krugu aktivnosti koristi `fill-ink`, čitljiv u oba načina;
   - podnaslov lokacije se više ne reže;
   - faze mjeseca na HR: „skoro pun mjesec, opada”;
   - podsjetnici se ne prikazuju za vrste koje su rekreativcima trajno zabranjene (`trajno_zabranjeno` u `closed_seasons.yaml`).
   - **Nije napravljeno:** dubina s objašnjenjem za lov s obale (točka 6 u planu). Lovostaj u API-ju ima polja `trajno_zabranjeno` i `s_obale`, ali ih sučelje još ne koristi.
3. **Osnovno / Detaljno i novi redoslijed** – ✅ gotovo
   - izbor „Prikaz” u postavkama, sprema se u localStorage (`ribolov:prikaz`), zadano „Osnovno”; logika u `lib/view.ts` (test `tests/view.test.ts`);
   - redoslijed: status, podsjetnici, dozvola, moj ulov, ribe danas, zaštićene/invazivne/opasne vrste, aktivnost, prognoza, idući dani; sa strane (na mobitelu ispod) karta, „Prvi put…”, „Ribolov s djecom”, pravila;
   - Osnovno: aktivnost je jedna rečenica („Najbolje vrijeme danas: 13–15 h”), prognoza bez udara, perioda valova i mjeseca (gumb „Prikaži detaljno”), lovostaji samo `s_obale && !trajno_zabranjeno`. Detaljno: puni graf + ista rečenica;
   - dubina ima objašnjenje (točka, ne obala; na kopnu: odaberi more);
   - podsjetnici o lovostaju za vrste koje se ne love s obale (`s_obale: false`, npr. lampuga) ne prikazuju se kod načina „S obale” (`lib/pin.ts`);
   - upozorenja i zabrane se nikad ne skrivaju.
4. **Vrste: zaštićene, invazivne, opasne** – ✅ gotovo (sadržaj čeka provjeru, vidi TODO.md)
   - 12 vrsta u `data/species/special.yaml` (kategorija, `ulov: pusti | ne_vracaj | pravila`, razina, rečenica, „što učiniti”, prva pomoć, prijava); slike `npm run import:special` → `special_wiki.json`; učitava `lib/special.ts`, `/api/species` vraća `posebne`;
   - kartica i detalj u `app/ui/Special.tsx`; u „Moj ulov” vrste se biraju u posebnoj skupini, a `checkCatch` vraća `posebno` i status `ne_vracaj` (veliko crveno/žuto upozorenje, prva pomoć, „Prijavi nalaz”);
   - **ograde (vlasnikov zahtjev):** uz svaku prvu pomoć „opća informacija, ne liječnički savjet…”, uz sve savjete o vrstama „informativno, neslužbeno…”, uz kartice savjeta „okvirni savjeti, nisu službeni”. Tako raditi i za svaki novi savjet;
   - „Prijavi nalaz” vodi na IRB-ovu stranicu projekta ALIENA (službeni kanal za prijave nije pronađen).
   - **Provjera prema izvorima (26. 11.):** kornjača prema shemi prve pomoći HAOP-a (zovi 112, ne vadi udicu, prereži najlon blizu usta, drži je u hladu do veterinara); za invazivne vrste NEMA službenog „ne vraćaj u more” – status u ulovu je `prijavi` („fotografiraj i prijavi”), plavi rak se smije zadržati; prva pomoć: najviše 45 °C, oprez kod djece, duboku bodlju ne vaditi, tetanus. Otvoreno u TODO.md.
   - Prikaz: kartice Zaštićene / Invazivne / Opasne s mrežom vrsta (bez vodoravnog listanja).
5. **SSR, Open Graph, QR** – ✅ gotovo
   - `app/page.tsx` je serverska stranica: za `?lat&lon` zove `runPin` (`lib/pinServer.ts`, dijeli ga s `/api/pin`) i predaje rezultat klijentu (`app/Home.tsx`), koji tada preskače prvi isti upit;
   - `generateMetadata` daje naslov/OG „Koromačno: nema poznatih zabrana” (`lib/preview.ts`), slika pregleda `/og?lat&lon` (`app/og/route.tsx`, 1200×630);
   - `metadataBase`: `NEXT_PUBLIC_SITE_URL`, inače Vercel produkcijski URL, inače localhost – **na Vercelu postaviti `NEXT_PUBLIC_SITE_URL` kad bude domena**;
   - `/qr?lat&lon&naziv` – kartica za iznajmljivače s QR kodom (paket `qrcode`), poruka na HR/EN/DE/IT, gumb za ispis; poveznica u postavkama.
6. **Ribolov s djecom i pravila ponašanja** – ✅ gotovo
   - `KidsCard` u `app/ui/Dashboard.tsx` (6 savjeta) i „Moj album riba”: svaka vrsta upisana u „Moj ulov” sprema se s datumom (`ribolov:album`, samo na uređaju), album prikazuje ulovljene vrste u boji.
7. **Kontakt s IRB-om i turističkom zajednicom** – posao za vlasnika, ne za kod.
**Trgovine i prodavači dozvola (26. 11., vlasnikov zahtjev):** `npm run import:shops` sad uvozi ribolovne trgovine, Decathlon (`vrsta: sport`), „lov i ribolov” i trgovine s „ribolov/ribički” u nazivu; mjesto se dopunjava iz GeoNames; uvozi i obrise otoka ≥ 1 km² (`data/imported/osm_otoci.geojson`). `nearestReachable` u `lib/pin.ts`: trgovina/prodavač preko mora dobiva +30 km i oznaku „na otoku X – treba trajekt ili brod”; Krk, Pag, Čiovo, Murter i Vir su kopno, Cres+Lošinj i Ugljan+Pašman jedna cjelina (`lib/islands.ts`, test `tests/shops.test.ts`).

**Izvještaj testiranja (27. 11.):** [docs/IZVJESTAJ_TESTIRANJA.md](docs/IZVJESTAJ_TESTIRANJA.md); greške iz dijela A popravljene (vidi „Stanje popravaka” u izvještaju). Važno:
- sloj otoka više nije zona (`lib/zones/geojson.ts` učitava samo značajke s `layer` i `rule_key`);
- točka više od 30 m iznad mora daje žuto;
- podsjetnik o zalasku prati odabrani datum i sat;
- najbolje vrijeme preskače termine koji su prošli;
- brojevi idu kroz `lib/format.ts` (`num`, `dist`, `prettyCase`);
- link čuva `date`, `lang` i `mode`.

**Prijedlozi iz izvještaja (B, C) i recepti (27. 11.):** vidi „Dodatak” u izvještaju. Novo:
- `data/recipes.yaml` + `lib/recipes.ts` + `app/ui/Recipes.tsx`:
  - recepti dolaze u `/api/species` kao `recepti`;
  - polja `autor` i `link` služe za lokalnu konobu;
  - `istaknuto: dobro_za_more`.
- `sizeOnlySpecies` u `lib/species.ts`: ribe iz `rules/min_sizes.yaml` kojih nema u vodiču, u „Moj ulov” pod ključem `mjera:<naziv>`.
- `scripts/missing_translations.ts [jezik]` ispisuje tekstove kojima nedostaje prijevod.

**Android (Capacitor) čeka** dok web nije do kraja testiran (vlasnikova odluka). JDK 21 je instaliran, a Android SDK nije. Vercel projekt „ribolov” je povezan s GitHubom.

8. **Offline i pristupačnost** – ✅ gotovo (osnovno)
   - `public/sw.js` (v2, samo produkcija): stranice, `/api/species` i `/api/pin` network-first s rezervom iz cachea (zaglavlje `X-Ribolov-Offline` → traka „Bez interneta”), slike riba cache-first. „Moj ulov” (POST) offline ne radi; lokalni izračun iz `/api/rules` nije napravljen;
   - alt na logu, `role="dialog"` na sheetovima, prevedeni natpisi gumba zatvori/obriši, `lang` na `<html>` prati odabrani jezik, oznaka uz krug aktivnosti; datum u zaglavlju i podnožju uvijek s godinom.

Koraci 1–2 su u commitu „Plan dorade: zone, izvori, brzi popravci” na GitHubu (`main`). Koraci 3–8, provjera savjeta o vrstama i popravak preporuka trgovina su u commitu „Plan dorade: koraci 3–8, vrste, SSR i QR, trgovine” (`main`).

## 1. Što je aplikacija

Web aplikacija (kasnije i Android) za **sportski i rekreacijski ribolov na hrvatskom Jadranu**, namijenjena prije svega **turistima**. Za lokaciju (GPS ili odabranu na karti) kaže:

- **smiješ li tu loviti** (semafor zeleno / žuto / crveno s razlogom);
- **koje ribe sad grizu**, kako ih prepoznati, minimalne veličine, lovostaje;
- **vrijeme i more** (vjetar, valovi, temperatura mora, sunce, mjesec), **aktivnost riba** i prognozu za 3 dana;
- **gdje kupiti dozvolu** (službena web-trgovina, cijene, najbliži prodavači) i najbliže ribolovne trgovine;
- **Moj ulov:** upišeš ribu i duljinu, a aplikacija kaže smiješ li je zadržati i prati dnevni limit od 5 kg.

Cilj vlasnika je **educirati turiste**. Moguće je kasnije predstavljanje Ministarstvu (Uprava ribarstva), turističkim zajednicama i FLAG-ovima.

## 2. Stanje

| Područje | Stanje |
|---|---|
| Web aplikacija (Next.js) | radi lokalno, nije objavljena |
| Testovi | 62 od 62 prolazi (`npm test`) |
| Jezici | HR, EN, DE, IT, PL, CS, SL; sve prevedeno, izvorni govornik nije pregledao |
| Tamni način | da (prati uređaj, gumb ☀️/🌙) |
| Pravna točnost pravila | **nije provjerena**; članci su `TODO` (vidi §8) |
| Git | https://github.com/fspiranec/ribolov (grana `main`) |
| Hosting | pripremljeno za Vercel (`vercel.json`, regija Frankfurt), nije objavljeno |
| Android | nije započet; vlasnik želi prvo dovršiti web |

## 3. Pokretanje

Treba Node.js 20+ (na ovom računalu Node 26 u `C:\Program Files\nodejs`).

```powershell
cd "$HOME\Documents\riboloiv"
npm install
npm run dev      # http://localhost:3000
npm test
```

- Lokaciju možeš zadati u adresi: `http://localhost:3000/?lat=43.0446&lon=16.0836` (Komiža).
- **Promjene u `rules/*.yaml` i `data/**` vide se tek nakon ponovnog pokretanja `npm run dev`**, jer se drže u memoriji.
- Ako preglednik pokazuje star izgled, pritisni Ctrl + Shift + R. Service worker radi samo u produkciji.
- PostGIS (`docker-compose.yml`) **nije potreban**: bez varijable `DATABASE_URL` sve se čita iz GeoJSON datoteka.

## 4. Arhitektura

```
app/
  page.tsx            glavni ekran (zaglavlje s lokacijom, presuda, kartice, sheetovi)
  ui/Dashboard.tsx    kartice: presuda, prognoza, aktivnost, ribe, dozvola, pribor, pravila
  ui/MyCatch.tsx      „Moj ulov”
  ui/MapView.tsx      MapLibre karta (OpenFreeMap, rezervno OSM rasterske pločice)
  SpeciesGuide.tsx    vodič kroz ribe i detalji ribe
  api/pin             GET  – sva logika za lokaciju (glavni endpoint, koristit će ga i Android)
  api/species         GET  – vodič kroz ribe za datum i sat
  api/catch           POST – provjera ulova
  api/rules           GET  – paket pravila s verzijom (za offline u mobilnoj aplikaciji)
lib/
  pin.ts              evaluatePin(): čista funkcija, sve odluke (semafor, alati, podsjetnici, 3 dana)
  catch.ts            checkCatch(): lovostaj, veličina, komadi, 5 kg + jedna riba
  species.ts          vodič; nazivi riba po jeziku; ocjena „sad grize” (mjesec + doba dana)
  rules/              učitavanje YAML-a, datumi (rasponi preko nove godine), tipovi
  zones/              prostorni upiti: GeoJSON u memoriji ili PostGIS
  env/                dubina (EMODnet), vrijeme (Open-Meteo, cache 1 h), sunce i mjesec (suncalc),
                      aktivnost (solunarna heuristika), naziv mjesta (GeoNames, lokalno)
  i18n.ts             prijevodi sučelja + t() i c() (vidi §7)
rules/*.yaml          SVA pravila kao podaci (opća, lovostaji, veličine, zabranjene vrste, područja, dozvole)
data/manual           približne geometrije (placeholder) – Šćuza, staništa, granica mora…
data/imported         uvezeno: OSM luke i plaže, Bioportal (NP, PP, rezervati, zone stroge zaštite)
data/*.json           prodavači dozvola, trgovine, partneri, naselja (GeoNames)
data/species          savjeti o ribama (species.yaml), slike i opisi (wiki.json), nazivi (names*.json)
locales/*.json        prijevodi (ključ = engleski tekst)
scripts/import        uvozne skripte (vidi §6)
tests                 unit testovi, zlatni skup točaka, prijevodi, ulov, aktivnost
docs/AZURIRANJE_PRAVILA.md   postupak kad se promijeni zakon
TODO.md               svi otvoreni zadaci
```

**Ključno načelo:** logika pravila je na poslužitelju, a pravila su podaci. Promjena zakona znači promjenu YAML-a, a ne koda (§9).

### Kako se odlučuje semafor
1. **Granica mora:** točka mora biti u ribolovnom moru RH (grubi poligon). Ako je na kopnu, provjera se ne prekida, nego vrijedi kao ribolov s obale.
2. **Područja:** presjek sa svim slojevima, a najstroža razina pobjeđuje (crveno > žuto > zeleno).
3. **Nikad zeleno kad podaci nisu sigurni:**
   - približna geometrija spušta crveno na žuto;
   - ako nije učitan kritični sloj, odgovor je žut;
   - blizina granice (100 m) daje žuto;
   - luka zadana samo točkom daje žuto unutar 150 m, plaža unutar 100 m.
4. **Podvodni ribolov:** samo uz sportsku dozvolu i od izlaska do zalaska sunca.

## 5. Odluke vlasnika (važno, ne mijenjati bez pitanja)

- **Prvo web, mobilna aplikacija kasnije.** „Ne radimo dvije stvari odjednom.”
- **Sučelje se temelji na sadržaju, ne na karti:** lokacija, presuda, ribe, prognoza, aktivnost. Karta je mali pregled koji se otvara po potrebi.
- **U sučelju se NE prikazuju izvori iz Narodnih novina, članci ni oznake TODO / „čeka pravnu provjeru”.** Ostaju u API-ju i podacima; korisnik vidi samo kratko odricanje u podnožju.
- **Jednostavan jezik:** svakodnevni nazivi pribora, a pravni u zagradi, npr. „Najlon s udicom, bez štapa (odmet)”.
- **Riječni ribolov je odbačen.**
- **Ne izmišljati pravila, geometrije ni nazive.** Što nije potvrđeno, označiti u TODO.md i u aplikaciji prikazati oprezno (žuto ili hrvatski naziv).
- **Bez plaćenih usluga i kredita;** besplatni izvori podataka.

## 6. Podaci i uvozi

| Naredba | Izvor | Izlaz |
|---|---|---|
| `npm run import:osm` | OSM Overpass (luke, plaže). Javni overpass-api.de odbija skripte → `OVERPASS_URL=https://overpass.kumi.systems/api/interpreter` | `data/imported/osm_*.geojson` |
| `npm run import:bioportal` | Bioportal WFS (`dzzpnpis:zasticeno_podrucje_poligoni`, `dzzpnpis:upravljacke_zonacije_poligoni`); spor, nekoliko minuta | `data/imported/bioportal.geojson` |
| `npm run import:sellers` | službeni popis prodavača dozvola (xlsx Ministarstva) + Nominatim | `data/permit_sellers.json` |
| `npm run import:shops` | OSM: ribolovne trgovine, Decathlon, „lov i ribolov”; obrisi otoka | `data/shops.json`, `data/imported/osm_otoci.geojson` |
| `npm run import:places` | GeoNames HR (CC BY 4.0) | `data/places.json` |
| `npm run import:species` | Wikipedia (slike, opisi); poštuje ograničenje broja upita | `data/species/wiki.json` |
| `npm run import:special` | Wikipedia (slike zaštićenih, invazivnih i opasnih vrsta) | `data/species/special_wiki.json` |
| `npm run import:species-names` | Wikipedia jezične poveznice | `data/species/names.json` (ručne ispravke u `names_manual.json`) |
| `npm run import:emodnet` | EMODnet GeoTIFF dubina (opcionalno, ~50–100 MB) | `data/bathymetry/` |
| `npm run import:zones` | SHP ribolovnih zona (još ga nemamo) | `data/imported/ribolovne_zone.geojson` |

U radu aplikacija koristi: **Open-Meteo** (vrijeme, more), **EMODnet REST** (dubina) i **OpenFreeMap** (karta).

## 7. Prijevodi

- **Hrvatski i engleski** stoje uz same tekstove (`{ hr, en }` u YAML-u i kodu).
- **DE, IT, PL, CS, SL** su u `locales/*.json`; ključ je **engleski tekst**. Tekstovi s brojevima imaju predloške `{0}`, `{1}`.
- **`c(text, lang)`** prevodi sadržaj iz API-ja, a **`t(key, lang)`** natpise sučelja (`lib/i18n.ts`).
- **Novi ili promijenjeni engleski tekst** mora dobiti prijevod u svih 5 datoteka. **`tests/i18n.test.ts` ne prolazi** dok nešto nedostaje.
- **Nazivi riba** dolaze iz `data/species/names.json` + `names_manual.json`. Ako naziva nema, prikazuje se hrvatski.

## 8. Otvoreno (detalji u TODO.md)

**Prije javne objave i ministarstva:**
1. **Pravna provjera pravila:** članci (`clanak: "TODO"`), izravne poveznice na NN, datumi `vrijedi_od`, stavke `needs_legal_check`.
2. **Službene geometrije:** granica ribolovnog mora, uvala Šćuza, 13 posebnih staništa, područja posebne regulacije i dopušteni alati na njima, obalni pojas Telašćice.
3. **Uzgajališta** (Ministarstvo ili županije) i **ribolovne zone/podzone** (SHP od Uprave ribarstva).
4. **Natura 2000** nije na Bioportal WFS-u; treba drugi izvor.
5. **Commit u git → privatni repozitorij → Vercel.**

**Sadržaj:**
- pregled prijevoda kod izvornih govornika;
- bolje fotografije riba (polje `slika` u `species.yaml`);
- lokalni nazivi riba po regijama;
- puni popis 24 vrste za označavanje ulova;
- što je točno „trapula”.

**Tehnički:** provjera pristupačnosti.

## 9. Ažuriranje pravila

Vidi [docs/AZURIRANJE_PRAVILA.md](docs/AZURIRANJE_PRAVILA.md). Ukratko:
1. Novo pravilo se upiše s `vrijedi_od`, a staro dobije `vrijedi_do`.
2. Druga osoba provjeri promjenu prema NN, a testovi prođu.
3. Nakon objave se hash u `/api/rules` mijenja sam, pa mobilna aplikacija povuče novi paket.

## 10. Objava na Vercel

- **Pripremljeno:**
  - `data/imported` se sad šalje u git (bez toga bi sve bilo žuto);
  - u `next.config.ts` (`outputFileTracingIncludes`) uključeni su pravila i podaci u funkcije;
  - `vercel.json` postavlja regiju Frankfurt.
- **Postupak:** commit → push na privatni GitHub/GitLab → na Vercelu „Import Project”. Varijable okruženja nisu potrebne.
- **Licence:** besplatni Vercel Hobby i Open-Meteo dozvoljeni su samo za **nekomercijalnu** upotrebu. Za komercijalnu treba plaćeni plan.
- **Slike riba** se učitavaju izravno s Wikimedia Commons, pa baza slika nije potrebna.

## 11. Napomene za razvoj (Windows)

- **Git Bash ne vidi Node:** `export PATH="/c/Program Files/nodejs:$PATH"`.
- **Ugrađeni preglednik Claude aplikacije** gasi razvojni poslužitelj kad se zatvori; za samostalan rad pokreni `npm run dev` u svom terminalu.
- **Next.js u razvoju** prikazuje bezopasne greške mreže karte (prekinute pločice); karta ih sada sama tiho preskače.
- **Wikipedia API** vraća 429 kod prebrzih upita; skripte čekaju 1,5 s između upita.

## 12. Licence i pripisi u aplikaciji

- © OpenStreetMap contributors (karta, luke, plaže, trgovine)
- OpenFreeMap
- GeoNames (CC BY 4.0)
- Wikipedia/Wikimedia Commons (CC BY-SA)
- EMODnet Bathymetry
- Bioportal (MINGOR / ZZOP)
- Open-Meteo
