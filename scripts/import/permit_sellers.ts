/**
 * Imports the official list of licence sellers (Ministry, ribarstvo.mps.hr) and
 * geocodes each town once with OpenStreetMap Nominatim (max 1 request/second).
 * Output: data/permit_sellers.json
 *
 *   npm run import:sellers
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

const XLSX_URL = "https://ribarstvo.mps.hr/UserDocsImages/Tomo/Distributeri%20dozvola-POPIS%20UPDATE.xlsx";
const OUT = path.join(process.cwd(), "data/permit_sellers.json");
const UA = "ribolov-more-import/0.1 (open-source fishing rules app)";

type Seller = { naziv: string; adresa: string; grad: string; telefon: string[]; email: string | null; lat: number | null; lon: number | null };

function cellText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String((v as { text: unknown }).text).trim();
  return String(v).trim();
}

async function geocode(town: string): Promise<[number, number] | null> {
  const place = town.split("-").pop()!.replace(/\(.*\)/, "").trim();
  const q = new URLSearchParams({ q: `${place}, Hrvatska`, format: "json", limit: "1", countrycodes: "hr" });
  const r = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const j = (await r.json()) as { lat: string; lon: string }[];
  return j[0] ? [Number(j[0].lat), Number(j[0].lon)] : null;
}

async function main() {
  console.log(`GET ${XLSX_URL}`);
  const buf = Buffer.from(await (await fetch(XLSX_URL)).arrayBuffer());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  const sellers: Seller[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return; // header: Naziv, Adresa, Grad, Telefon, Telefon, e-mail
    const v = row.values as unknown[];
    const naziv = cellText(v[1]);
    if (!naziv) return;
    sellers.push({
      naziv,
      adresa: cellText(v[2]),
      grad: cellText(v[3]),
      telefon: [...new Set([cellText(v[4]), cellText(v[5])].filter(Boolean))],
      email: cellText(v[6]) || null,
      lat: null,
      lon: null,
    });
  });
  console.log(`${sellers.length} sellers`);

  const towns = [...new Set(sellers.map((s) => s.grad))];
  const coords = new Map<string, [number, number] | null>();
  for (const t of towns) {
    coords.set(t, await geocode(t).catch(() => null));
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim usage policy
  }
  for (const s of sellers) {
    const c = coords.get(s.grad);
    if (c) [s.lat, s.lon] = c;
  }
  const missing = towns.filter((t) => !coords.get(t));
  if (missing.length) console.warn(`! Not geocoded (${missing.length}): ${missing.join(", ")}`);
  fs.writeFileSync(
    OUT,
    JSON.stringify({ izvor: XLSX_URL, preuzeto: new Date().toISOString().slice(0, 10), prodavaci: sellers }, null, 1),
  );
  console.log(`  -> ${path.relative(process.cwd(), OUT)} (${sellers.length} sellers, ${towns.length - missing.length}/${towns.length} towns geocoded)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
