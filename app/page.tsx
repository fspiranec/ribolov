import { cache } from "react";
import type { Metadata } from "next";
import { parsePinParams } from "@/lib/pin";
import { runPin } from "@/lib/pinServer";
import { c } from "@/lib/i18n";
import { previewTitle } from "@/lib/preview";
import { Home, type Initial } from "./Home";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

/**
 * A shared link (?lat=..&lon=..) is answered on the server: the verdict is in the HTML
 * (works without JavaScript) and in the link preview. Defaults match the app: today,
 * recreational licence, shore fishing.
 */
const initialFor = cache(async (lat: string, lon: string): Promise<Initial> => {
  const { params } = parsePinParams(new URLSearchParams({ lat, lon }));
  if (!params) return null;
  try {
    return { lat: params.lat, lon: params.lon, result: await runPin(params) };
  } catch (e) {
    console.error(e);
    return { lat: params.lat, lon: params.lon, result: null };
  }
});

async function fromSearch(sp: Search): Promise<Initial> {
  const q = await sp;
  const lat = typeof q.lat === "string" ? q.lat : null;
  const lon = typeof q.lon === "string" ? q.lon : null;
  return lat && lon ? initialFor(lat, lon) : null;
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
