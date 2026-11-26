/**
 * Downloads the EMODnet Bathymetry DTM (mean depth) for the Croatian Adriatic as a
 * GeoTIFF via WCS, into data/bathymetry/adriatic.tif. The API reads it with geotiff.js.
 * Without the file the API falls back to the EMODnet REST depth service.
 *
 *   npm run import:emodnet                       # default bbox
 *   npm run import:emodnet -- 13.0,42.3,19.0,45.7  # minLon,minLat,maxLon,maxLat
 *
 * The full-resolution file for the default bbox is roughly 50–100 MB.
 * TODO: confirm coverage id against the WCS GetCapabilities if the request fails.
 */
import fs from "node:fs";
import path from "node:path";

const WCS = "https://ows.emodnet-bathymetry.eu/wcs";
const COVERAGE_IDS = ["emodnet__mean", "emodnet:mean"];
const [minLon, minLat, maxLon, maxLat] = (process.argv[2] ?? "13.0,42.3,19.0,45.7").split(",").map(Number);
const out = path.join(process.cwd(), "data/bathymetry/adriatic.tif");

async function main() {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  for (const id of COVERAGE_IDS) {
    const url =
      `${WCS}?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${encodeURIComponent(id)}` +
      `&format=image/tiff&subset=Lat(${minLat},${maxLat})&subset=Long(${minLon},${maxLon})`;
    console.log(`GET ${url}`);
    const r = await fetch(url);
    const type = r.headers.get("content-type") ?? "";
    if (!r.ok || !type.includes("tiff")) {
      console.warn(`  failed (HTTP ${r.status}, ${type}): ${(await r.text()).slice(0, 300)}`);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(out, buf);
    console.log(`  -> ${path.relative(process.cwd(), out)} (${(buf.length / 1e6).toFixed(1)} MB)`);
    return;
  }
  console.error("Download failed. The API will use the EMODnet REST depth service instead.");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
