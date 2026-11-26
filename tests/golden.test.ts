import { describe, expect, it } from "vitest";
import path from "node:path";
import golden from "./golden_points.json";
import { fixtureZones } from "./fixtures/zones";
import { GeoJsonZoneProvider } from "@/lib/zones/geojson";
import { evaluatePin, parsePinParams, type PinParams } from "@/lib/pin";
import { loadRules } from "@/lib/rules/load";

type G = (typeof golden)[number] & {
  time?: string;
  mode?: string;
  permit?: string;
  realScuza?: boolean;
  kopno?: boolean;
  expect?: string[];
  status?: string;
  upozorenje_sadrzi?: string;
  alat_nedopusten?: string;
  podzona?: string;
  natura?: boolean;
  na_kopnu?: boolean;
};

const rules = loadRules(path.join(__dirname, "../rules"));
const providers = {
  placeholder: new GeoJsonZoneProvider([fixtureZones()]),
  real: new GeoJsonZoneProvider([fixtureZones({ realScuza: true })]),
};

function params(g: G): PinParams {
  const q = new URLSearchParams({ lat: String(g.lat), lon: String(g.lon), date: g.date });
  if (g.time) q.set("time", g.time);
  if (g.mode) q.set("mode", g.mode);
  if (g.permit) q.set("permit", g.permit);
  const r = parsePinParams(q);
  if (!r.params) throw new Error(r.error);
  return r.params;
}

describe("golden points", () => {
  it("has at least 15 points", () => expect(golden.length).toBeGreaterThanOrEqual(15));

  for (const g of golden as G[]) {
    it(`${g.id}: ${g.opis}`, async () => {
      const res = await evaluatePin(params(g), {
        rules,
        zones: g.realScuza ? providers.real : providers.placeholder,
        getDepth: async () =>
          g.kopno
            ? { elevation_m: 120, dubina_m: null, izvor: "stub" }
            : { elevation_m: -40, dubina_m: 40, izvor: "stub" },
        now: () => new Date("2026-07-15T10:00:00Z"),
      });
      if (g.status) expect(res.status).toBe(g.status);
      else expect(res.status).toBe("ok");
      if (g.expect) expect(g.expect, `got ${res.semafor}: ${res.razlog.hr}`).toContain(res.semafor);
      if (g.upozorenje_sadrzi)
        expect(res.upozorenja.map((u) => u.tekst.hr).join(" | ")).toContain(g.upozorenje_sadrzi);
      if (g.alat_nedopusten) expect(res.alati.find((a) => a.id === g.alat_nedopusten)?.dopusteno).toBe(false);
      if (g.podzona) expect(res.gdje.podzona).toBe(g.podzona);
      if (g.natura) expect(res.gdje.natura2000.length).toBeGreaterThan(0);
      if (g.na_kopnu) expect(res.na_kopnu).toBe(true);
      if (res.status === "ok") expect(res.dozvola.online_url).toMatch(/^https:/);
      if (res.status === "ok") {
        expect(res.izvor?.izvor).toBeTruthy();
        expect(res.odricanje.hr).toContain("Informativni alat");
      }
    });
  }
});

describe("never green when data is missing", () => {
  it("open sea without critical layers loaded is yellow", async () => {
    const onlySea = new GeoJsonZoneProvider([
      { type: "FeatureCollection", features: fixtureZones().features.filter((f) => f.properties?.layer === "hr_more") },
    ]);
    const res = await evaluatePin(params(golden[4] as G), { rules, zones: onlySea });
    expect(res.semafor).toBe("zuto");
  });
});

describe("today block", () => {
  it("lists closed seasons and tool rules for the date", async () => {
    const q = new URLSearchParams({ lat: "43.0", lon: "16.0", date: "2026-07-15", permit: "rekreacijska,rasvjeta,osti" });
    const res = await evaluatePin(parsePinParams(q).params!, { rules, zones: providers.placeholder });
    const species = res.danas!.lovostaj.map((l) => l.vrsta.hr);
    expect(species).toContain("kavala");
    expect(species).toContain("kirnje (sve tri vrste)");
    expect(species).not.toContain("jastog");
    const lights = res.alati.find((a) => a.id === "rasvjeta")!;
    expect(lights.dopusteno).toBe(true);
    expect(lights.napomena?.hr).toContain("glavonošce");
    expect(res.alati.find((a) => a.id === "parangal")!.dopusteno).toBe(false);
    expect(res.alati.find((a) => a.id === "velika_riba")).toBeUndefined(); // boat-only gear, mode=obala
  });

  it("rejects bad params", () => {
    expect(parsePinParams(new URLSearchParams({ lat: "x", lon: "16" })).error).toBeTruthy();
    expect(parsePinParams(new URLSearchParams({ lat: "43", lon: "16", mode: "leteci" })).error).toBeTruthy();
    expect(parsePinParams(new URLSearchParams({ lat: "43", lon: "16", permit: "zlatna" })).error).toBeTruthy();
    expect(parsePinParams(new URLSearchParams({ lat: "43", lon: "16", date: "2026-02-30" })).error).toBeTruthy();
  });
});
