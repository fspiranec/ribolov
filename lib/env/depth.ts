import fs from "node:fs";
import path from "node:path";
import { TtlCache } from "./cache";

export interface DepthResult {
  /** Elevation in metres relative to sea level (negative = below sea). */
  elevation_m: number;
  /** Positive depth in metres, or null if the point is on land. */
  dubina_m: number | null;
  izvor: string;
}

const cache = new TtlCache<DepthResult | null>(24 * 3600_000);
const TIF_DIR = path.join(process.cwd(), "data/bathymetry");

type Img = {
  bbox: number[];
  width: number;
  height: number;
  nodata: number | null;
  read: (x: number, y: number) => Promise<number>;
};
let images: Img[] | null = null;

/** Loads local EMODnet GeoTIFFs (created by scripts/import/emodnet.ts), if any. */
async function localImages(): Promise<Img[]> {
  if (images) return images;
  images = [];
  if (!fs.existsSync(TIF_DIR)) return images;
  const { fromFile } = await import("geotiff");
  for (const f of fs.readdirSync(TIF_DIR).filter((n) => n.endsWith(".tif"))) {
    const tiff = await fromFile(path.join(TIF_DIR, f));
    const img = await tiff.getImage();
    const nd = img.getGDALNoData();
    images.push({
      bbox: img.getBoundingBox(),
      width: img.getWidth(),
      height: img.getHeight(),
      nodata: nd,
      read: async (x, y) => {
        const r = (await img.readRasters({ window: [x, y, x + 1, y + 1] })) as unknown as ArrayLike<number>[];
        return Number(r[0][0]);
      },
    });
  }
  return images;
}

function toResult(elev: number, izvor: string): DepthResult {
  return { elevation_m: Math.round(elev * 10) / 10, dubina_m: elev < 0 ? Math.round(-elev * 10) / 10 : null, izvor };
}

async function fromLocal(lat: number, lon: number): Promise<DepthResult | null> {
  for (const im of await localImages()) {
    const [minX, minY, maxX, maxY] = im.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    const x = Math.min(im.width - 1, Math.floor(((lon - minX) / (maxX - minX)) * im.width));
    const y = Math.min(im.height - 1, Math.floor(((maxY - lat) / (maxY - minY)) * im.height));
    const v = await im.read(x, y);
    if (im.nodata != null && v === im.nodata) return null;
    if (!Number.isFinite(v)) return null;
    return toResult(v, "EMODnet Bathymetry DTM (lokalni GeoTIFF)");
  }
  return null;
}

/**
 * Fallback: EMODnet Bathymetry REST depth sample service.
 * TODO: confirm the response format against the live service; we accept `avg` or `mean`.
 */
async function fromRest(lat: number, lon: number): Promise<DepthResult | null> {
  const url = `https://rest.emodnet-bathymetry.eu/depth_sample?geom=POINT(${lon}%20${lat})`;
  const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) return null;
  const j = (await r.json()) as Record<string, unknown>;
  const v = Number(j.avg ?? j.mean);
  if (!Number.isFinite(v)) return null;
  return toResult(v, "EMODnet Bathymetry (REST)");
}

export async function getDepth(lat: number, lon: number): Promise<DepthResult | null> {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let res: DepthResult | null = null;
  try {
    res = (await fromLocal(lat, lon)) ?? (await fromRest(lat, lon));
  } catch {
    res = null;
  }
  cache.set(key, res);
  return res;
}
