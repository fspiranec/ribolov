# Kako se ažuriraju pravila (zakoni, pravilnici)

Pravila nisu u kodu nego u podacima (`/rules/*.yaml`). Kad se propis promijeni, mijenja se YAML datoteka, a ne aplikacija. Zato web i mobilna aplikacija dobiju novo pravilo bez nove verzije u trgovini aplikacija.

## Tok jedne promjene

1. **Otkrivanje promjene.** Tko prati Narodne novine (sada ručno, kasnije alarm, vidi dolje) uoči novi ili izmijenjeni pravilnik o ribolovu, lovostajima, zaštićenim područjima ili cijenama dozvola.
2. **Unos unaprijed.** Novo pravilo se upisuje s datumom `vrijedi_od`, a staro dobiva `vrijedi_do`. Pravilo se može unijeti tjedan dana prije nego stupi na snagu: aplikacija ga sama počne primjenjivati na taj dan, jer svaki upit ima datum.
   ```yaml
   # staro
   - { key: kavala, ..., razdoblja: [{ od: "05-15", do: "07-15" }], vrijedi_do: 2027-05-31 }
   # novo
   - { key: kavala, ..., razdoblja: [{ od: "05-01", do: "07-31" }], vrijedi_od: 2027-06-01, izvor: "Pravilnik ... (NN xx/2027)", clanak: "čl. 12" }
   ```
3. **Provjera.** Promjena ide kao pull request. Drugi čovjek (idealno netko iz ribarstva ili pravnik) usporedi je s tekstom u NN i postavi `zadnja_provjera` na datum provjere.
4. **Testovi.** `npm test` pokreće zlatni skup točaka. Ako se pravilo promijeni namjerno, ažurira se i očekivani rezultat u `tests/golden_points.json`, pa je promjena vidljiva u pregledu.
5. **Objava.** Spajanje u glavnu granu objavljuje novu verziju poslužitelja. Hash pravila se mijenja sam od sebe.

## Kako to dobiva mobilna aplikacija

- `GET /api/pin` i dalje računa sve na poslužitelju, pa je online odgovor uvijek po zadnjim pravilima.
- **Za rad bez signala na moru** aplikacija čuva kopiju pravila:
  - pri pokretanju pozove `GET /api/rules?samo=verzija` (vrlo mali odgovor);
  - ako se verzija razlikuje od spremljene, preuzme `GET /api/rules` (cijeli paket s ETagom; ako se ništa nije promijenilo, odgovor je `304` bez podataka);
  - offline koristi istu logiku nad spremljenim paketom (zato je logika u `lib/pin.ts` čista funkcija).
- U aplikaciji se prikazuje samo „Pravila ažurirana: 26. 11. 2026.”, bez brojeva NN.
- **Obavijest korisnicima (opcionalno):** kad se promijeni nešto što zanima mnoge (npr. novi lovostaj ili nova cijena dozvole), pošalje se push obavijest „Promijenjena pravila za lampugu od 1. 6.”.

## Alarm za nove propise (za napraviti)

- Tjedni posao koji pretražuje Narodne novine po ključnim riječima („ribolov”, „morsko ribarstvo”, „lovostaj”, „ribolovna dozvola”) i šalje e-poštu ako se pojavi novi dokument.
- Pratiti i stranice Uprave ribarstva (ribarstvo.mps.hr) zbog cijena dozvola i obavijesti.
- Datoteke kojima je `zadnja_provjera` starija od 12 mjeseci označiti za ponovnu provjeru.
