/** Text in Croatian and English; other languages come from locales/*.json (or are set directly, e.g. species names). */
export type Text = { hr: string; en: string } & Partial<Record<"de" | "it" | "pl" | "cs" | "sl", string>>;
export type Level = "zeleno" | "zuto" | "crveno";
export type Permit = "rekreacijska" | "sportska";
export type SpecialPermit = "parangal" | "vrse" | "osti" | "rasvjeta" | "velika_riba";
export type Mode = "obala" | "brod" | "podvodni";
export type Period = { od: string; do: string }; // MM-DD, inclusive

/** Fields every legal rule carries. */
export interface Source {
  izvor: string;
  clanak?: string;
  url?: string;
  vrijedi_od?: string | Date | null;
  vrijedi_do?: string | Date | null;
  napomena?: string | Text;
  needs_legal_check?: boolean;
}

export interface Tool extends Source {
  id: string;
  naziv: Text;
  /** Plain-language explanation for tourists. */
  opis?: Text;
  /** Technical details (limits, specs), shown small. */
  detalj?: Text;
  max: number | null;
  posebna_dozvola: SpecialPermit | null;
  samo_dozvola?: Permit;
  nacini: Mode[];
  zabrana_glavonosci?: Period;
}

export interface TextRule extends Source {
  key?: string;
  tekst: Text;
}

export interface GeneralRules {
  zadnja_provjera: string | Date;
  dnevna_ogranicenja: TextRule[];
  bez_dozvole: TextRule;
  dnevni_limit: Source & { ukupno_kg: number; komada: Record<string, number> };
  alati: Tool[];
  zabranjeno: TextRule[];
  podvodni: TextRule & { podsjetnik: Text };
  oznacavanje: TextRule & { vrste_djelomicno: string[] };
  evidencija: TextRule & { faze: { od: string | Date; tekst: Text }[] };
  odricanje: Text;
}

export interface ClosedSeason extends Source {
  key: string;
  vrsta: Text;
  razdoblja: Period[];
}

export interface MinSize extends Source {
  vrsta: Text;
  min: string;
}

export interface AreaRule extends Source {
  key: string;
  layer: string;
  priority: number;
  razina: Level | "obavijest";
  razlog: Text;
  razlog_blizina?: Text;
  sezona?: Period;
  udaljenost_m?: number;
  blizina_m?: number;
  blizina_razina?: Level;
  dopusteni_alati?: string[];
  zabrana_rasvjete?: boolean;
  kritican?: boolean;
}

export interface RuleSet {
  general: GeneralRules;
  closedSeasons: { zadnja_provjera: string | Date; lovostaji: ClosedSeason[]; uvijek: TextRule[] };
  minSizes: { zadnja_provjera: string | Date; velicine: MinSize[]; tolerancija: TextRule };
  prohibited: {
    zadnja_provjera: string | Date;
    zabranjene: (Source & { vrsta: Text })[];
    strogo_zasticene: Source & { vrste: Text };
  };
  areas: { zadnja_provjera: string | Date; podrucja: AreaRule[] };
  permits: {
    zadnja_provjera: string | Date;
    izvor: string;
    online_url: string;
    info_url: string;
    opis: Text;
    cijene: { trajanje: Text; cijena_eur: number }[];
    posebne: { napomena: Text; cijene: { key: string; naziv: Text; cijena_eur: number }[] };
    sportska: Text;
    djeca: Text;
    mrecfish: { info_url: string; ios_url: string; tekst: Text };
  };
}
