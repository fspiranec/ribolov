import { describe, expect, it } from "vitest";
import path from "node:path";
import { GeoJsonZoneProvider } from "@/lib/zones/geojson";
import { evaluatePin, parsePinParams } from "@/lib/pin";
import { loadRules } from "@/lib/rules/load";
import { bestWindow, hourRange, readView, visibleClosedSeasons } from "@/lib/view";
import { fixtureZones } from "./fixtures/zones";

const rules = loadRules(path.join(__dirname, "../rules"));

describe("prikaz Osnovno / Detaljno", () => {
  it("defaults to basic", () => {
    expect(readView(null)).toBe("osnovno");
    expect(readView("nešto")).toBe("osnovno");
    expect(readView("detaljno")).toBe("detaljno");
  });

  it("basic view lists only closed seasons relevant from the shore", () => {
    const list = [
      { k: "kavala", s_obale: true, trajno_zabranjeno: false },
      { k: "lampuga", s_obale: false, trajno_zabranjeno: false },
      { k: "jastog", s_obale: true, trajno_zabranjeno: true },
      { k: "dugokrila_tuna", s_obale: false, trajno_zabranjeno: true },
    ];
    expect(visibleClosedSeasons(list, "osnovno").map((x) => x.k)).toEqual(["kavala"]);
    expect(visibleClosedSeasons(list, "detaljno")).toHaveLength(4);
  });

  it("formats the best time as one sentence part", () => {
    expect(hourRange("13:00", "15:00")).toBe("13–15 h");
    expect(hourRange("05:30", "07:30")).toBe("05:30–07:30 h");
    expect(bestWindow([{ od: "06:00", do: "08:00", ocjena: 60 }, { od: "13:00", do: "15:00", ocjena: 70 }])).toBe("13–15 h");
    expect(bestWindow([])).toBeNull();
  });

  it("no closed-season reminders for boat-only species when fishing from the shore", async () => {
    // albacore is permanently banned; lampuga (s_obale: false) season opens 15 Aug
    const run = async (mode: string) => {
      const q = new URLSearchParams({ lat: "43.0446", lon: "16.0836", date: "2026-08-10", mode });
      return evaluatePin(parsePinParams(q).params!, { rules, zones: new GeoJsonZoneProvider([fixtureZones()]), now: () => new Date("2026-08-10T08:00:00Z") });
    };
    const shore = await run("obala");
    const boat = await run("brod");
    expect(shore.podsjetnici.some((p) => p.tekst.hr.startsWith("Lampuga"))).toBe(false);
    expect(boat.podsjetnici.some((p) => p.tekst.hr.startsWith("Lampuga"))).toBe(true);
  });
});
