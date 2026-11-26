import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { getPlace } from "@/lib/env/place";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "QR · Ribolov", robots: { index: false } };

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
/** Languages printed on the card for guests (the page itself uses ?lang). */
const CARD_LANGS: Lang[] = ["hr", "en", "de", "it", "pl", "cs", "sl"];

/**
 * /qr?lat=&lon=&naziv=&lang= – printable QR card for hosts (apartments, campsites).
 * The code opens the app at the host's location; the server answers that link (SSR).
 */
export default async function QrPage({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const lang = (LANGS.some((l) => l.code === q.lang) ? q.lang : "hr") as Lang;
  const lat = Number(one(q.lat));
  const lon = Number(one(q.lon));
  const naziv = one(q.naziv).slice(0, 60);
  // card size: A4 / A5 sheet or a small sticker
  const vel = (["a4", "a5", "naljepnica"] as const).find((v) => v === q.vel) ?? "a4";
  const SIZE = {
    a4: { card: "max-w-xl", qr: "w-64", text: "text-[14px]", page: "A4" },
    a5: { card: "max-w-md", qr: "w-48", text: "text-[12px]", page: "A5" },
    naljepnica: { card: "max-w-[260px]", qr: "w-36", text: "text-[10px]", page: "auto" },
  }[vel];
  const ok = one(q.lat) !== "" && one(q.lon) !== "" && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const link = ok ? `${proto}://${host}/?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}` : "";
  const place = ok ? await getPlace(lat, lon).catch(() => null) : null;
  const svg = ok ? await QRCode.toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b2540", light: "#ffffff" } }) : "";

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <div className="print:hidden">
        <a href={ok ? `/?lat=${lat}&lon=${lon}` : "/"} className="text-sm font-semibold text-sea-600">
          ← {t("backToMap", lang)}
        </a>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{t("qrTitle", lang)}</h1>
        <p className="mt-1 text-slate-600">{t("qrSub", lang)}</p>
      </div>

      {!ok ? (
        <p className="mt-6 rounded-2xl bg-amber-100 p-4 font-semibold text-amber-900">{t("qrNoLoc", lang)}</p>
      ) : (
        <>
          <form method="get" className="mt-4 flex gap-2 print:hidden">
            <input type="hidden" name="lat" value={lat} />
            <input type="hidden" name="lon" value={lon} />
            <input type="hidden" name="lang" value={lang} />
            <select name="vel" defaultValue={vel} aria-label={t("qrSize", lang)} className="rounded-2xl bg-sand-100 px-2 font-semibold">
              <option value="a4">A4</option>
              <option value="a5">A5</option>
              <option value="naljepnica">{t("qrSticker", lang)}</option>
            </select>
            <input
              name="naziv"
              defaultValue={naziv}
              maxLength={60}
              placeholder={t("qrName", lang)}
              aria-label={t("qrName", lang)}
              className="min-w-0 flex-1 rounded-2xl bg-sand-100 px-3 py-2.5 outline-none"
            />
            <button className="rounded-2xl bg-sand-100 px-4 font-bold">{t("update", lang)}</button>
          </form>

          {/* the printable card */}
          <style>{`@media print { @page { size: ${SIZE.page}; margin: 12mm } }`}</style>
          <section className={`mx-auto mt-5 rounded-3xl border-2 border-navy-900 bg-white p-6 text-center text-navy-900 ${SIZE.card}`}>
            <div className="flex items-center justify-center gap-2 text-sm font-bold tracking-widest">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="Ribolov" className="h-7 w-7 rounded-lg" /> RIBOLOV
            </div>
            {naziv && <div className="mt-2 text-xl font-extrabold">{naziv}</div>}
            {place && <div className={`${naziv ? "text-base font-semibold text-slate-600" : "mt-2 text-xl font-extrabold"}`}>{place.naziv}</div>}
            <div className={`mx-auto mt-4 max-w-full [&_svg]:h-auto [&_svg]:w-full ${SIZE.qr}`} role="img" aria-label={link} dangerouslySetInnerHTML={{ __html: svg }} />
            <ul className={`mt-4 space-y-0.5 font-semibold ${SIZE.text}`}>
              {CARD_LANGS.map((l) => (
                <li key={l}>{t("qrScan", l)}</li>
              ))}
            </ul>
            <div className="mt-3 break-all text-sm font-semibold text-navy-900">{link}</div>
          </section>

          <div className="mt-4 print:hidden">
            <PrintButton label={t("print", lang)} />
          </div>
        </>
      )}
    </main>
  );
}
