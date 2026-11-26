/**
 * Lists English texts that still need a translation in locales/*.json
 * (UI strings in lib/i18n.ts dict2 and {hr, en} texts in data YAML files).
 *
 *   npx tsx scripts/missing_translations.ts [lang]
 */
import fs from "node:fs";
import yaml from "js-yaml";
import { hasTr, type Lang } from "../lib/i18n";

const lang = (process.argv[2] ?? "de") as Lang;
const out = new Set<string>();

const walk = (v: unknown) => {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.hr === "string" && typeof o.en === "string" && !o[lang] && !hasTr(o.en, lang)) out.add(o.en);
    Object.values(o).forEach(walk);
  }
};
for (const f of ["data/recipes.yaml", "data/species/special.yaml", "data/species/species.yaml"]) walk(yaml.load(fs.readFileSync(f, "utf8")));
for (const f of fs.readdirSync("rules")) walk(yaml.load(fs.readFileSync(`rules/${f}`, "utf8")));

const src = fs.readFileSync("lib/i18n.ts", "utf8");
const i = src.indexOf("const dict2 = {");
const block = src.slice(i, src.indexOf("} as const", i));
for (const m of block.matchAll(/^\s{2}\w+: \[\s*"(?:[^"\\]|\\.)*",\s*"((?:[^"\\]|\\.)*)"\s*,?\s*\]/gm)) if (!hasTr(m[1], lang)) out.add(m[1]);

console.log(JSON.stringify([...out], null, 1));
