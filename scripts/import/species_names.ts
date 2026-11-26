/**
 * Fetches the common name of each guide species in DE, IT, PL, CS and SL from the
 * Wikipedia language links of its English article. Written to data/species/names.json.
 * A title that is just the Latin name is ignored (then the app uses locales/*.json).
 *
 *   npm run import:species-names
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const LANGS = ["de", "it", "pl", "cs", "sl"];
const UA = "ribolov-more-import/0.1 (open-source fishing rules app)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function langlinks(title: string): Promise<Record<string, string>> {
  const q = new URLSearchParams({ action: "query", prop: "langlinks", titles: title, lllimit: "500", redirects: "1", format: "json", formatversion: "2" });
  for (let i = 0; i < 4; i++) {
    await sleep(1500 * (i + 1));
    const r = await fetch(`https://en.wikipedia.org/w/api.php?${q}`, { headers: { "User-Agent": UA } });
    if (r.status === 429) continue;
    const j = (await r.json()) as { query?: { pages?: { langlinks?: { lang: string; title: string }[] }[] } };
    const out: Record<string, string> = {};
    for (const l of j.query?.pages?.[0]?.langlinks ?? []) out[l.lang] = l.title;
    return out;
  }
  return {};
}

async function main() {
  const dir = path.join(process.cwd(), "data/species");
  const doc = yaml.load(fs.readFileSync(path.join(dir, "species.yaml"), "utf8")) as { vrste: { key: string; latinski: string; wiki: { en: string } }[] };
  const out: Record<string, Record<string, string>> = {};
  for (const v of doc.vrste) {
    const ll = await langlinks(v.wiki.en);
    out[v.key] = {};
    for (const l of LANGS) {
      const t = ll[l]?.replace(/\s*\(.*\)$/, "");
      if (t && t.toLowerCase() !== v.latinski.toLowerCase()) out[v.key][l] = t;
    }
    console.log(v.key.padEnd(10), JSON.stringify(out[v.key]));
  }
  fs.writeFileSync(path.join(dir, "names.json"), JSON.stringify(out, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
