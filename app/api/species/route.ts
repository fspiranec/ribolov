import { NextRequest, NextResponse } from "next/server";
import { loadRules } from "@/lib/rules/load";
import { speciesGuide } from "@/lib/species";
import { zagrebDate } from "@/lib/env/astro";
import { isValidIsoDate } from "@/lib/rules/dates";

export const runtime = "nodejs";

/** GET /api/species?date=YYYY-MM-DD&hour=H – species guide with tips and today's status. */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || zagrebDate(new Date());
  if (!isValidIsoDate(date)) return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  const h = req.nextUrl.searchParams.get("hour");
  const hour = h != null && /^\d{1,2}$/.test(h) ? Math.min(23, Number(h)) : null;
  return NextResponse.json(speciesGuide(loadRules(), date, hour));
}
