import { NextRequest, NextResponse } from "next/server";
import { evaluatePin, parsePinParams } from "@/lib/pin";
import { loadRules } from "@/lib/rules/load";
import { getZoneProvider } from "@/lib/zones";
import { getDepth } from "@/lib/env/depth";
import { getDaySeries, getWeather } from "@/lib/env/weather";
import { getPlace } from "@/lib/env/place";

import fs from "node:fs";
import path from "node:path";
import type { PermitSeller, Shop } from "@/lib/pin";

let sellers: PermitSeller[] | null = null;
/** Official licence sellers, from `npm run import:sellers` (empty if not imported). */
function loadSellers(): PermitSeller[] {
  if (sellers) return sellers;
  const f = path.join(process.cwd(), "data/permit_sellers.json");
  sellers = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")).prodavaci as PermitSeller[]) : [];
  return sellers;
}

let shops: Shop[] | null = null;
/** OSM tackle shops (npm run import:shops) + partner shops (data/partners.json). */
function loadShops(): Shop[] {
  if (shops) return shops;
  const read = (n: string) => {
    const f = path.join(process.cwd(), "data", n);
    return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")).trgovine as Shop[]) : [];
  };
  shops = [...read("partners.json").map((s) => ({ ...s, partner: true })), ...read("shops.json")];
  return shops;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pin?lat=&lon=&date=YYYY-MM-DD&time=HH:MM&permit=sportska,parangal&mode=obala|brod|podvodni
 * Shared by the web app and the future Android app; all rule logic lives here.
 */
export async function GET(req: NextRequest) {
  const { params, error } = parsePinParams(req.nextUrl.searchParams);
  if (!params) return NextResponse.json({ error }, { status: 400 });
  try {
    const result = await evaluatePin(params, {
      rules: loadRules(),
      zones: getZoneProvider(),
      getDepth,
      getWeather,
      getDaySeries,
      sellers: loadSellers(),
      shops: loadShops(),
      getPlace,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
