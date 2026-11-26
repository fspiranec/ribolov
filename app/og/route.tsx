import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { parsePinParams } from "@/lib/pin";
import { runPin } from "@/lib/pinServer";
import { c, t } from "@/lib/i18n";

export const runtime = "nodejs";

const COLORS = { zeleno: "#059669", zuto: "#f59e0b", crveno: "#e11d48" } as const;

/** GET /og?lat=&lon= – 1200×630 link preview (WhatsApp, social networks): place and status. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const { params } = parsePinParams(new URLSearchParams({ lat: q.get("lat") ?? "", lon: q.get("lon") ?? "" }));
  let place = "Jadran";
  let status = "Pomoćnik za ribolov na moru";
  let sub = "Smiješ li loviti, što grize i kakvo je more";
  let color = "#0b2540";
  if (params) {
    try {
      const r = await runPin(params);
      place = r.mjesto?.naziv ?? `${params.lat.toFixed(3)}, ${params.lon.toFixed(3)}`;
      if (r.status === "ok" && r.semafor) {
        status = t(r.semafor, "hr");
        color = COLORS[r.semafor];
      } else status = c(r.razlog, "hr");
      sub = "Provjeri pravila, ribe i prognozu za ovo mjesto";
    } catch (e) {
      console.error(e);
    }
  }
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#0b2540,#123a5e)", color: "white", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4, opacity: 0.8 }}>RIBOLOV</div>
        <div style={{ fontSize: 96, fontWeight: 800, marginTop: 40, lineHeight: 1.05 }}>{place}</div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <div style={{ background: color, color: color === COLORS.zuto ? "#0b2540" : "white", borderRadius: 32, padding: "18px 36px", fontSize: 52, fontWeight: 800 }}>{status}</div>
        </div>
        <div style={{ fontSize: 34, marginTop: "auto", opacity: 0.8 }}>{sub}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
