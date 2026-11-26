import { cache } from "react";
import type { Metadata } from "next";
import { parsePinParams } from "@/lib/pin";
import { runPin } from "@/lib/pinServer";
import { c, type Lang } from "@/lib/i18n";
import { previewTitle } from "@/lib/preview";
import { Home, type Initial } from "./Home";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

/**
 * A shared link (?lat=..&lon=..) is answered on the server: the verdict is in the HTML
 * (works without JavaScript) and in the link preview. Defaults match the app: today,
 * recreational licence, shore fishing.
 */
const LANG_CODES = new Set(["hr", "en", "de", "it", "pl", "cs", "sl"]);

const initialFor = cache(async (lat: string, lon: string, date: string, mode: string, lang: string): Promise<Initial> => {
  const q = new URLSearchParams({ lat, lon });
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) q.set("date", date);
  if (mode === "brod" || mode === "podvodni") q.set("mode", mode);
  const { params } = parsePinParams(q);
  if (!params) return null;
  const extra = {
    ...(q.get("date") ? { date: params.date } : {}),
    ...(q.get("mode") ? { mode: params.mode } : {}),
    ...(LANG_CODES.has(lang) ? { lang: lang as Lang } : {}),
  };
  try {
    return { lat: params.lat, lon: params.lon, result: await runPin(params), ...extra };
  } catch (e) {
    console.error(e);
    return { lat: params.lat, lon: params.lon, result: null, ...extra };
  }
});

async function fromSearch(sp: Search): Promise<Initial> {
  const q = await sp;
  const lat = typeof q.lat === "string" ? q.lat : null;
  const lon = typeof q.lon === "string" ? q.lon : null;
  const s = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");
  return lat && lon ? initialFor(lat, lon, s("date"), s("mode"), s("lang")) : null;
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const init = await fromSearch(searchParams);
  const title = init && previewTitle(init.result, init.lat, init.lon);
  if (!init || !title) return {};
  const description = init.result ? c(init.result.razlog, "hr") : undefined;
  const image = `/og?lat=${init.lat}&lon=${init.lon}`;
  return {
    title: `${title} · Ribolov`,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }], type: "website", locale: "hr_HR" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({ searchParams }: { searchParams: Search }) {
  return <Home initial={await fromSearch(searchParams)} />;
}
