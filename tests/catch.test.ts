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
