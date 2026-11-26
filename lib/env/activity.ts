/**
 * Fish-activity index (0–100 per hour), in the style of common fishing apps.
 *
 * This is a HEURISTIC, not science: solunar theory (moon transits = major periods,
 * moonrise/moonset = minor periods), dawn/dusk, moon phase, and weather
 * (pressure trend, strong gusts, high waves). Weights are our own choice.
 */
import SunCalc from "suncalc";
import type { Text } from "../rules/types";
import { zagrebHM } from "./astro";
import type { DaySeries } from "./weather";

export interface ActivityHour {
  sat: string; // "HH:00"
  ocjena: number; // 0..100
}

export interface Activity {
  sati: ActivityHour[];
  najbolje: { od: string; do: string; ocjena: number }[];
  glavni_periodi: string[]; // moon upper/lower transit, local "HH:MM"
  sporedni_periodi: string[]; // moonrise / moonset
  dnevna_ocjena: number;
  oznaka: Text;
  napomena: Text;
}

const STEP_MIN = 10;

/** UTC timestamp of local midnight in Europe/Zagreb for the date. */
function zagrebMidnight(isoDate: string): number {
  const utcMidnight = Date.parse(`${isoDate}T00:00:00Z`);
  // Zagreb is UTC+1 or UTC+2; local hour at UTC midnight is the offset.
  const offsetH = Number(zagrebHM(new Date(utcMidnight)).slice(0, 2));
  return utcMidnight - offsetH * 3600_000;
}

/** Minutes after local midnight at which the moon transits / rises / sets. */
export function solunarEvents(lat: number, lon: number, isoDate: string) {
  const start = zagrebMidnight(isoDate);
  const n = (24 * 60) / STEP_MIN;
  const alt: number[] = [];
  for (let i = -1; i <= n + 1; i++) {
    alt.push(SunCalc.getMoonPosition(new Date(start + i * STEP_MIN * 60_000), lat, lon).altitude);
  }
  const transits: number[] = [];
  const riseSet: number[] = [];
  for (let k = 1; k < alt.length - 1; k++) {
    const minute = (k - 1) * STEP_MIN;
    if (minute < 0 || minute >= 24 * 60) continue;
    const [a, b, c] = [alt[k - 1], alt[k], alt[k + 1]];
    if ((b > a && b >= c) || (b < a && b <= c)) transits.push(minute); // local max = upper, min = lower transit
    if ((b <= 0 && c > 0) || (b >= 0 && c < 0)) riseSet.push(minute + STEP_MIN / 2);
  }
  return { transits, riseSet };
}

const hm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(Math.round(min % 60)).padStart(2, "0")}`;
const hmToMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

/** Peak bonus that decays linearly to 0 at `width` minutes from the event. */
function peak(minute: number, events: number[], width: number, max: number): number {
  let best = 0;
  for (const e of events) best = Math.max(best, max * Math.max(0, 1 - Math.abs(minute - e) / width));
  return best;
}

export function computeActivity(
  lat: number,
  lon: number,
  isoDate: string,
  sun: { izlazak: string | null; zalazak: string | null },
  series: DaySeries | null,
): Activity {
  const { transits, riseSet } = solunarEvents(lat, lon, isoDate);
  const twilight = [sun.izlazak, sun.zalazak].filter((x): x is string => !!x).map(hmToMin);
  const phase = SunCalc.getMoonIllumination(new Date(`${isoDate}T11:00:00Z`)).phase; // 0 new, 0.5 full
  // 0..10, highest around new and full moon.
  const phaseBonus = 10 * ((Math.cos(phase * 4 * Math.PI) + 1) / 2);

  const sati: ActivityHour[] = [];
  for (let h = 0; h < 24; h++) {
    const m = h * 60 + 30;
    let s = 15 + phaseBonus;
    s += peak(m, transits, 90, 40); // major periods
    s += peak(m, riseSet, 60, 20); // minor periods
    s += peak(m, twilight, 75, 15); // dawn / dusk
    if (series) {
      const p = series.tlak_hpa[h];
      const p3 = series.tlak_hpa[Math.max(0, h - 3)];
      if (p != null && p3 != null && h >= 3) {
        const dp = p - p3;
        if (dp <= -3) s -= 10; // rapid fall: storm coming
        else if (dp <= -0.7) s += 10; // slowly falling: often good
        else if (dp < 0.7) s += 5; // stable
        else if (dp >= 2) s -= 5; // rising fast after a front
      }
      const g = series.udari_kmh[h];
      if (g != null && g > 50) s -= 15;
      else if (g != null && g > 35) s -= 5;
      const w = series.valovi_m[h];
      if (w != null && w > 2) s -= 10;
    }
    sati.push({ sat: `${String(h).padStart(2, "0")}:00`, ocjena: Math.round(Math.max(0, Math.min(100, s))) });
  }

  // Best two non-overlapping 2-hour windows.
  const windows = sati
    .slice(0, 23)
    .map((x, i) => ({ i, v: (x.ocjena + sati[i + 1].ocjena) / 2 }))
    .sort((a, b) => b.v - a.v);
  const picked: typeof windows = [];
  for (const w of windows) {
    if (picked.length === 2) break;
    if (picked.every((p) => Math.abs(p.i - w.i) >= 3)) picked.push(w);
  }
  const najbolje = picked
    .sort((a, b) => a.i - b.i)
    .map((w) => ({ od: hm(w.i * 60), do: hm((w.i + 2) * 60), ocjena: Math.round(w.v) }));

  const top = [...sati].map((x) => x.ocjena).sort((a, b) => b - a).slice(0, 6);
  const dnevna = Math.round(top.reduce((a, b) => a + b, 0) / top.length);
  const oznaka: Text =
    dnevna >= 75
      ? { hr: "odlično", en: "excellent" }
      : dnevna >= 55
        ? { hr: "dobro", en: "good" }
        : dnevna >= 35
          ? { hr: "umjereno", en: "fair" }
          : { hr: "slabo", en: "poor" };

  return {
    sati,
    najbolje,
    glavni_periodi: transits.map(hm),
    sporedni_periodi: riseSet.map(hm),
    dnevna_ocjena: dnevna,
    oznaka,
    napomena: {
      hr: "Procjena prema solunarnoj teoriji (mjesec), izlasku i zalasku sunca, tlaku, vjetru i valovima. Nije znanstveno pouzdano.",
      en: "Estimate based on solunar theory (moon), sunrise/sunset, pressure, wind and waves. Not scientifically reliable.",
    },
  };
}
