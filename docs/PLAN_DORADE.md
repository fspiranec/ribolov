# Ribolov – plan dorade

Nov 26, 2026 · @Franjo

## Cilj i pozicioniranje

Ribolov je vodič za sigurno i odgovorno ribarenje na odmoru, namijenjen turistima i početnicima, a ne profesionalnim ribolovcima.

- **Glavna poruka:** "Lovi legalno, sigurno i bez kazne."
- **Ciljna skupina:** turisti na Jadranu, obitelji s djecom, ljudi koji love nekoliko puta godišnje.
- **Ton:** jednostavan jezik bez stručnih izraza, slike ispred teksta.
- **Tri boje svugdje:** zeleno = smiješ zadržati, žuto = vrati u more, crveno = opasno ili zabranjeno.

## Način prikaza: Osnovno i Detaljno

U gumbu na vrhu (uz "Rekreacijska · S obale") dodati izbor prikaza. Zadano je **Osnovno**, a izbor se pamti na uređaju.

| Sadržaj | Osnovno | Detaljno |
| --- | --- | --- |
| Status (smiješ ili ne) | da | da |
| Dozvola i kupnja | da | da |
| Moj ulov (smiješ li zadržati) | da | da |
| Ribe danas sa slikama i min. veličinom | da | da |
| Zaštićene, invazivne i opasne vrste | da | da |
| Jednostavna poruka: "Danas dobar dan, najbolje 13–15 h" | da | da |
| Graf aktivnosti (solunarno, mjesec) | sažetak u jednoj rečenici | puni graf |
| Dubina | s objašnjenjem što znači | da |
| Detaljna prognoza (udari, period valova, mjesec) | osnovno | sve |
| Lovostaji | samo vrste koje se love s obale | sve vrste, uključ. tunu |

- Nazivi su "Osnovno" i "Detaljno", a ne "Početnik" i "Profi", jer se bira količina informacija, a ne razina znanja.
- Pravila i upozorenja (zaštićene vrste, napuhača, zabranjene zone) jednaka su u oba načina i nikad se ne skrivaju.

## Ispravci na postojećem ekranu

Primjer lokacije: Koromačno (44.958, 14.104), snimke od 26. 11.

1. **Status je preglasan.** Veliki zeleni "Smije se loviti" ne odgovara tekstu ispod ("nema poznatih prostornih zabrana"). Blaži naslov tipa "Nema poznatih zabrana", uz izvor i datum zadnjeg ažuriranja. U Koromačnu je cementara s industrijskom lukom, pa provjeriti je li ta zona u bazi.
2. **Vjetar si proturječi.** Prognoza za 20:00 kaže 7 km/h (udari 15), a kartica "Danas" 30 km/h. Označiti što je dnevni maksimum.
3. **Bug u bojama.** Legenda: crveno = udari > 50 km/h ili valovi > 2 m. U subotu su valovi 1,1 m, a ipak su crveni. Bojati svaku vrijednost zasebno.
4. **Kontrast.** Broj u krugu aktivnosti (48) gotovo se ne vidi.
5. **Graf aktivnosti** ostaje, ali uz njega jedna rečenica: "Najbolje vrijeme danas: 13–15 h".
6. **Dubina** ostaje, ali s objašnjenjem što znači za lov s obale. Napisati je li to dubina odabrane točke ili uz obalu.
7. **Obavijesti filtrirati po tipu ribolova.** Lovostaj tune nije za turista koji lovi s obale, a "opet se smije loviti" može zavarati jer rekreacijski lov tune ima posebna pravila.
8. **Redoslijed sekcija:** status, dozvola, moj ulov, ribe danas, vrste (zaštićene/invazivne/opasne), aktivnost, prognoza, idući dani, karta.
9. **Sitnice:** naziv lokacije je odrezan ("1,8 km od centra mje…"); "izbočeni mjesec koji pada" zvuči kao doslovan prijevod.

## Nove sekcije: vrste i ponašanje

Svaka vrsta ima veliku fotografiju, jednu rečenicu i jasnu poruku "što učiniti". Za početak 10–15 najvažnijih vrsta; popis provjeriti prema službenim propisima, ne prema člancima.

| Kategorija | Poruka | Primjeri |
| --- | --- | --- |
| Zaštićene vrste (crveno) | Ne diraj, vrati u more | periska, morski datulj, morske kornjače, dupini, neki morski psi i raže |
| Invazivne vrste (crveno/žuto) | Ne vraćaj, prijavi | plavi rak (ponesi i pojedi, uz recept), napuhače (otrovne, nikako ne jesti), riba lav ili vatrenjača (otrovne bodlje), strijelka |
| Opasne domaće vrste (žuto) | Pazi kod skidanja s udice | pauk, škrpina, raža žutulja |

- **Povezati s "Moj ulov":** kad netko upiše napuhaču ili zaštićenu vrstu, prikazati veliko crveno upozorenje, a ne samo "smiješ li je zadržati".
- **Prva pomoć kod uboda** za pauka, škrpinu i ribu lav.
- **Gumb "Prijavi nalaz"** (fotografija + lokacija) za invazivne vrste, kao podrška znanstvenom praćenju.
- **Periska za kupače i ronioce:** nije suvenir, branje se kažnjava.
- **Ribolov s djecom:** sigurnost, što se može uloviti udicom i kruhom, kako nježno pustiti ribu; "album" ulovljenih vrsta kao mala igra.
- **Ponašanje:** ne ostavljati najlon i udice na stijenama, ne loviti među kupačima, kako pustiti ribu da preživi.

## Tehnički dio

- **Linkovi s lokacijom** (npr. `?lat=44.95808&lon=14.10406`) moraju odmah prikazati rezultat, i to već na serveru (SSR). Danas se bez JavaScripta vidi samo početni ekran.
- **Pregled linka** (Open Graph) s lokacijom i statusom, npr. "Koromačno: nema poznatih zabrana", za WhatsApp i društvene mreže.
- **QR kodovi** za iznajmljače, koji vode na link s lokacijom njihove kuće.
- **Izvori podataka** vidljivi u aplikaciji: odakle su zone zabrana, lovostaji i minimalne veličine te datum zadnjeg ažuriranja.
- **Offline način rada** za lov na stijenama bez signala.
- **Pristupačnost:** alt tekst na logu i slikama riba, godina uz datum.

## Partneri i distribucija

Turist neće sam tražiti aplikaciju, pa korisnici dolaze preko partnera, a najrealniji novac preko institucija.

| Partner | Što dobiva | Što ti dobivaš |
| --- | --- | --- |
| Iznajmljači apartmana, kampovi | uslugu za goste, QR kod u apartmanu | korisnike |
| Turističke zajednice | educirane, zadovoljne goste | promociju, moguće plaćanje kao usluge |
| IRB (projekt ALIENA, praćenje stranih vrsta) | prijave nalaza invazivnih vrsta | kredibilitet, stručnu podršku |
| Udruge za zaštitu mora | edukaciju o zaštićenim vrstama | sadržaj, kredibilitet |
| Ribolovne trgovine, izleti brodom | kupce | proviziju ili preporuke |

**Test za ljeto 2027:** jedno mjesto, 5–10 iznajmljača s QR kodom. Mjeriti koliko ljudi skenira kod i koristi aplikaciju.

## Redoslijed rada

- [ ] Zone zabrana (luke, plaže, parkovi) s izvorom i datumom ažuriranja; blaži status
- [ ] Brzi popravci: vjetar, bug u bojama, kontrast broja, odrezan naziv, prijevod mjeseca
- [ ] Izbor prikaza Osnovno / Detaljno i novi redoslijed sekcija
- [ ] Vrste: zaštićene, invazivne, opasne (10–15 vrsta), povezano s "Moj ulov"
- [ ] Linkovi s lokacijom na serveru, pregled linka, QR kodovi
- [ ] Ribolov s djecom i pravila ponašanja
- [ ] Kontakt s IRB-om i turističkom zajednicom jednog mjesta
- [ ] Offline način rada
