import { describe, expect, it } from "vitest";
import { nearestReachable } from "@/lib/pin";
import { islandAt, islandsFrom } from "@/lib/islands";

const P = { lat: 44.958, lon: 14.104, date: "2026-11-26", permit: "rekreacijska" as const, special: [], mode: "obala" as const };
const shop = (naziv: string, lat: number, lon: number) => ({ naziv, lat, lon });

describe("najbliže trgovine i prodavači", () => {
  // Koromačno (mainland, Istria): a shop on Cres is closer in a straight line than one in Labin.
  const cres = shop("Max Fishing (Cres)", 44.9585, 14.4096); // ~24 km across the sea
  const labin = shop("Labin", 45.09, 14.12); // ~15 km by land
  const rijeka = shop("Rijeka", 45.33, 14.44); // ~50 km by land
  const getIsland = (lat: number, lon: number) => (lon > 14.3 && lat < 45.1 ? "Cres" : null);

  it("prefers a shop on the same landmass and marks the one across the sea", () => {
    const r = nearestReachable(P, [cres, rijeka, labin], getIsland);
    // Rijeka (~49 km by road) beats Cres (~24 km, but across the sea: +30 km)
    expect(r.map((s) => s.naziv)).toEqual(["Labin", "Rijeka", "Max Fishing (Cres)"]);
    expect(r[2].isto_kopno).toBe(false);
    expect(r[2].otok).toBe("Cres");
    expect(r[0].isto_kopno).toBe(true);
  });

  it("treats bridged islands (Krk) as mainland", () => {
    const krk = shop("Krk", 45.03, 14.57);
    const r = nearestReachable({ ...P, lat: 45.33, lon: 14.44 }, [krk], () => "Krk");
    expect(r[0].isto_kopno).toBe(true);
  });

  it("without island data falls back to straight-line distance", () => {
    const r = nearestReachable(P, [rijeka, cres, labin]);
    expect(r.map((s) => s.naziv)).toEqual(["Labin", "Max Fishing (Cres)", "Rijeka"]);
    expect(r.every((s) => s.isto_kopno)).toBe(true);
  });

  it("finds the island for a point on it or just off its shore", () => {
    const square = islandsFrom({
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { naziv: "Test" }, geometry: { type: "Polygon", coordinates: [[[14.0, 44.0], [14.1, 44.0], [14.1, 44.1], [14.0, 44.1], [14.0, 44.0]]] } }],
    });
    expect(islandAt(44.05, 14.05, square)).toBe("Test");
    expect(islandAt(44.05, 14.103, square)).toBe("Test"); // ~240 m off the shore
    expect(islandAt(44.05, 14.2, square)).toBeNull();
  });
});
