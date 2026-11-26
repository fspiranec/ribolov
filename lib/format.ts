import { LOCALE_TAG, type Lang } from "./i18n";

/** Number in the user's language: decimal comma in HR, DE, IT, PL, CS, SL ("13,27"), point in EN. */
export function num(n: number | null | undefined, lang: Lang, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return new Intl.NumberFormat(LOCALE_TAG[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** Distance from metres: "450 m", "3,1 km". */
export function dist(m: number, lang: Lang): string {
  return m < 1000 ? `${Math.round(m)} m` : `${num(m / 1000, lang, 1)} km`;
}

/** "RUDARSKA 7, LABIN" -> "Rudarska 7, Labin"; mixed-case text is left as it is. Legal forms stay lower case (d.o.o.). */
export function prettyCase(s: string): string {
  const letters = s.replace(/[^A-Za-zČĆĐŠŽčćđšž]/g, "");
  if (!letters || letters !== letters.toUpperCase()) return s;
  return s
    .toLocaleLowerCase("hr")
    .replace(/(^|[\s\-/("„])(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toLocaleUpperCase("hr"))
    .replace(/\b(D\.o\.o|J\.d\.o\.o|D\.d|Obrt)\b\.?/g, (m) => m.toLowerCase());
}
