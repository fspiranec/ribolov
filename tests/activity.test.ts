import { describe, expect, it } from "vitest";
import { computeActivity, solunarEvents } from "@/lib/env/activity";
import { sunMoon } from "@/lib/env/astro";

describe("fish activity", () => {
  const lat = 43.0;
  const lon = 16.0;
  const date = "2026-07-15";

  it("finds moon transits and rise/set events", () => {
    const { transits, riseSet } = solunarEvents(lat, lon, date);
    expect(transits.length).toBeGreaterThanOrEqual(1);
    expect(transits.length).toBeLessThanOrEqual(3);
    expect(riseSet.length).toBeLessThanOrEqual(3);
  });

  it("returns 24 hourly scores in 0..100 and peaks near a major period", () => {
    const a = computeActivity(lat, lon, date, sunMoon(lat, lon, date), null);
    expect(a.sati).toHaveLength(24);
    for (const h of a.sati) expect(h.ocjena).toBeGreaterThanOrEqual(0), expect(h.ocjena).toBeLessThanOrEqual(100);
    const major = Number(a.glavni_periodi[0].slice(0, 2));
    const max = Math.max(...a.sati.map((h) => h.ocjena));
    expect(a.sati[major].ocjena).toBeGreaterThan(max - 25);
    expect(a.najbolje.length).toBeGreaterThan(0);
  });

  it("penalises storms (rapid pressure fall, strong gusts)", () => {
    const sm = sunMoon(lat, lon, date);
    const calm = computeActivity(lat, lon, date, sm, {
      tlak_hpa: Array(24).fill(1015),
      udari_kmh: Array(24).fill(10),
      valovi_m: Array(24).fill(0.3),
    });
    const storm = computeActivity(lat, lon, date, sm, {
      tlak_hpa: Array.from({ length: 24 }, (_, i) => 1015 - i * 1.5),
      udari_kmh: Array(24).fill(70),
      valovi_m: Array(24).fill(3),
    });
    expect(storm.dnevna_ocjena).toBeLessThan(calm.dnevna_ocjena);
  });
});
