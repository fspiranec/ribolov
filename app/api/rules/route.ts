import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { loadRules } from "@/lib/rules/load";
import { toIso } from "@/lib/rules/dates";

export const runtime = "nodejs";

let cached: { verzija: string; body: string } | null = null;

/** Rule bundle + content hash. The hash changes whenever any file in /rules changes. */
function bundle() {
  if (cached) return cached;
  const dir = path.join(process.cwd(), "rules");
  const files = fs.readdirSync(dir).filter((n) => n.endsWith(".yaml")).sort();
  const hash = crypto.createHash("sha256");
  for (const f of files) hash.update(f).update(fs.readFileSync(path.join(dir, f)));
  const verzija = hash.digest("hex").slice(0, 16);
  const rules = loadRules();
  const dates = [rules.general, rules.closedSeasons, rules.minSizes, rules.prohibited, rules.areas, rules.permits]
    .map((r) => toIso(r.zadnja_provjera) ?? "")
    .sort();
  const body = JSON.stringify({ verzija, zadnja_provjera: dates[0], pravila: rules });
  cached = { verzija, body };
  return cached;
}

/**
 * GET /api/rules            – full rule bundle for offline use (mobile app), with ETag.
 * GET /api/rules?samo=verzija – just { verzija }, to check cheaply whether to re-download.
 */
export async function GET(req: NextRequest) {
  const b = bundle();
  if (req.nextUrl.searchParams.get("samo") === "verzija") return NextResponse.json({ verzija: b.verzija });
  const etag = `"${b.verzija}"`;
  if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  return new NextResponse(b.body, { headers: { "Content-Type": "application/json", ETag: etag, "Cache-Control": "no-cache" } });
}
