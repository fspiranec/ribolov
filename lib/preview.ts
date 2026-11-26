import { c, t } from "./i18n";
import type { PinResult } from "./pin";

/** Link preview text, e.g. "Koromačno: nema poznatih zabrana". */
export function previewTitle(r: PinResult | null, lat: number, lon: number): string | null {
  if (!r) return null;
  const place = r.mjesto?.naziv ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  if (r.status !== "ok" || !r.semafor) return `${place}: ${c(r.razlog, "hr")}`;
  const s = t(r.semafor, "hr");
  return `${place}: ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
}
