# Izvještaj testiranja – ribolov.vercel.app

Datum: 26. 11. 2026., oko 22 h. Testirano u Chromeu na produkciji (nova verzija), na računalu i u okviru 375 px, u svijetloj i tamnoj temi, na HR i EN. Kod nije mijenjan.

---

## Stanje popravaka (27. 11. 2026.)

Sve greške iz dijela A su popravljene (testovi u `tests/report_fixes.test.ts`, ukupno 59 testova), osim:
- **9 (Fistularia):** latinski naziv ostaje namjerno. Naziv „strijelka” nije potvrđen u stručnim izvorima (TODO.md), a vlasnikovo pravilo je da se nazivi ne izmišljaju.
- **13 (nazivi PL/CS/SL):** nekim vrstama nedostaju nazivi u `data/species/names*.json`. Treba ih dopuniti iz pouzdanog izvora.

Iz dijelova B i C napravljeno je ovo:
- rečenica za djecu do 14 godina na kartici dozvole;
- gumbi „Nazovi” i „Navigacija” te „nema telefona” kod trgovina i prodavača;
- QR kartica s nazivom mjesta, porukom na svih 7 jezika i čitljivom adresom;
- dvojezična OG slika.

**Dodatak (27. 11.) – prijedlozi iz B i C su napravljeni:**
- **Prva posjeta:** kartice za prvu posjetu („Prvi put…”, „Ribolov s djecom”) ispod dozvole, a kasnije sa strane ili dolje.
- **Raspored:**
  - red „Danas: najbolje h · vjetar · more”;
  - prognoza i idući dani u jednoj kartici s karticama „Danas / 3 dana”;
  - kratki gumb postavki („S obale ▾”);
  - uz zelenu presudu napomene umjesto „Upozorenja”.
- **Ribe danas:**
  - „Sad najbolje: … · mamci: …”;
  - bez lampuge kod ribolova s obale;
  - podnaslov bez ponavljanja, „bez mjere”, `aria-label` na karticama.
- **Podsjetnici:** u Osnovnom samo za ribe iz vodiča.
- **Ikone:** linijske ikone umjesto emojija.
- **Moj ulov:**
  - „Pustio sam je – dalje”;
  - slika „kako mjeriti”;
  - 14 dodatnih redova iz službene tablice mjera (špar, pic, pagar, srdela…).
- **Savjeti:**
  - sunce i voda ljeti, skidanje udice, čuvanje ribe;
  - hitni brojevi 112 i 195;
  - popis vrsta koje se označavaju;
  - poveznica na mRecFish.
- **QR:** veličine A4, A5 i naljepnica.
- **Bez interneta:** umjesto karte se prikazuje naziv mjesta.
- **Prozori:** fokus na gumbu „Zatvori”, Esc zatvara, fokus se vraća.
- **Tamni način:** tekst u crvenim i žutim okvirima (npr. kornjača) je čitljiv.
- **Recepti:**
  - vodič „Kako očistiti ribu”;
  - 6 recepata (orada, brancin, ušate, pic, girice, plavi rak – „Dobro za more”);
  - upozorenje „Napuhača: NE JESTI”;
  - „Kako je pripremiti” na kartici ribe;
  - polja za autora i poveznicu.

**Nije napravljeno:**
- poredak trgovina po radnom vremenu (OSM `opening_hours` treba pouzdan parser);
- objašnjenja pojmova „trapula” i „rampinavanje” (nisu potvrđena, TODO.md).

## A. Greške (od najvažnije prema manje važnoj)

### 1. 🔴 Upozorenje „Nepoznato pravilo: undefined” prikazuje se gotovo svugdje
- **Koraci:** otvori `/?lat=44.958&lon=14.104` (Koromačno) i klikni „Upozorenja (1)”.
- **Dobiveno:** „Nepoznato pravilo: undefined” (EN: „Unknown rule: undefined”). Komiža i Split dobiju to upozorenje 2 do 3 puta.
- **Uzrok (iz koda):** `data/imported/osm_otoci.geojson` ima 81 otok i **nijedan nema `rule_key`**, a `lib/zones/geojson.ts:110` ih učitava kao zone (`String(undefined)` postaje „undefined”). Zbog toga `lib/pin.ts:353` dodaje upozorenje za svaki otok u blizini.
- **Posljedica:** svaki zeleni semafor ima žuti broj upozorenja, a turist ne zna što ono znači. Tako se gubi povjerenje u aplikaciju.
- **Popravak:** sloj otoka ne učitavati kao zonu (koristi se samo za trgovine i trajekt) ili preskočiti značajke bez `rule_key`. Tehničke poruke nikada ne prikazivati korisniku.

### 2. 🔴 Točka na kopnu dobije zeleno „Nema poznatih zabrana”
- **Koraci:** `/api/pin?lat=44.96&lon=14.0&mode=brod` (unutrašnjost Cresa, 178 m n. m.).
- **Dobiveno:** semafor je zelen, a upozorenja kažu „Točka je 178 m iznad mora”.
- **Očekivano:** neutralno ili žuto „Odabrana točka je na kopnu – odaberi more”. Zelena boja ovdje laže.

### 3. 🟠 Podsjetnik „zalazak sunca za < 60 min” zanemaruje odabrani datum i sat
- U `lib/pin.ts:281` podsjetnik se računa samo ako je datum današnji i prema **stvarnom** satu.
- `date=2026-08-20&time=19:30` (zalazak u 20:04) ne daje nikakav podsjetnik. U dokumentu piše da „Vrijeme (sat)” utječe na podsjetnike.

### 4. 🟠 „Najbolje vrijeme danas: 13–15 h” prikazuje se i u 22 h
- Termin je već prošao. Bolje je napisati „Sutra najbolje: …” ili termin prekrižiti. Isto vrijedi za čipove 13:00–15:00 / 16:00–18:00 u Detaljnom prikazu.

### 5. 🟠 Proturječja u „Lovostaji, veličine i ograničenja”
- **Jegulja** ima najmanju mjeru 35 cm, a navedena je i među „Trajno zabranjenim vrstama”.
- **Plavoperajna tuna** ima mjeru „30 kg ili 115 cm”, a u trajno zabranjenima piše „(osim trofejnog ribolova)”. Turist ne zna smije li je zadržati.
- **Gof, kirnje…**: u redu, ali uz „Morski psi i raže: 0 komada” nije jasno da se 0 odnosi na zabranu.

### 6. 🟠 Datum na mobitelu (375 px) je odrezan
- U redu čipova „Rekreacijska · S obale · Osnovno | Danas, 26. 11. 2026.” datum se vidi samo kao „Dan…”. Datum i postavke treba prelomiti u dva reda ili skratiti tekst postavki.

### 7. 🟡 Telefoni prodavača dozvola su spojeni u jedan niz
- U tekstu se vidi „052 851 1000917881677” i „052 5769190917956926”. Linkovi (`tel:`) su ispravni, ali vizualno nema razmaka ni separatora. Za trgovine isto: „Pula+385 52554120na karti”.
- Adrese prodavača su VELIKIM SLOVIMA („RUDARSKA 7, LABIN”). Treba ih pretvoriti u normalna slova.

### 8. 🟡 Nedosljedno oblikovanje brojeva
- „99.54 €” i „13.27 €” (točka) u Detaljima dozvole, a „26,54 €” (zarez) u Priboru.
- Udaljenosti „3.1 km”, „1.4 km”, „0.4 m” na HR. Na hrvatskom, njemačkom, talijanskom, poljskom, češkom i slovenskom treba decimalni zarez (`Intl.NumberFormat`).

### 9. 🟡 Interni / nedovršeni tekstovi u sučelju
- U „Napomenama”: „Podaci o uzgajalištima nisu učitani…” je poruka za developera, a ne za turista. Bolje je napisati samo pravilo (300 m / 50 m).
- U popisu „Moj ulov”: „**Fistularia commersonii**” je latinski naziv umjesto hrvatskog („Strijelka”), iako je ključ `strijelka`.
- „Lokacija: Ribolovna zona: nepoznato · Podzona: nepoznato” ne pomaže. Ako je nepoznato, redak treba sakriti.

### 10. 🟡 Odbačeni parametri u URL-u
- `?…&date=2026-08-20&lang=en` se pri učitavanju makne iz adrese, a stranica se prikazuje za danas i na HR. Link na određeni dan ili jezik zato nije moguće podijeliti (npr. iznajmljivač koji šalje link Nijemcu).

### 11. 🟡 Album: nazivnik se mijenja
- U Koromačnu piše „0 od 18 vrsta”, u Komiži „1 od 19 vrsta”. Album bi trebao imati isti ukupni broj bez obzira na lokaciju.

### 12. 🟡 Unos „Moj ulov” prihvaća nemoguće vrijednosti
- Duljina −5 cm daje „Izmjeri je”, a 400 cm / 900 kg se prihvaća. Treba dodati `min`/`max` na polja i poruku „Provjeri upisanu duljinu”.
- Puštena (premala) riba ulazi u popis „ulova danas” s crvenom točkom. Bolje je odvojiti popis „Zadržano” od popisa „Pušteno”.

### 13. ⚪ Sitnice
- Smjer vjetra na HR je „S” (sjever). Strancu koji gleda HR verziju „S” izgleda kao jug. Strelica je dovoljna, a slovo može biti puna riječ („sjever”).
- Poredak u padajućem izborniku ribe: „Šarag, Škrpina, Skuša” – treba hrvatski poredak (`localeCompare('hr')`).
- Nazivi PL/CS/SL za neke vrste su ostali hrvatski („Škrpina”).
- OG slika je samo na hrvatskom i bez slike ribe ili ikone. Za strance koji dobiju link bolje je dvojezično.

### Provjereno i radi ✅
SSR presuda i naslov stranice („Koromačno: nema poznatih zabrana · Ribolov”), OG i Twitter oznake, `/og` (1200×630), `/qr` (link vodi na ribolov.vercel.app, dakle `NEXT_PUBLIC_SITE_URL` je postavljen), podvodni ribolov s rekreacijskom dozvolom daje crveno, podvodni noću daje crveno, luka u Splitu daje žuto, izvan mora RH dobiva ispravnu poruku. „Moj ulov”: premala riba, škrpina 20/30 cm, hobotnica (3. komad vraćen), 5 kg + jedna riba, napuhača („prijavi”), plavi rak (zadrži), periska, kornjača („Zovi 112”), raža žutulja (vrati), pauk (zadrži uz upozorenje). Tamna tema ima dobar kontrast. EN prijevod nema zaostalih hrvatskih riječi. Na 375 px stranica se ne lista vodoravno.

---

## B. Kroz oči korisnika

### Turist s djecom, prvi put u Hrvatskoj
- **Smijem li loviti?** Odgovor se vidi u 1 sekundi (veliki zeleni okvir). ✅ Ali odmah ispod stoji „Upozorenja (1)” s besmislenim tekstom (greška 1), a zatim podsjetnik „Rakovica: lovostaj završava”. Rakovica turista s obale ne zanima. Podsjetnike za vrste koje se ne love s obale ili u Osnovnom prikazu treba sakriti (kao što je napravljeno za lampugu).
- **Što moram napraviti?** Kartica „Trebaš dozvolu” je odlična. Nedostaje rečenica: **„Djeca do 14 godina s najlonom bez štapa – ne treba dozvola”** odmah na kartici dozvole, a ne skrivena pod „Detalji” i „Prvi put”. Za obitelj je to najvažnija informacija.
- **Mjera i lovostaj:** traka „Ribe danas” je jasna. Lampuga i palamida su ipak u traci za način „S obale”, iako se rijetko love s obale. To je šum za početnika.
- **„Prvi put loviš u Hrvatskoj?” i „Ribolov s djecom”** su na mobitelu **na samom dnu**, ispod prognoze, idućih dana i karte. Baš ta publika do njih neće doći. Prijedlog: za prvu posjetu ih stavi odmah ispod presude (zapamti u `localStorage` da su viđeni pa ih spusti).
- **Što s ribom kad je uhvatim?** Nema savjeta kako ubiti, očistiti ili čuvati ribu na hladnom. Za obitelj bi koristila i rečenica „kako sigurno skinuti udicu”.
- **Sigurnost:** nema ničega o vrućini, suncu i vodi za djecu ljeti, a ni broja 112 ili 195 (pomorska služba) na jednom mjestu.

### Ribič koji lovi nekoliko puta godišnje
- Prognoza i „Idući dani” su korisni. Subota (udari 69 km/h) je ispravno crvena. ✅
- Nedostaje **„Što danas na ovom mjestu”**: npr. „brancin – zora/sumrak, mamac: ...” odmah na glavnom ekranu. Sada to treba tražiti klikom na ribu.
- Popis vrsta u „Moj ulov” je kratak (18). Nedostaju česte vrste s obale: **špar, pic, knez, ušata je tu, ali nema ugora, sipe, crnelja, gavuna, ovčice, srdele, iglice**. Kad ribič ne nađe svoju ribu, ne može je upisati.
- Pojmovi bez objašnjenja: „Rampinavanje”, „Trapula”, „kuka”, „mRecFish” (za koju vrstu, gdje? link postoji u API-ju, ali u sučelju ga nema), „24 vrste se označavaju…” (koje?).

### Iznajmljivač
- QR kartica je dobra ideja i lijepo izgleda. Prijedlozi:
  - na kartici napisati **naziv mjesta** (Koromačno), ne samo QR;
  - dodati **PL, CS i SL** (veliki broj gostiju);
  - adresa ispod QR-a je presitna i siva, a ona je rezerva kad skeniranje ne radi;
  - dodati izbor veličine (A4 / A5 / naljepnica).

---

## C. Prijedlozi dizajnera (UI/UX)

1. **Hijerarhija iznad pregiba (mobitel):** presuda, zatim dozvola (s rečenicom za djecu), pa **jedan red „Danas: 13–15 h · vjetar 1 km/h · more 16°”**, pa Ribe danas. Aktivnost, prognoza i idući dani mogu u jednu karticu s karticama (tabovima) „Danas / 3 dana”.
2. **Zeleno ne smije imati „ali”.** Kad je presuda zelena, upozorenja neka budu neutralna (sivo-plava), a ne žuta traka unutar zelenog okvira. Broj u „Upozorenja (n)” neka se pojavi tek kad postoji stvarno upozorenje.
3. **Čipovi postavki:** „Rekreacijska · S obale · Osnovno” je teško razumjeti. Prijedlog: ikona i kratko „S obale ▾”, a dozvola i prikaz unutra. Datum kao poseban čip (vidi grešku 6).
4. **Kartice na mobitelu:** desni stupac s računala (karta, Prvi put, Djeca, Pravila) na mobitelu pada na kraj. Redoslijed treba definirati posebno za mobitel, a ne samo „stupac 2 ide dolje”.
5. **Ribe danas:** podnaslov je nekad lokalni naziv (brancin), a nekad latinski (Sarda sarda). Prijedlog: uvijek lokalni ili EN naziv, latinski samo u detalju. „Lubin (brancin)” s podnaslovom „brancin” se ponavlja. Ribe bez najmanje mjere neka imaju oznaku „bez mjere”, da ne izgleda kao da podatak nedostaje.
6. **Ikone i emoji:** miješaju se emoji (👋 👨‍👧 📒 🎣 💨 🌊) i linijske ikone. Bolje je izabrati jedan stil (linijske ikone) zbog dosljednosti i prikaza na Androidu.
7. **Brojke i jedinice:** uvesti jednu funkciju `fmt(n, unit, lang)` za €, km, m i °C s ispravnim decimalnim zarezom.
8. **Trgovine i prodavači:**
   - prikazati **gumbe „Nazovi” i „Navigacija”** umjesto teksta;
   - prvo onaj koji **sada radi** (OSM `opening_hours`);
   - ime u normalnim slovima;
   - ako nema telefona, napisati „nema telefona”, a ne prazno;
   - za otoke staviti oznaku trajekta s ikonom, a ne samo tekstom.
9. **Moj ulov:** nakon „Provjeri i dodaj” veliki okvir je dobar. Dodati veliki gumb **„Pusti i dalje”** koji ne sprema ribu u popis kad je presuda „vrati”, i slikovni prikaz „kako mjeriti” (od vrha glave do kraja repa).
10. **Pristupačnost:**
    - neki gumbi s karticama ribe nemaju kratko ime za čitač ekrana: cijela kartica se čita kao jedan dugi tekst, pa treba dodati `aria-label` „Lubin, 25 cm, sad grize”;
    - harmonike neka imaju `aria-expanded` (koriste `details`, što je u redu);
    - provjeriti fokus u dijalogu „Moj ulov” (nije testirano tipkovnicom).
11. **Offline poruka i karta:** karta bez mreže ne radi. Bolje je prikazati statičnu sliku zadnjeg mjesta nego prazan okvir.

---

## D. Što nije testirano
- Stvarni GPS (dopušteno / odbijeno), dodir na karti preko cijelog ekrana i „Odaberi ovu točku”.
- Offline način (service worker) i ispis QR-a (pregled ispisa).
- Tipkovnica, čitač ekrana i povećanje teksta 200 %.
- DE, IT, PL, CS i SL u sučelju (provjeren samo HR i EN).
- Spremljena mjesta, „Prijavi nalaz” i detalji svake zaštićene, invazivne i opasne vrste u sučelju (provjereno samo preko API-ja).
- Prava širina mobitela: prozor preglednika nije se mogao smanjiti, pa je 375 px provjereno u okviru (iframe) unutar stranice.
