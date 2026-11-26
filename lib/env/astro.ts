import SunCalc from "suncalc";
import type { Text } from "../rules/types";

export const TZ = "Europe/Zagreb";

/** "HH:MM" in Croatian local time. */
export function zagrebHM(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(d)
    .replace(/^24:/, "00:");
}

/** "YYYY-MM-DD" in Croatian local time. */
export function zagrebDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

const PHASES: Text[] = [
  { hr: "mlađak", en: "new moon" },
  { hr: "srp koji raste", en: "waxing crescent" },
  { hr: "prva četvrt", en: "first quarter" },
  { hr: "izbočeni mjesec koji raste", en: "waxing gibbous" },
  { hr: "uštap", en: "full moon" },
  { hr: "izbočeni mjesec koji pada", en: "waning gibbous" },
  { hr: "zadnja četvrt", en: "last quarter" },
  { hr: "srp koji pada", en: "waning crescent" },
];

export interface SunMoon {
  izlazak: string | null;
  zalazak: string | null;
  mjesec: { faza: Text; osvijetljenost: number; faza_0_1: number };
}

/** Sunrise/sunset (local time) and moon phase for a date at a location. */
export function sunMoon(lat: number, lon: number, isoDate: string): SunMoon {
  // 11:00 UTC is around local noon in Croatia in both CET and CEST.
  const noon = new Date(`${isoDate}T11:00:00Z`);
  const t = SunCalc.getTimes(noon, lat, lon);
  const m = SunCalc.getMoonIllumination(noon);
  const idx = Math.round(m.phase * 8) % 8;
  const ok = (d: Date) => (Number.isNaN(d.getTime()) ? null : zagrebHM(d));
  return {
    izlazak: ok(t.sunrise),
    zalazak: ok(t.sunset),
    mjesec: { faza: PHASES[idx], osvijetljenost: Math.round(m.fraction * 100), faza_0_1: Number(m.phase.toFixed(3)) },
  };
}
