# TODO – što još moramo odraditi

Ovdje su sve otvorene stavke na jednom mjestu. U aplikaciji se ne prikazuju: korisnik vidi samo odgovor.
U podacima su takve stavke označene s `TODO` ili `needs_legal_check: true`; `grep -rn TODO rules data` ih sve izlista.

## Prioritet 1 – prije javne objave / prezentacije ministarstvu
- [ ] Pravna provjera svih pravila (`rules/*.yaml`): povezati članke (sada `clanak: "TODO"`) i izravne poveznice na NN.
- [ ] Službena granica ribolovnog mora RH (sada grubi poligon `hr_more`).
- [ ] Prava geometrija za uvalu Šćuza, 13 posebnih staništa i područja posebne regulacije (sada približni pravokutnici).
- [ ] Popis dopuštenih alata po području posebne regulacije.
- [ ] Uzgajališta (podaci Ministarstva ili županija) i ribolovne zone/podzone (SHP od Uprave ribarstva).
- [ ] Javna web adresa (hosting) umjesto localhosta.
- [ ] Postupak ažuriranja pravila: vidi [docs/AZURIRANJE_PRAVILA.md](docs/AZURIRANJE_PRAVILA.md), uključujući alarm za nove propise u NN.

## Prioritet 2 – sadržaj
- [x] Prijevod tekstova pravila, savjeta i sučelja na DE, IT, PL, CS, SL (locales/*.json; test `tests/i18n.test.ts` javlja svaki tekst bez prijevoda).
- [ ] Prijevode neka pregleda izvorni govornik svakog jezika (posebno nazive riba na PL, CS, SL; gdje nema pouzdanog naziva, prikazuje se hrvatski).
- [ ] Ručno odabrati najbolju fotografiju svake ribe (polje `slika` u `data/species/species.yaml`) i navesti autore.
- [ ] Lokalni nazivi riba po regijama (Istra, Kvarner, Dalmacija); za većinu vrsta prazno.
- [ ] Engleski nazivi vrsta „okan” i „batoglavac” u `rules/min_sizes.yaml`.
- [ ] Puni popis 24 vrste za označavanje ulova (Prilog 3 NN 48/2026).
- [ ] Natura 2000 (nije na Bioportal WFS-u; drugi izvor).

## Detaljni popis (iz prve verzije)

### Geometrije
- [ ] **Granica ribolovnog mora RH** (`hr_more`) je grubi poligon. Treba službena granica (teritorijalno more i isključivi gospodarski pojas).
- [ ] **Uvala Šćuza** (posebni ihtiološki rezervat): placeholder. Digitalizirati iz NN 125/2020 i karata na ribarstvo.hr.
- [ ] **13 posebnih staništa** (ušća Dragonje, Mirne, Zrmanje, Guduće, Jadra, Žrnovnice, Cetine i Neretve; Pantan, Klimno, Pirovački zaljev, Morinje i Jadrtovac, Rijeka dubrovačka): placeholder kvadrati od oko 1,2 km.
- [ ] **Područja posebne regulacije** (Velebitski kanal, Novigradsko i Karinsko more, Prokljansko jezero, Marinski zaljev, Neretvanski kanal, ušće Raše): placeholder pravokutnici.
- [ ] **PP Telašćica, obalni pojas** (zabrana od 1. 5. do 1. 10.): geometrija ne postoji, pa pravilo za sada ne može okinuti.
- [ ] **Uzgajališta**: `data/manual/uzgajalista.geojson` je prazan. Podaci se traže od Ministarstva poljoprivrede ili županija.
- [ ] **Ribolovne zone i podzone**: SHP se traži od Uprave ribarstva i ide u `data/manual/ribolovne_zone.shp`.
- [ ] **Natura 2000** nije na Bioportal WFS-u. Treba naći drugi izvor (EEA ili ENVI).
- [ ] **NP, PP i rezervati**: do uvoza s Bioportala vrijede placeholder pravokutnici. Provjeriti klasifikaciju po nazivu u `bioportal.config.json`.
- [ ] **Upravljačke zone** (`^1A|^1B|zabrana ribolova` → crveno): provjeriti zabranjuju li 1A i 1B ribolov u svakom parku (`needs_legal_check: true`).

### Pravila
- [ ] **Članci**: gotovo svi su `TODO`. Povezati s NN 48/2026, NN 64/23 i 134/24, NN 125/2020 i Zakonom (NN 62/17…14/24).
- [ ] **URL-ovi**: svi vode na naslovnicu NN. Treba izravne poveznice.
- [ ] **`vrijedi_od`**: Zakon (2017-07-08), NN 125/2020 i NN 64/23 su pretpostavke koje treba provjeriti.
- [ ] **Označavanje ulova**: puni popis od 24 vrste iz Priloga 3 NN 48/2026 (`general.yaml`, `vrste_djelomicno`).
- [ ] **`needs_legal_check`** u `areas.yaml`:
  - `luka`: zabrana, osim dijelova koje dopusti lučka uprava;
  - `plaza`: zabrana od 1. 5. do 1. 10. i doseg zabrane u moru (sada 100 m od poligona plaže daje žuto);
  - `posebno_staniste`: mapiranje „povrazi” → odmet, kančenica, povraz za glavonošce;
  - `posebna_regulacija`: popis dopuštenih alata po području;
  - `hr_more`.
- [ ] **`needs_legal_check`** u ostalim datotekama:
  - lovostaji (`closed_seasons.yaml`): članci nisu povezani;
  - tolerancija od 20 % mase (`min_sizes.yaml`): **ne primjenjuje se** u aplikaciji;
  - strogo zaštićene vrste (`prohibited.yaml`): NN brojevi;
  - označavanje (`general.yaml`).
- [ ] **Engleski nazivi vrsta** „okan” i „batoglavac” nisu prevedeni.
- [ ] **Doseg zabrane uz luke** iz OSM-a: luka zadana točkom daje žuto unutar 150 m. Provjeriti je li to razumno.

### Prijevodi (obavezno prije objave za turiste)
- [ ] Prevesti tekstove pravila (`rules/*.yaml`) i savjete iz vodiča (`data/species/species.yaml`) na DE, IT, PL, CS i SL. Sučelje je već prevedeno, a sadržaj se na tim jezicima zasad prikazuje na engleskom.

### Zaštićene, invazivne i opasne vrste (`data/species/special.yaml`, plan dorade korak 4)
- [ ] Provjeriti popis i poruke prema službenim izvorima (Pravilnik o strogo zaštićenim vrstama, Pravilnik o sportskom i rekreacijskom ribolovu, IZOR, IRB). Sve stavke imaju `needs_check: true` osim škrpine.
- [x] Provjera 26. 11. 2026. (NN 48/2026, HAOP, IZOR, DAN/MedlinePlus): uklonjeno „ne vraćaj u more” za invazivne vrste (nije službeno; sad „fotografiraj i prijavi”), plavi rak se smije zadržati, uklonjeno „kažnjava se” (periska) i „zabranjeno jelo u restoranu” (prstac), prva pomoć dopunjena (najviše 45 °C, oprez kod djece, duboku bodlju ne vaditi, tetanus).
- [ ] Hrvatski naziv za *Fistularia commersonii* nije potvrđen – zasad se prikazuje latinski naziv. „Riba lav” (*Pterois miles*) se koristi u medijima, službeni naziv nije potvrđen.
- [ ] Prijava nalaza invazivnih vrsta: IZOR Split (laboratorij za ihtiologiju) traži prijave; kontakti iz novinskih članaka (dulcic@izor.hr, 021/408 013) nisu potvrđeni na izor.hr. Kad se potvrdi, gumb „Prijavi nalaz” preusmjeriti na IZOR.
- [ ] Minimalna veličina škrpine (25 cm) – provjeriti u Pravilniku o zaštiti riba i drugih morskih organizama.
- [ ] Vrste iz Tablice 1 NN 48/2026 (plavi rak, napuhača, riba lav…) imaju obvezu dnevne evidencije ulova – razmotriti napomenu u „Moj ulov”.
- [x] Kornjača na udici: tekst usklađen sa shemom prve pomoći HAOP-a (zovi 112, ne vadi udicu, prereži najlon blizu usta, drži je u hladu do veterinara). 112 je službeni kanal i za kornjače i za morske sisavce (HAOP protokol).
- [ ] Shema HAOP-a navodi i ovlaštene veterinare po područjima (Pula, Rijeka, Lošinj, Zadar…), ali je iz ~2018.; ako se žele prikazati brojevi, provjeriti jesu li aktualni.
- [ ] Gumb „Prijavi nalaz” vodi na IRB-ovu stranicu projekta ALIENA; službeni kanal za prijavu nalaza nije pronađen. Dogovoriti s IRB-om (korak 7).
- [ ] Prvu pomoć kod uboda neka pregleda liječnik. U sučelju uz nju stoji ograda da nije liječnički savjet.
- [ ] Nazivi vrsta na DE/IT/PL/CS/SL upisani su ručno u `special.yaml`; provjeriti.

### Tehnički
- [ ] Format odgovora EMODnet REST `depth_sample` je pretpostavljen (`avg`/`mean`); radi u testu.
- [ ] Coverage ID za EMODnet WCS (`emodnet__mean`) nije potvrđen.
- [ ] Ikone za PWA: zasad postoji samo SVG. Za Android trebaju PNG 192 i 512.
- [ ] Vlastiti izvor kartografskih pločica za produkciju.

## Prioritet 3 – ideje za poboljšanje
- [x] „Moj ulov” pomoćnik: unesi vrstu i duljinu i aplikacija kaže smiješ li je zadržati, broji kg prema dnevnom limitu od 5 kg i podsjeti na mRecFish (lampuga).
- [x] Gumb „Prijavi ulov u mRecFish” s uputom za turiste (obveza od 2027. za kratke dozvole).
- [x] Podsjetnici: „Za 30 min zalazak – podvodni ribolov završava”, „Sutra počinje lovostaj za …”.
- [x] Prognoza za idućih 3 dana (najbolji dan za ribolov).
- [x] Spremljena mjesta (omiljene pozicije), bez prijave.
- [x] Tamni način rada (prati postavku uređaja, gumb sunce/mjesec u zaglavlju).
- [ ] Provjera pristupačnosti (čitači ekrana, veličina teksta).
- [ ] Objašnjenje alata „trapula” za turiste (nije potvrđeno što točno jest; u aplikaciji je zasad samo naziv).
