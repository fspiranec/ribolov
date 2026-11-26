import { describe, expect, it } from "vitest";
import path from "node:path";
import { checkCatch, parseMin } from "@/lib/catch";
import { loadRules } from "@/lib/rules/load";

const rules = loadRules(path.join(__dirname, "../rules"));

describe("moj ulov", () => {
  it("parses minimum sizes", () => {
    expect(parseMin("20 cm")).toEqual({ v: 20, u: "cm" });
    expect(parseMin("1 kg")).toEqual({ v: 1, u: "kg" });
    expect(parseMin("promjer čahure 50 mm / test diameter 50 mm")).toEqual({ v: 50, u: "mm" });
    expect(parseMin(null)).toBeNull();
  });

  it("keeps legal fish and releases undersized ones", () => {
    const r = checkCatch(rules, "2026-11-26", [
      { key: "komarca", duljina_cm: 25, masa_kg: 0.3 },
      { key: "komarca", duljina_cm: 18 },
      { key: "komarca" },
    ]);
    expect(r.stavke.map((s) => s.status)).toEqual(["zadrzi", "pusti", "izmjeri"]);
    expect(r.stavke[0].napomene.some((n) => n.hr.includes("repne peraje"))).toBe(true);
    expect(r.zadrzano_kg).toBe(0.3);
  });

  it("releases closed-season species (lampuga before 15 Aug) and reminds about mRecFish after", () => {
    expect(checkCatch(rules, "2026-07-01", [{ key: "lampuga", duljina_cm: 50 }]).stavke[0].status).toBe("pusti");
    const late = checkCatch(rules, "2026-09-01", [{ key: "lampuga", duljina_cm: 50, masa_kg: 1.5 }]);
    expect(late.stavke[0].status).toBe("zadrzi");
    expect(late.mrecfish?.hr).toContain("mRecFish");
  });

  it("applies piece limits (hobotnica max 2) and weight minimum (1 kg)", () => {
    const r = checkCatch(rules, "2026-11-26", [
      { key: "hobotnica", masa_kg: 1.2 },
      { key: "hobotnica", masa_kg: 0.8 },
      { key: "hobotnica", masa_kg: 1.1 },
      { key: "hobotnica", masa_kg: 1.3 },
    ]);
    expect(r.stavke.map((s) => s.status)).toEqual(["zadrzi", "pusti", "zadrzi", "pusti"]);
    expect(r.stavke[0].napomene.some((n) => n.hr.includes("između očiju"))).toBe(true);
  });

  it("5 kg limit plus one fish that goes over it", () => {
    const r = checkCatch(rules, "2026-11-26", [
      { key: "palamida", duljina_cm: 50, masa_kg: 2 },
      { key: "palamida", duljina_cm: 50, masa_kg: 2 },
      { key: "palamida", duljina_cm: 55, masa_kg: 2.5 }, // 6.5 kg: allowed as the one over the limit
      { key: "palamida", duljina_cm: 45, masa_kg: 1 }, // limit reached
    ]);
    expect(r.stavke.map((s) => s.status)).toEqual(["zadrzi", "zadrzi", "zadrzi", "pusti"]);
    expect(r.limit_dosegnut).toBe(true);
    expect(r.preostalo_kg).toBe(0);
  });
});

describe("zaštićene, invazivne i opasne vrste u ulovu", () => {
  it("protected species must be released, with what to do", () => {
    const r = checkCatch(rules, "2026-07-01", [{ key: "periska" }, { key: "kornjace" }]);
    expect(r.stavke.map((s) => s.status)).toEqual(["pusti", "pusti"]);
    expect(r.stavke[0].posebno?.kategorija).toBe("zasticena");
    expect(r.stavke[0].posebno?.sto_uciniti.hr).toContain("Ne diraj");
    // turtle: official HAOP advice – call 112, do not just release it
    expect(r.stavke[1].razlog.hr).toContain("112");
    expect(r.stavke[1].posebno?.sto_uciniti.hr).toContain("Ne vadi udicu");
  });

  it("invasive species: report it (no official 'do not release'); pufferfish never eaten; blue crab may be kept", () => {
    const r = checkCatch(rules, "2026-07-01", [{ key: "napuhaca", masa_kg: 2 }, { key: "plavi_rak" }]);
    expect(r.stavke.map((s) => s.status)).toEqual(["prijavi", "zadrzi"]);
    expect(r.stavke[0].posebno?.razina).toBe("crveno");
    expect(r.stavke[0].razlog.hr).toContain("ne jedi");
    expect(JSON.stringify(r.stavke)).not.toContain("ne vraćaj");
    expect(r.stavke[1].posebno?.prijava_url).toMatch(/^https:\/\//);
    expect(r.stavke[0].posebno?.prijava_url).toMatch(/^https:\/\//);
    expect(r.zadrzano_kg).toBe(0);
  });

  it("dangerous species keep normal rules plus first aid", () => {
    const r = checkCatch(rules, "2026-07-01", [{ key: "skrpina", duljina_cm: 20 }, { key: "pauk" }, { key: "raza_zutulja" }]);
    expect(r.stavke.map((s) => s.status)).toEqual(["pusti", "zadrzi", "pusti"]);
    expect(r.stavke[0].posebno?.prva_pomoc?.hr).toContain("45 °C");
    expect(r.stavke[1].posebno?.kategorija).toBe("opasna");
  });
});
