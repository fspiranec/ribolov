/**
 * Fetches a photo and a short description for each species in
 * data/species/species.yaml from Wikipedia (hr and en REST summary API).
 * Output: data/species/wiki.json  (text CC BY-SA; images from Wikimedia Commons)
 *
 *   npm run import:species
 *   npm run import:special   (data/species/special.yaml -> special_wiki.json)
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const DIR = path.join(process.cwd(), "data/species");
const UA = "ribolov-more-import/0.1 (open-source fishing rules app)";

type Summary = { extract?: string; thumbnail?: { source: string }; originalimage?: { source: string }; content_urls?: { desktop: { page: string } } };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wikipedia REST summary, politely: sequential calls, retry with backoff on HTTP 429. */
async function summary(lang: string, title: string): Promise<Summary | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(1500 * (attempt + 1));
    const r = await fetchSummary(lang, title);
    if (r.status === 429) continue;
    return r.ok ? ((await r.json()) as Summary) : null;
  }
  return null;
}

async function fetchSummary(lang: string, title: string) {
  return fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`, {
    headers: { "User-Agent": UA },
  });
}

// "special": protected / invasive / dangerous species (special.yaml).
const SPECIAL = process.argv[2] === "special";
const IN = SPECIAL ? "special.yaml" : "species.yaml";
const OUT = SPECIAL ? "special_wiki.json" : "wiki.json";

async function main() {
  const doc = yaml.load(fs.readFileSync(path.join(DIR, IN), "utf8")) as {
    // wiki: { hr, en } in species.yaml, [hr, en] in special.yaml
    vrste: { key: string; latinski: string; wiki: { hr: string; en: string } | [string, string] }[];
  };
  const out: Record<string, unknown> = {};
  for (const raw of doc.vrste) {
    const v = { ...raw, wiki: Array.isArray(raw.wiki) ? { hr: raw.wiki[0], en: raw.wiki[1] } : raw.wiki };
    const hr = await summary("hr", v.wiki.hr);
    const en = (await summary("en", v.wiki.en)) ?? (await summary("en", v.latinski));
    // English Wikipedia usually has a photo of the live fish; Croatian often shows a catch.
    const img = en?.thumbnail?.source ?? hr?.thumbnail?.source ?? null;
    out[v.key] = {
      slika: img,
      opis: { hr: hr?.extract ?? null, en: en?.extract ?? null },
      url: { hr: hr?.content_urls?.desktop.page ?? null, en: en?.content_urls?.desktop.page ?? null },
    };
    console.log(`${v.key.padEnd(10)} hr:${hr ? "ok" : "--"} en:${en ? "ok" : "--"} slika:${img ? "ok" : "--"}`);
  }
  fs.writeFileSync(path.join(DIR, OUT), JSON.stringify({ izvor: "Wikipedia (CC BY-SA), slike: Wikimedia Commons", vrste: out }, null, 1));
  console.log(`  -> data/species/${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
