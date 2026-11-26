import { NextRequest, NextResponse } from "next/server";
import { checkCatch, type CatchItem } from "@/lib/catch";
import { loadRules } from "@/lib/rules/load";
import { isValidIsoDate } from "@/lib/rules/dates";
import { zagrebDate } from "@/lib/env/astro";

export const runtime = "nodejs";

/**
 * POST /api/catch  { date?: "YYYY-MM-DD", items: [{ key, duljina_cm?, masa_kg? }] }
 * Checks today's catch: closed seasons, minimum sizes, piece limits and the 5 kg daily limit.
 */
export async function POST(req: NextRequest) {
  let body: { date?: string; items?: CatchItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const date = body.date || zagrebDate(new Date());
  if (!isValidIsoDate(date)) return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  const items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  const clean = items
    .filter((i) => i && typeof i.key === "string")
    .map((i) => ({
      key: i.key,
      duljina_cm: Number.isFinite(Number(i.duljina_cm)) && i.duljina_cm != null ? Number(i.duljina_cm) : null,
      masa_kg: Number.isFinite(Number(i.masa_kg)) && i.masa_kg != null ? Number(i.masa_kg) : null,
    }));
  return NextResponse.json(checkCatch(loadRules(), date, clean));
}
