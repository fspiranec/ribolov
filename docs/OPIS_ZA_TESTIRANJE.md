# Ribolov – što aplikacija radi (upute za testiranje)

Stanje: 26. 11. 2026. Ovaj dokument je za agenta (ili čovjeka) koji testira web aplikaciju i daje prijedloge. Opisuje sve što aplikacija radi, kako je pokrenuti, što provjeriti i što je poznato da još ne radi.

## Tvoj zadatak

1. Pokreni aplikaciju i prođi kroz **sve** funkcije ispod, na **mobitelu (375 px)** i na **računalu**, u **svijetloj i tamnoj** temi i barem na **dva jezika** (HR i jedan strani).
2. Zapiši **greške** (koraci, očekivano, dobiveno, snimka zaslona ako može) i **prijedloge** (jasnoća za turista, redoslijed, tekstovi, dizajn, pristupačnost).
3. **Ne mijenjaj kod** bez dogovora. Na kraju vrati izvještaj s greškama poredanim po važnosti, pa prijedloge.

Za koga je aplikacija: **turisti i početnici** na hrvatskom Jadranu, obitelji s djecom, ljudi koji love nekoliko puta godišnje. Ton je jednostavan, slike idu ispred teksta. Vlasnikove odluke koje se ne mijenjaju bez pitanja su u [HANDOVER.md §5](../HANDOVER.md). Najvažnije:
- sadržaj je ispred karte;
- u sučelju **nema** poveznica na Narodne novine ni oznaka „TODO”;
- ništa se ne izmišlja (pravila, geometrije, nazivi);
- uz savjete se uvijek stavlja ograda da nisu službeni, a uz prvu pomoć da nije liječnički savjet.

## Pokretanje

Treba Node.js 20+ (na Windowsu je Node u `C:\Program Files\nodejs`).

```
npm install
npm run dev        # http://localhost:3000
npm test           # 49 testova, svi moraju proći
npm run build && npm start   # produkcija (samo tu radi service worker / offline)
```

- Promjene u `rules/*.yaml` i `data/**` vide se tek nakon ponovnog pokretanja poslužitelja.
- Baza (PostGIS) **nije** potrebna.

**Testne lokacije** (upiši u adresu):

| Mjesto | URL | Očekivano |
|---|---|---|
| Koromačno (Istra, cementara) | `/?lat=44.958&lon=14.104` | zeleno „Nema poznatih zabrana” |
| Komiža (Vis) | `/?lat=43.0446&lon=16.0836` | zeleno ili žuto ovisno o točki |
| Točka u luci / na plaži | odaberi na karti unutar luke ili plaže | žuto ili crveno s razlogom |
| Izvan hrvatskog mora | `/?lat=45.5&lon=13.0` | poruka da točka nije u ribolovnom moru RH |
| Bez lokacije | `/` | traži GPS ili izbor na karti |

## Glavni ekran – redoslijed i sadržaj

Zaglavlje: logo, gumb svijetla/tamna tema, izbor jezika (HR, EN, DE, IT, PL, CS, SL), naziv mjesta s udaljenošću od centra te gumbi:
- spremi mjesto (zvjezdica);
- moja lokacija (GPS);
- karta.

Ispod zaglavlja su gumb s postavkama (npr. „Rekreacijska · S obale · Osnovno”), datum (može se mijenjati) i spremljena mjesta.

Kartice idu ovim redom (na računalu je desni stupac sa strane, a na mobitelu ide na kraj):

1. **Presuda (semafor):**
   - zeleno „Nema poznatih zabrana”, žuto „Oprez…” ili crveno „Zabranjeno”, s razlogom;
   - izvori podataka o zonama s datumom i „pravila provjerena …”;
   - upozorenja, ako ih ima.
2. **Podsjetnici:** zalazak sunca za manje od 60 min, lovostaj počinje ili završava unutar 7 dana. Za način „S obale” ne pokazuju se vrste koje se ne love s obale (npr. lampuga).
3. **Dozvola:**
   - cijene 1/3/7 dana i gumb „Kupi dozvolu online”;
   - pod „Detalji” su ostale cijene, posebne dozvole, djeca i najbliži prodavači s telefonima.
4. **Moj ulov danas:** sažetak (broj zadržanih, kg od 5 kg) i gumb „Dodaj” (vidi niže).
5. **Ribe danas:**
   - vodoravna traka riba sa slikom, oznakom („sad grize”, „sezona”, „U lovostaju”) i minimalnom veličinom;
   - „Sve ribe →” otvara popis s pretragom, a klik na ribu otvara detalje (prepoznavanje, smiješ li je zadržati, udica, mamci, tehnika, kada, gdje).
6. **Zaštićene, invazivne i opasne vrste:**
   - kartice „Zaštićene / Invazivne / Opasne”, u svakoj mreža vrsta sa slikom i porukom „što učiniti”;
   - klik otvara detalj: velika slika, rečenica, „Što učiniti”, prva pomoć (kod uboda), gumb „Prijavi nalaz” (invazivne);
   - ograde: savjeti su neslužbeni, prva pomoć nije liječnički savjet.
7. **Aktivnost riba:**
   - Osnovno: jedna rečenica „Najbolje vrijeme danas: 13–15 h”;
   - Detaljno: krug s ocjenom, ista rečenica, termini, graf po satima, glavni i sporedni periodi.
8. **Prognoza:**
   - vjetar, valovi, more/zrak, dubina, sunce; u Detaljnom još udari, period valova i mjesec;
   - ispod je objašnjenje dubine (dubina točke, ne obale; na kopnu: odaberi more);
   - u Osnovnom postoji gumb „Prikaži detaljno”.
9. **Idući dani:** danas, sutra i prekosutra s ocjenom te najjačim udarima i valovima. Crveno se boji posebno za svaku vrijednost (udari > 50 km/h, valovi > 2 m), a najbolji miran dan je istaknut.
10. **Karta (mala):** klik otvara kartu preko cijelog ekrana; dodirom se bira točka, a „Odaberi ovu točku” je postavlja.
11. **Prvi put loviš u Hrvatskoj?:** 5 savjeta i ograda.
12. **Ribolov s djecom i pravila ponašanja:** 6 savjeta, ograda i gumb **„Moj album riba”**.
13. **Pravila za ovo mjesto** (harmonika):
    - pribor (što smiješ, što traži posebnu dozvolu, što ne smiješ);
    - lovostaji, veličine i ograničenja (u Osnovnom samo lovostaji vrsta koje se love s obale);
    - lokacija (zona, područja, Natura 2000, udaljenost luke i plaže);
    - napomene;
    - ribolovni pribor u blizini.
14. **Podnožje:** odricanje odgovornosti i „provjereno” s datumom.

## Postavke (gumb s postavkama)

- **Prikaz:** Osnovno (zadano) / Detaljno. Pamti se na uređaju (`localStorage` `ribolov:prikaz`). Upozorenja i zabrane vide se u oba načina.
- **Dozvola:** Rekreacijska / Sportska.
- **Način:** S obale / S broda / Podvodni (podvodni samo uz sportsku dozvolu i danju).
- **Posebne dozvole:** parangal, vrše, osti, rasvjeta, velika riba (mijenja popis pribora).
- **Vrijeme** (sat), koje utječe na podsjetnike i podvodni ribolov.
- **QR kod za ovo mjesto:** otvara `/qr`.

## „Moj ulov”

- Biraš ribu (ili vrstu iz skupine „Zaštićene, invazivne i opasne vrste”), upisuješ duljinu (cm) i masu (kg) pa „Provjeri i dodaj”.
- Odgovor (veliki okvir) je jedan od ovih:
  - **zadrži** (zeleno);
  - **vrati** (crveno: premala, lovostaj, previše komada, limit 5 kg);
  - **izmjeri / izvaži** (žuto);
  - **ne vraćaj u more** (invazivne vrste: crveno ili žuto upozorenje, „što učiniti”, prva pomoć gdje treba, „Prijavi nalaz”);
  - za **zaštićene** vrste (periska, kornjača…) crveno upozorenje. Za kornjaču je to „Zovi 112”.
- Prati se dnevni limit od 5 kg (plus jedna riba koja ga prelazi).
- Napomene: označavanje ulova (rez na repu, kod glavonožaca između očiju), mRecFish (lampuga).
- Sve se sprema samo na uređaju (`ribolov:ulov:<datum>`), a provjera ide na `POST /api/catch`.
- Svaka upisana vrsta ulazi u **album** (`ribolov:album`) s datumom prvog ulova.

## Recepti

- Kartica „Iz mora u tavu – recepti” (sa strane / dolje) i poveznica „Kako je pripremiti” na karticama u „Ribe danas”.
- U prozoru je ovaj redoslijed:
  1. veliko upozorenje „Napuhača: NE JESTI – otrovna!”;
  2. vodič „Kako očistiti ribu”;
  3. 6 recepata, svaki s najviše 6 sastojaka, koracima, vremenom i jednom rečenicom priče.
- Plavi rak je istaknut kao „Dobro za more”. Recept može imati autora (npr. konobu) i poveznicu.

## Ostale stranice i API

| Put | Što radi |
|---|---|
| `/?lat=&lon=` | stranica se **renderira na serveru** s gotovom presudom (radi i bez JavaScripta) |
| naslov / Open Graph | npr. „Koromačno: nema poznatih zabrana · Ribolov”, slika `/og?lat=&lon=` |
| `/og?lat=&lon=` | PNG 1200×630 za pregled linka (WhatsApp, društvene mreže) |
| `/qr?lat=&lon=&naziv=&lang=` | kartica s QR kodom za iznajmljivače: polje za naziv, poruka na HR/EN/DE/IT, gumb „Isprintaj” |
| `GET /api/pin` | sva logika za lokaciju (parametri: `lat, lon, date, time, permit, mode`) |
| `GET /api/species?date=&hour=` | vodič kroz ribe + `posebne` (zaštićene/invazivne/opasne) |
| `POST /api/catch` | provjera ulova |
| `GET /api/rules` | paket pravila s verzijom (za buduću mobilnu aplikaciju) |

## Offline (samo `npm run build && npm start`)

- Service worker (`public/sw.js`) čuva stranice, `/api/species` i `/api/pin` (zadnji odgovor) te slike riba.
- Bez mreže se prikazuje zadnji odgovor i traka „Bez interneta – prikazujem zadnje spremljene podatke”.
- „Moj ulov” (POST) bez mreže **ne radi**. Karta bez mreže ne radi.

## Pristupačnost i jezici

- Alt tekstovi na logu i slikama, `role="dialog"` na prozorima, natpisi gumba prevedeni, `lang` na `<html>` prati odabrani jezik.
- Svi tekstovi postoje na 7 jezika. Prijevode nije pregledao izvorni govornik.
- Datumi se prikazuju s godinom.

## Poznata ograničenja (ne prijavljuj kao novu grešku, ali možeš predložiti rješenje)

- Pravna točnost pravila nije provjerena (članci su „TODO” u podacima, ne u sučelju).
- Neke geometrije su približne (granica mora, posebna staništa); zato aplikacija radije daje žuto.
- Popis zaštićenih, invazivnih i opasnih vrsta te poruke čekaju službenu provjeru (vidi `TODO.md`). Gumb „Prijavi nalaz” zasad vodi na stranicu projekta ALIENA (IRB).
- **Trgovine:**
  - podaci su iz OSM-a (ribolovne trgovine, Decathlon, „lov i ribolov”), a nekima nedostaju adresa i telefon;
  - prednost imaju trgovine na istom otoku ili kopnu; one preko mora imaju oznaku „na otoku X – treba trajekt ili brod”;
  - otoci s mostom (Krk, Pag, Čiovo, Murter, Vir) računaju se kao kopno;
  - isto vrijedi za prodavače dozvola.
- Vodoravna traka „Ribe danas” na računalu se lista samo Shift + kotačićem ili gumbom „Sve ribe”.
- U razvoju (`npm run dev`) karta ponekad javlja bezopasne 404 greške za pločice.
- Na Vercelu još treba postaviti `NEXT_PUBLIC_SITE_URL`, inače linkovi u pregledu i QR-u pokazuju na localhost.

## Kontrolni popis za testiranje

- [ ] Prva posjeta bez lokacije: GPS dopušten i odbijen, izbor na karti.
- [ ] Link s lokacijom: presuda se vidi odmah; isprobaj i s isključenim JavaScriptom.
- [ ] Pregled linka (naslov, opis, slika) – npr. alatom za Open Graph pregled.
- [ ] Osnovno ↔ Detaljno: što se mijenja i pamti li se nakon osvježavanja.
- [ ] Sva tri načina (obala, brod, podvodni) i obje dozvole: mijenjaju li se pribor, podsjetnici i presuda smisleno.
- [ ] Promjena datuma (npr. 1. 7. i 20. 8.): lovostaji, oznake riba i podsjetnici.
- [ ] Moj ulov:
  - premala riba, riba u lovostaju, hobotnica (najviše 2 komada, 1 kg), prelazak 5 kg;
  - napuhača (crveno, „ne jedi”, prijavi), plavi rak (smije se zadržati), periska, kornjača („zovi 112”), pauk, škrpina ispod i iznad 25 cm, raža žutulja.
- [ ] Trgovine i prodavači dozvola: na kopnu (Koromačno), na otoku (npr. Cres, Hvar) i na otoku s mostom (Krk) – je li prva preporuka stvarno najbliža do koje se može doći.
- [ ] Album: upiši nekoliko vrsta pa otvori „Moj album riba”.
- [ ] Zaštićene/invazivne/opasne: sve tri kartice, svaki detalj, prva pomoć i ograde, „Prijavi nalaz”.
- [ ] QR stranica: naziv, ispis (pregled ispisa), skeniranje mobitelom vodi na pravu lokaciju.
- [ ] Spremljena mjesta: dodaj, otvori, ukloni.
- [ ] Svih 7 jezika: ima li neprevedenog ili odrezanog teksta.
- [ ] Tamna tema: kontrast (posebno brojke, oznake i žute kartice).
- [ ] Mobitel 375 px: nema vodoravnog listanja stranice; tekst ne izlazi iz kartica.
- [ ] Offline u produkciji (DevTools → Network → Offline): zadnji odgovor i traka.
- [ ] Pristupačnost: tipkovnica (Tab), čitač ekrana, povećani tekst (200 %).
- [ ] Brzina: prvo učitavanje i promjena lokacije.

## Na što posebno dati prijedloge

- Razumije li turist u 5 sekundi **smije li loviti i što mora napraviti** (dozvola, mjera, lovostaj)?
- Je li redoslijed kartica dobar za nekoga tko stoji na obali s mobitelom?
- Jesu li tekstovi jednostavni (bez pravnog jezika) i dosljedni na svim jezicima?
- Što nedostaje obitelji s djecom ili iznajmljivaču?
- Kako bolje preporučiti najbližu trgovinu i prodavača dozvola?
