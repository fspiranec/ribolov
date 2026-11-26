/** "Osnovno" (basic, default) shows less detail; "Detaljno" shows everything. Warnings and bans are never hidden. */
export type View = "osnovno" | "detaljno";

export const VIEW_KEY = "ribolov:prikaz";

export function readView(raw: string | null | undefined): View {
  return raw === "detaljno" ? "detaljno" : "osnovno";
}

/** Closed seasons for the list: in basic view only species a visitor can catch from the shore. */
export function visibleClosedSeasons<T extends { trajno_zabranjeno: boolean; s_obale: boolean }>(list: T[], view: View): T[] {
  return view === "detaljno" ? list : list.filter((l) => l.s_obale && !l.trajno_zabranjeno);
}

/** "13:00", "15:00" -> "13–15 h" (minutes kept when not on the hour). */
export function hourRange(od: string, doo: string): string {
  const f = (s: string) => (s.endsWith(":00") ? String(Number(s.slice(0, 2))) : s);
  return `${f(od)}–${f(doo)} h`;
}

/**
 * Best time sentence for the activity card. Today, windows that have already ended are skipped;
 * if all have ended, `passed` is true and the best one of the day is returned for reference.
 */
export function bestTimeToday(najbolje: { od: string; do: string; ocjena: number }[], nowHour: number | null): { text: string; passed: boolean } | null {
  if (!najbolje.length) return null;
  if (nowHour == null) return { text: bestWindow(najbolje)!, passed: false };
  const ahead = najbolje.filter((w) => Number(w.do.slice(0, 2)) > nowHour);
  return ahead.length ? { text: bestWindow(ahead)!, passed: false } : { text: bestWindow(najbolje)!, passed: true };
}

/** True when the window has already ended at nowHour (today only). */
export const windowPassed = (w: { do: string }, nowHour: number | null) => nowHour != null && Number(w.do.slice(0, 2)) <= nowHour;

/** The single best window of the day (highest score), as "13–15 h". */
export function bestWindow(najbolje: { od: string; do: string; ocjena: number }[]): string | null {
  if (!najbolje.length) return null;
  const b = [...najbolje].sort((x, y) => y.ocjena - x.ocjena)[0];
  return hourRange(b.od, b.do);
}
