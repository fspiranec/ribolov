import type { Period } from "./types";

/** "YYYY-MM-DD" -> numeric MMDD (e.g. 0229 -> 229). */
function mmdd(isoDate: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) throw new Error(`Invalid date: ${isoDate}`);
  return Number(m[2]) * 100 + Number(m[3]);
}

function parsePeriodPart(s: string): number {
  const m = /^(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`Invalid period MM-DD: ${s}`);
  return Number(m[1]) * 100 + Number(m[2]);
}

/**
 * True if the date falls inside the period (inclusive). Periods where od > do
 * wrap over the new year (e.g. 09-01 .. 05-05). Comparing MMDD numbers makes
 * leap days work naturally: 02-29 sits between 02-28 and 03-01.
 */
export function inPeriod(isoDate: string, p: Period): boolean {
  const d = mmdd(isoDate);
  const from = parsePeriodPart(p.od);
  const to = parsePeriodPart(p.do);
  return from <= to ? d >= from && d <= to : d >= from || d <= to;
}

export function inAnyPeriod(isoDate: string, periods: Period[]): boolean {
  return periods.some((p) => inPeriod(isoDate, p));
}

function toIso(v: string | Date | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

/** True if a rule's legal validity (vrijedi_od / vrijedi_do) covers the date. */
export function validOn(
  isoDate: string,
  r: { vrijedi_od?: string | Date | null; vrijedi_do?: string | Date | null },
): boolean {
  const from = toIso(r.vrijedi_od);
  const to = toIso(r.vrijedi_do);
  if (from && isoDate < from) return false;
  if (to && isoDate > to) return false;
  return true;
}

export { toIso };

export function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
