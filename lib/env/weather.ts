import { TtlCache, grid } from "./cache";
import { TZ } from "./astro";

export interface Weather {
  sat: string; // "HH:00" local time the values refer to
  vjetar: { smjer_deg: number | null; brzina_kmh: number | null; udari_kmh: number | null; brzina_cv: number | null };
  temperatura_zraka_c: number | null;
  valovi: { visina_m: number | null; smjer_deg: number | null; period_s: number | null };
  temperatura_mora_c: number | null;
  struja: { brzina_kmh: number | null; smjer_deg: number | null };
  izvor: string;
}

type Hourly = { time: string[] } & Record<string, (number | null)[] | string[]>;
const cache = new TtlCache<{ marine: Hourly | null; forecast: Hourly | null }>(3600_000);

async function getJson(url: string): Promise<{ hourly: Hourly } | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return (await r.json()) as { hourly: Hourly };
  } catch {
    return null;
  }
}

/**
 * Wind, waves, sea temperature and currents from Open-Meteo for one hour of a day.
 * Responses are cached for 1 hour per 0.05° grid cell and date.
 * NOTE: Open-Meteo is free for non-commercial use only.
 */
async function fetchDay(lat: number, lon: number, isoDate: string) {
  const glat = grid(lat);
  const glon = grid(lon);
  const key = `${glat},${glon},${isoDate}`;
  let data = cache.get(key);
  if (!data) {
    const common = `latitude=${glat}&longitude=${glon}&start_date=${isoDate}&end_date=${isoDate}&timezone=${encodeURIComponent(TZ)}`;
    const [m, f] = await Promise.all([
      getJson(
        `https://marine-api.open-meteo.com/v1/marine?${common}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity,ocean_current_direction`,
      ),
      getJson(
        `https://api.open-meteo.com/v1/forecast?${common}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m,pressure_msl&wind_speed_unit=kmh`,
      ),
    ]);
    data = { marine: m?.hourly ?? null, forecast: f?.hourly ?? null };
    if (data.marine || data.forecast) cache.set(key, data);
  }
  return data;
}

/** Hourly series (24 values, local time) used by the fish-activity index. */
export interface DaySeries {
  tlak_hpa: (number | null)[];
  udari_kmh: (number | null)[];
  valovi_m: (number | null)[];
}

export async function getDaySeries(lat: number, lon: number, isoDate: string): Promise<DaySeries | null> {
  const data = await fetchDay(lat, lon, isoDate);
  if (!data.marine && !data.forecast) return null;
  const arr = (src: Hourly | null, k: string) =>
    Array.from({ length: 24 }, (_, i) => {
      const v = (src?.[k] as (number | null)[] | undefined)?.[i];
      return typeof v === "number" ? v : null;
    });
  return {
    tlak_hpa: arr(data.forecast, "pressure_msl"),
    udari_kmh: arr(data.forecast, "wind_gusts_10m"),
    valovi_m: arr(data.marine, "wave_height"),
  };
}

export async function getWeather(lat: number, lon: number, isoDate: string, hour: number): Promise<Weather | null> {
  const data = await fetchDay(lat, lon, isoDate);
  if (!data.marine && !data.forecast) return null;
  const h = Math.max(0, Math.min(23, hour));
  const pick = (src: Hourly | null, k: string): number | null => {
    const arr = src?.[k] as (number | null)[] | undefined;
    const v = arr?.[h];
    return typeof v === "number" ? v : null;
  };
  const kmh = pick(data.forecast, "wind_speed_10m");
  return {
    sat: `${String(h).padStart(2, "0")}:00`,
    vjetar: {
      smjer_deg: pick(data.forecast, "wind_direction_10m"),
      brzina_kmh: kmh,
      udari_kmh: pick(data.forecast, "wind_gusts_10m"),
      brzina_cv: kmh == null ? null : Math.round((kmh / 1.852) * 10) / 10,
    },
    temperatura_zraka_c: pick(data.forecast, "temperature_2m"),
    valovi: {
      visina_m: pick(data.marine, "wave_height"),
      smjer_deg: pick(data.marine, "wave_direction"),
      period_s: pick(data.marine, "wave_period"),
    },
    temperatura_mora_c: pick(data.marine, "sea_surface_temperature"),
    struja: { brzina_kmh: pick(data.marine, "ocean_current_velocity"), smjer_deg: pick(data.marine, "ocean_current_direction") },
    izvor: "Open-Meteo (Marine + Forecast API)",
  };
}
