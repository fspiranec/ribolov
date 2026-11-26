import { describe, expect, it } from "vitest";
import path from "node:path";
import { loadRecipes } from "@/lib/recipes";
import { loadRules } from "@/lib/rules/load";
import { speciesGuide } from "@/lib/species";

const data = loadRecipes(path.join(__dirname, "../data/recipes.yaml"));
const g = speciesGuide(loadRules(path.join(__dirname, "../rules")), "2026-07-01");
const known = new Set([...g.vrste.map((s) => s.key), ...g.posebne.map((s) => s.key)]);

describe("recepti", () => {
  it("are simple: at most 6 ingredients, steps, time and a local story", () => {
    expect(data.recepti.length).toBeGreaterThanOrEqual(1);
    for (const r of data.recepti) {
      expect(r.sastojci.length, r.key).toBeLessThanOrEqual(6);
      expect(r.koraci.length, r.key).toBeGreaterThan(0);
      expect(r.vrijeme_min, r.key).toBeGreaterThan(0);
      expect(r.prica.hr, r.key).not.toBe("");
    }
  });

  it("link to real species; never a recipe for the pufferfish", () => {
    for (const r of data.recepti) if (r.riba) expect(known.has(r.riba), r.riba).toBe(true);
    expect(data.recepti.some((r) => r.riba === "napuhaca")).toBe(false);
  });

  it("gilthead seabream: recipe with its own cleaning steps (scales, guts, gills)", () => {
    const orada = data.recepti.find((r) => r.riba === "komarca");
    expect(orada).toBeDefined();
    const steps = orada!.ciscenje.map((s) => s.hr).join(" ");
    for (const w of ["Ljuske", "Utroba", "Škrge"]) expect(steps).toContain(w);
  });

  it("recipes parked for later have the same format (and the blue crab stays 'good for the sea')", () => {
    const later = loadRecipesFrom("../data/recipes_kasnije.yaml");
    expect(later.recepti.find((r) => r.riba === "plavi_rak")?.istaknuto).toBe("dobro_za_more");
    for (const r of later.recepti) expect(r.sastojci.length, r.key).toBeLessThanOrEqual(6);
  });
});

// loadRecipes caches the main file; read the "later" file directly
import fs from "node:fs";
import yaml from "js-yaml";
function loadRecipesFrom(rel: string) {
  return yaml.load(fs.readFileSync(path.join(__dirname, rel), "utf8")) as { recepti: { key: string; riba: string | null; istaknuto?: string; sastojci: unknown[] }[] };
}
