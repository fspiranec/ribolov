import { describe, expect, it } from "vitest";
import { inAnyPeriod, inPeriod, isValidIsoDate, validOn } from "@/lib/rules/dates";

describe("inPeriod", () => {
  it("handles a normal range inclusively", () => {
    const kavala = { od: "05-15", do: "07-15" };
    expect(inPeriod("2026-05-14", kavala)).toBe(false);
    expect(inPeriod("2026-05-15", kavala)).toBe(true);
    expect(inPeriod("2026-07-15", kavala)).toBe(true);
    expect(inPeriod("2026-07-16", kavala)).toBe(false);
  });

  it("handles ranges over the new year (jastog 1. 9. – 5. 5.)", () => {
    const jastog = { od: "09-01", do: "05-05" };
    expect(inPeriod("2026-08-31", jastog)).toBe(false);
    expect(inPeriod("2026-09-01", jastog)).toBe(true);
    expect(inPeriod("2026-12-31", jastog)).toBe(true);
    expect(inPeriod("2027-01-01", jastog)).toBe(true);
    expect(inPeriod("2027-05-05", jastog)).toBe(true);
    expect(inPeriod("2027-05-06", jastog)).toBe(false);
  });

  it("handles kuka 1. 9. – 15. 7. (most of the year)", () => {
    const kuka = { od: "09-01", do: "07-15" };
    expect(inPeriod("2026-07-16", kuka)).toBe(false);
    expect(inPeriod("2026-08-31", kuka)).toBe(false);
    expect(inPeriod("2026-03-01", kuka)).toBe(true);
  });

  it("handles leap years", () => {
    expect(inPeriod("2028-02-29", { od: "02-28", do: "03-01" })).toBe(true);
    expect(inPeriod("2028-02-29", { od: "03-01", do: "03-31" })).toBe(false);
    expect(inPeriod("2028-02-29", { od: "09-01", do: "05-05" })).toBe(true);
    expect(inPeriod("2028-02-29", { od: "01-01", do: "12-31" })).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2027-02-29")).toBe(false);
  });

  it("handles multiple periods (dugokrila tuna)", () => {
    const p = [{ od: "03-01", do: "03-31" }, { od: "10-01", do: "11-30" }];
    expect(inAnyPeriod("2026-03-15", p)).toBe(true);
    expect(inAnyPeriod("2026-06-15", p)).toBe(false);
    expect(inAnyPeriod("2026-11-30", p)).toBe(true);
  });
});

describe("validOn", () => {
  it("respects vrijedi_od / vrijedi_do", () => {
    const r = { vrijedi_od: "2026-06-01", vrijedi_do: "2026-12-31" };
    expect(validOn("2026-05-31", r)).toBe(false);
    expect(validOn("2026-06-01", r)).toBe(true);
    expect(validOn("2027-01-01", r)).toBe(false);
    expect(validOn("2030-01-01", { vrijedi_od: new Date("2026-06-01"), vrijedi_do: null })).toBe(true);
  });
});
