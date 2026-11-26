import { describe, expect, it } from "vitest";
import path from "node:path";
import type { FeatureCollection } from "geojson";
import { GeoJsonZoneProvider } from "@/lib/zones/geojson";
import { evaluatePin, parsePinParams } from "@/lib/pin";
import { loadRules } from "@/lib/rules/load";
import { bestTimeToday, windowPassed } from "@/lib/view";
import { num, prettyCase } from "@/lib/format";
import { fixtureZones } from "./fixtures/zones";

// Regressions from docs/IZVJESTAJ_TESTIRANJA.md (26. 11. 2026.)
const rules = loadRules(path.join(__dirname, "../rules"));
const KOMIZA = { lat: "43.0446", lon: "16.0836" };

const run = (q: Record<string, string>, extra: Partial<Parameters<typeof evaluatePin>[1]> = {}, collections: FeatureCollection[] = [fixtureZones()]) =>
  evaluatePin(parsePinParams(new URLSearchParams(q)).params!, {
    rules,
    zones: new GeoJsonZoneProvider(collections),
    now: () => new Date("2026-08-20T08:00:00Z"),
    ...extra,
  });

describe("izvještaj testiranja – popravci", () => {
  it("1: island outlines (no rule_key) are not zones – no 'Unknown rule: undefined'", async () => {
    const island: FeatureCollection = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { naziv: "Vis", km2: 90 }, geometry: { type: "Polygon", coordinates: [[[16.0, 43.0], [16.2, 43.0], [16.2, 43.1], [16.0, 43.1], [16.0, 43.0]]] } }],
    };
    const r = await run({ ...KOMIZA, date: "2026-08-20" }, {}, [fixtureZones(), island]);
    expect(JSON.stringify(r)).not.toMatch(/undefined|Nepoznato pravilo|Unknown rule/);
  });

  it("2: a point far above the sea is never green", async () => {
    const r = await run({ ...KOMIZA, date: "2026-08-20" }, { getDepth: async () => ({ elevation_m: 178, dubina_m: null, izvor: "test" }) });
    expect(r.semafor).toBe("zuto");
    expect(r.razlog.hr).toContain("na kopnu");
  });

  it("2: shore anglers on land a few metres above the sea keep their verdict", async () => {
    const r = await run({ ...KOMIZA, date: "2026-08-20" }, { getDepth: async () => ({ elevation_m: 3, dubina_m: null, izvor: "test" }) });
    expect(r.razlog.hr).not.toContain("na kopnu (");
  });

  it("3: sunset reminder uses the chosen date and time", async () => {
    const r = await run({ ...KOMIZA, date: "2026-08-20", time: "19:30" });
    expect(r.podsjetnici.some((p) => p.tekst.hr.startsWith("Zalazak sunca za"))).toBe(true);
    const other = await run({ ...KOMIZA, date: "2026-08-25" }); // another day, no time chosen
    expect(other.podsjetnici.some((p) => p.tekst.hr.startsWith("Zalazak sunca"))).toBe(false);
  });

  it("4: best time today skips windows that are over", () => {
    const w = [
      { od: "06:00", do: "08:00", ocjena: 60 },
      { od: "13:00", do: "15:00", ocjena: 70 },
    ];
    expect(bestTimeToday(w, 10)).toEqual({ text: "13–15 h", passed: false });
    expect(bestTimeToday(w, 7)).toEqual({ text: "13–15 h", passed: false });
    expect(bestTimeToday(w, 22)).toEqual({ text: "13–15 h", passed: true });
    expect(bestTimeToday(w, null)).toEqual({ text: "13–15 h", passed: false });
    expect(windowPassed(w[0], 9)).toBe(true);
    expect(windowPassed(w[1], 9)).toBe(false);
  });

  it("7–8: numbers and names in the user's language", () => {
    expect(num(13.27, "hr", 2)).toBe("13,27");
    expect(num(13.27, "en", 2)).toBe("13.27");
    expect(prettyCase("RUDARSKA 7, LABIN")).toBe("Rudarska 7, Labin");
    expect(prettyCase("Max Fishing")).toBe("Max Fishing");
  });
});
