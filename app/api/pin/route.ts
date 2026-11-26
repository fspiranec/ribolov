import { NextRequest, NextResponse } from "next/server";
import { parsePinParams } from "@/lib/pin";
import { runPin } from "@/lib/pinServer";

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
    const result = await runPin(params);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
