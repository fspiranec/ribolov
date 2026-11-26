/**
 * Imports settlement names in Croatia from GeoNames (CC BY 4.0), used to name a
 * spot at sea, e.g. "Komiža · 2,1 km od mjesta".
 * Output: data/places.json
 *
 *   npm run import:places
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const URL_ZIP = "https://download.geonames.org/export/dump/HR.zip";

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "geonames-"));
  const zip = path.join(dir, "HR.zip");
  fs.writeFileSync(zip, Buffer.from(await (await fetch(URL_ZIP)).arrayBuffer()));
  // tar on Windows 10+ and most systems can extract zip archives
  const tar = process.platform === "win32" ? path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe") : "tar";
  execFileSync(tar, ["-xf", zip, "-C", dir]);
  const rows = fs.readFileSync(path.join(dir, "HR.txt"), "utf8").split("\n");
  const places = rows
    .map((l) => l.split("\t"))
    .filter((c) => c[6] === "P" && c[1])
    .map((c) => ({ naziv: c[1], lat: Number(c[4]), lon: Number(c[5]), stanovnika: Number(c[14]) || 0 }));
  fs.writeFileSync(path.join(process.cwd(), "data/places.json"), JSON.stringify({ izvor: "GeoNames (CC BY 4.0)", mjesta: places }));
  console.log(`${places.length} places -> data/places.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
