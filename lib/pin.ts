import { inAnyPeriod, inPeriod, isValidIsoDate, toIso, validOn } from "./rules/dates";
import type { AreaRule, Level, Mode, Permit, RuleSet, Source, SpecialPermit, Text } from "./rules/types";
import type { ZoneHit, ZoneProvider } from "./zones/types";
import { hmToMinutes, sunMoon, zagrebDate, zagrebHM, type SunMoon } from "./env/astro";
import type { DepthResult } from "./env/depth";
import type { DaySeries, Weather } from "./env/weather";
import { computeActivity, type Activity } from "./env/activity";
import type { Place } from "./env/place";

export const PERMITS: Permit[] = ["rekreacijska", "sportska"];
export const SPECIAL: SpecialPermit[] = ["parangal", "vrse", "osti", "rasvjeta", "velika_riba"];
export const MODES: Mode[] = ["obala", "brod", "podvodni"];

/** Pins within this distance of an area boundary get a "near boundary" warning. */
const BOUNDARY_M = 100;
/** Search radius for nearby features (ports, beaches, farms). */
const SEARCH_RADIUS_M = 20_000;
const RANK: Record<Level, number> = { zeleno: 0, zuto: 1, crveno: 2 };

export interface PinParams {
  lat: number;
  lon: number;
  date: string;
  /** Local time "HH:MM" (Europe/Zagreb); used for spearfishing daylight checks. */
  time?: string;
  permit: Permit;
  special: SpecialPermit[];
  mode: Mode;
}

export interface SourceRef {
  izvor: string;
  clanak: string;
  url: string | null;
  vrijedi_od: string | null;
  vrijedi_do: string | null;
  napomena: string | Text | null;
  needs_legal_check: boolean;
  zadnja_provjera: string;
}

export interface Notice {
  razina: Level | "obavijest";
  tekst: Text;
  /** Proper name shown after the text (e.g. an area name); not translated. */
  naziv?: string;
  izvor?: SourceRef;
}

export interface ToolOut {
  id: string;
  naziv: Text;
  opis?: Text;
  detalj?: Text;
  /** Special permit needed for this gear (key), and its name and price if sold separately. */
  posebna_dozvola: string | null;
  posebna_dozvola_naziv?: Text;
  posebna_dozvola_cijena_eur?: number;
  max: number | null;
  dopusteno: boolean;
  razlog?: Text;
  napomena?: Text;
  izvor: SourceRef;
}

export interface PinResult {
  status: "ok" | "izvan_ribolovnog_mora";
  upit: PinParams;
  semafor: Level | null;
  razlog: Text;
  izvor: SourceRef | null;
  gdje: {
    ribolovna_zona: string | null;
    podzona: string | null;
    podrucja: { naziv: string | null; sloj: string; razina: string }[];
    natura2000: string[];
    udaljenost_luka_m: number | null;
    udaljenost_plaza_m: number | null;
    udaljenost_uzgajaliste_m: number | null;
  };
  alati: ToolOut[];
  danas: {
    lovostaj: { vrsta: Text; razdoblja: { od: string; do: string }[]; napomena: Text | null; izvor: SourceRef }[];
    uvijek: Notice[];
    trajno_zabranjene: { vrsta: Text; izvor: SourceRef }[];
    strogo_zasticene: { vrste: Text; izvor: SourceRef };
    min_velicine: { vrsta: Text; min: string; napomena: Text | null; izvor: SourceRef }[];
    tolerancija: Notice;
    dnevna_ogranicenja: Notice[];
    zabranjeno: Notice[];
    oznacavanje: Notice & { vrste_djelomicno: string[] };
    evidencija: Notice & { faze: { od: string; tekst: Text; na_snazi: boolean }[] };
    bez_dozvole: Notice;
  } | null;
  obavijesti: Notice[];
  upozorenja: Notice[];
  dubina: DepthResult | null;
  /** True when the point is on land (shore fishing, e.g. from GPS). */
  na_kopnu: boolean;
  /** Nearest place name (reverse geocoded), for the header. */
  mjesto: Place | null;
  /** Where to buy a licence: online shop, prices, nearest authorised sellers. */
  dozvola: PermitInfo;
  /** Nearest fishing-tackle shops (partners first). */
  trgovine: (Shop & { udaljenost_km: number })[];
  vrijeme: Weather | null;
  sunce_mjesec: SunMoon;
  /** Heuristic fish-activity forecast (solunar + weather). Not a rule. */
  aktivnost: Activity | null;
  /** Today and the next two days: activity score and the roughest wind/waves in daylight. */
  sljedeci_dani: { datum: string; ocjena: number; oznaka: Text; udari_max_kmh: number | null; valovi_max_m: number | null }[];
  /** Timely reminders: sunset soon, closed season starting or ending within a week. */
  podsjetnici: Notice[];
  zadnja_provjera: string;
  odricanje: Text;
}

export interface PinDeps {
  rules: RuleSet;
  zones: ZoneProvider;
  getDepth?: (lat: number, lon: number) => Promise<DepthResult | null>;
  getWeather?: (lat: number, lon: number, date: string, hour: number) => Promise<Weather | null>;
  getDaySeries?: (lat: number, lon: number, date: string) => Promise<DaySeries | null>;
  sellers?: PermitSeller[];
  shops?: Shop[];
  getPlace?: (lat: number, lon: number) => Promise<Place | null>;
  now?: () => Date;
}

// ---------------------------------------------------------------- params

export function parsePinParams(q: URLSearchParams, now = new Date()): { params?: PinParams; error?: string } {
  const lat = Number(q.get("lat"));
  const lon = Number(q.get("lon"));
  if (!q.get("lat") || !q.get("lon") || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return { error: "lat/lon missing or invalid" };
  const date = q.get("date") || zagrebDate(now);
  if (!isValidIsoDate(date)) return { error: "date must be YYYY-MM-DD" };
  const time = q.get("time") || undefined;
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: "time must be HH:MM" };
  // permit=sportska,parangal,vrse  (base permit + special permits), or posebne=... separately
  const tokens = [...(q.get("permit") ?? "rekreacijska").split(","), ...(q.get("posebne") ?? "").split(",")]
    .map((s) => s.trim())
    .filter(Boolean);
  const base = tokens.filter((t) => (PERMITS as string[]).includes(t));
  if (base.length > 1) return { error: "only one base permit allowed" };
  const special = tokens.filter((t) => (SPECIAL as string[]).includes(t)) as SpecialPermit[];
  const unknown = tokens.filter((t) => !(PERMITS as string[]).includes(t) && !(SPECIAL as string[]).includes(t));
  if (unknown.length) return { error: `unknown permit: ${unknown.join(",")}` };
  const mode = (q.get("mode") ?? "obala") as Mode;
  if (!MODES.includes(mode)) return { error: "mode must be obala | brod | podvodni" };
  return { params: { lat, lon, date, time, permit: (base[0] ?? "rekreacijska") as Permit, special: [...new Set(special)], mode } };
}

// ---------------------------------------------------------------- helpers

function ref(r: Source, zadnja: string | Date): SourceRef {
  return {
    izvor: r.izvor,
    clanak: r.clanak ?? "",
    url: r.url ?? null,
    vrijedi_od: toIso(r.vrijedi_od),
    vrijedi_do: toIso(r.vrijedi_do),
    napomena: r.napomena ?? null,
    needs_legal_check: Boolean(r.needs_legal_check),
    zadnja_provjera: toIso(zadnja) ?? "",
  };
}

const T = (hr: string, en: string): Text => ({ hr, en });

function periodText(p: { od: string; do: string }): string {
  const f = (s: string) => {
    const [m, d] = s.split("-").map(Number);
    return `${d}. ${m}.`;
  };
  return `${f(p.od)} – ${f(p.do)}`;
}

interface Candidate {
  level: Level;
  priority: number;
  razlog: Text;
  izvor: SourceRef;
}

// ---------------------------------------------------------------- main

export async function evaluatePin(p: PinParams, deps: PinDeps): Promise<PinResult> {
  const { rules } = deps;
  const now = deps.now?.() ?? new Date();
  const g = rules.general;
  const zp = g.zadnja_provjera;
  const areaRules = new Map(rules.areas.podrucja.map((r) => [r.key, r] as const));
  const gref = (r: Source) => ref(r, zp);
  const aref = (r: AreaRule) => ref(r, rules.areas.zadnja_provjera);

  const sm = sunMoon(p.lat, p.lon, p.date);
  const obavijesti: Notice[] = [];
  const upozorenja: Notice[] = [];
  const base: PinResult = {
    status: "ok",
    upit: p,
    semafor: null,
    razlog: T("", ""),
    izvor: null,
    gdje: {
      ribolovna_zona: null,
      podzona: null,
      podrucja: [],
      natura2000: [],
      udaljenost_luka_m: null,
      udaljenost_plaza_m: null,
      udaljenost_uzgajaliste_m: null,
    },
    alati: [],
    danas: null,
    obavijesti,
    upozorenja,
    dubina: null,
    na_kopnu: false,
    mjesto: null,
    dozvola: permitInfo(rules, p, deps.sellers ?? []),
    trgovine: nearestShops(p, deps.shops ?? []),
    vrijeme: null,
    sunce_mjesec: sm,
    aktivnost: null,
    sljedeci_dani: [],
    podsjetnici: [],
    zadnja_provjera: toIso(zp) ?? "",
    odricanje: g.odricanje,
  };

  // 1. Inside the Croatian fishing sea?
  const [hits, loaded] = await Promise.all([deps.zones.query(p.lat, p.lon, SEARCH_RADIUS_M), deps.zones.loadedLayers()]);
  const sea = hits.filter((h) => h.layer === "hr_more");
  if (!sea.some((h) => h.inside)) {
    return {
      ...base,
      status: "izvan_ribolovnog_mora",
      razlog: T("Točka nije u ribolovnom moru Republike Hrvatske.", "The point is not in the Croatian fishing sea."),
    };
  }
  // (The sea boundary is still approximate – tracked in TODO.md, not shown to users.)

  // Depth also tells us whether the point is on land (islands are inside the sea polygon).
  const hour = p.time ? Number(p.time.slice(0, 2)) : p.date === zagrebDate(now) ? Number(zagrebHM(now).slice(0, 2)) : 12;
  const [dubina, vrijeme, series, mjesto] = await Promise.all([
    deps.getDepth ? deps.getDepth(p.lat, p.lon).catch(() => null) : Promise.resolve(null),
    deps.getWeather ? deps.getWeather(p.lat, p.lon, p.date, hour).catch(() => null) : Promise.resolve(null),
    deps.getDaySeries ? deps.getDaySeries(p.lat, p.lon, p.date).catch(() => null) : Promise.resolve(null),
    deps.getPlace ? deps.getPlace(p.lat, p.lon).catch(() => null) : Promise.resolve(null),
  ]);
  base.mjesto = mjesto;
  base.dubina = dubina;
  base.vrijeme = vrijeme;
  base.aktivnost = computeActivity(p.lat, p.lon, p.date, sm, series);

  // Next days (forecast data for days 2–3 is fetched in parallel; cached per day).
  const days = [0, 1, 2].map((k) => addDays(p.date, k));
  const later = await Promise.all(
    days.slice(1).map((d) => (deps.getDaySeries ? deps.getDaySeries(p.lat, p.lon, d).catch(() => null) : Promise.resolve(null))),
  );
  base.sljedeci_dani = days.map((d, i) => {
    const ser = i === 0 ? series : later[i - 1];
    const a = i === 0 ? base.aktivnost! : computeActivity(p.lat, p.lon, d, sunMoon(p.lat, p.lon, d), ser);
    const daylight = (arr?: (number | null)[]) => {
      const v = (arr ?? []).slice(6, 21).filter((x): x is number => x != null);
      return v.length ? Math.max(...v) : null;
    };
    return { datum: d, ocjena: a.dnevna_ocjena, oznaka: a.oznaka, udari_max_kmh: daylight(ser?.udari_kmh), valovi_max_m: daylight(ser?.valovi_m) };
  });

  // Reminders.
  if (p.date === zagrebDate(now) && sm.zalazak) {
    const left = hmToMinutes(sm.zalazak) - hmToMinutes(zagrebHM(now));
    if (left > 0 && left <= 60)
      base.podsjetnici.push({
        razina: p.mode === "podvodni" ? "zuto" : "obavijest",
        tekst: T(
          `Zalazak sunca za ${left} min (${sm.zalazak}).${p.mode === "podvodni" ? " Podvodni ribolov tada mora završiti." : ""}`,
          `Sunset in ${left} min (${sm.zalazak}).${p.mode === "podvodni" ? " Spearfishing must stop then." : ""}`,
        ),
      });
  }
  const Cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  for (const cs of rules.closedSeasons.lovostaji) {
    const today = inAnyPeriod(p.date, cs.razdoblja);
    for (let k = 1; k <= 7; k++) {
      const d = addDays(p.date, k);
      if (inAnyPeriod(d, cs.razdoblja) !== today) {
        const dd = `${Number(d.slice(8))}. ${Number(d.slice(5, 7))}.`;
        base.podsjetnici.push({
          razina: "obavijest",
          tekst: today
            ? T(`${Cap(cs.vrsta.hr)}: lovostaj završava – od ${dd} opet se smije loviti.`, `${Cap(cs.vrsta.en)}: closed season ends – open again from ${dd}`)
            : T(`${Cap(cs.vrsta.hr)}: od ${dd} počinje lovostaj.`, `${Cap(cs.vrsta.en)}: closed season starts on ${dd}`),
        });
        break;
      }
    }
  }
  // On land (e.g. GPS position of someone fishing from the shore): keep evaluating,
  // the area rules (beach, port, park) apply to the shore and the sea in front of it.
  if (dubina && dubina.dubina_m == null) {
    base.na_kopnu = true;
    obavijesti.push({
      razina: "obavijest",
      tekst: T(
        "Na kopnu si – pravila vrijede za ribolov s obale i more ispred tebe.",
        "You are on land – the rules apply to shore fishing and the sea in front of you.",
      ),
    });
    if (p.mode !== "obala")
      upozorenja.push({
        razina: "zuto",
        tekst: T("S kopna se lovi s obale – odaberi način „S obale”.", "From land you fish from the shore – choose “Shore”."),
      });
    if (dubina.elevation_m > 30)
      upozorenja.push({
        razina: "zuto",
        tekst: T(
          `Točka je ${Math.round(dubina.elevation_m)} m iznad mora – jesi li uz obalu? Provjeri.`,
          `The point is ${Math.round(dubina.elevation_m)} m above sea level – are you at the shore? Check.`,
        ),
      });
  }
  if (!dubina) {
    obavijesti.push({
      razina: "obavijest",
      tekst: T("Dubina nije dostupna; nije provjereno je li točka na kopnu.", "Depth unavailable; land check skipped."),
    });
  }

  // 2–3. Spatial rules.
  const candidates: Candidate[] = [];
  let allowedHere = null as Set<string> | null;
  let lightsBanned = false;
  const d = p.date;

  for (const hit of hits) {
    if (hit.layer === "hr_more") continue;
    const rule = areaRules.get(hit.rule_key);
    if (!rule) {
      upozorenja.push({ razina: "zuto", tekst: T(`Nepoznato pravilo: ${hit.rule_key}`, `Unknown rule: ${hit.rule_key}`) });
      continue;
    }
    if (!validOn(d, rule)) continue;
    const label = hit.name ?? rule.key;

    // Effective distance to the edge of the area the rule covers.
    const buffer = rule.udaljenost_m ?? 0;
    let applies = false;
    let level: Level | "obavijest" = rule.razina;
    let razlog = rule.razlog;
    if (hit.geomKind === "polygon" && hit.inside) applies = true;
    else if (buffer > 0 && hit.distance_m <= buffer) applies = true;
    else if (rule.blizina_m && hit.distance_m <= rule.blizina_m) {
      applies = true;
      level = rule.blizina_razina ?? "zuto";
      razlog = rule.razlog_blizina ?? rule.razlog;
    }

    const seasonActive = !rule.sezona || inPeriod(d, rule.sezona);
    const edge = buffer > 0 ? Math.abs(hit.distance_m - buffer) : hit.boundary_m;
    if (rule.razina !== "obavijest" && seasonActive && edge != null && edge <= BOUNDARY_M && hit.geomKind !== "point") {
      upozorenja.push({
        razina: "zuto",
        tekst: T(
          `Blizu granice – provjeri: ${label} (${Math.round(edge)} m).`,
          `Near a boundary – check: ${label} (${Math.round(edge)} m).`,
        ),
        izvor: aref(rule),
      });
      if (!applies)
        candidates.push({
          level: "zuto",
          priority: rule.priority,
          razlog: T(`Blizu granice područja: ${label} – provjeri.`, `Close to the boundary of: ${label} – check.`),
          izvor: aref(rule),
        });
    }
    if (!applies) continue;

    if (["ihtioloski_rezervat", "stroga_zastita", "nacionalni_park", "posebni_rezervat_more", "park_prirode", "telascica_obalni_pojas", "posebno_staniste", "posebna_regulacija", "luka", "plaza", "uzgajaliste"].includes(rule.layer))
      base.gdje.podrucja.push({ naziv: hit.name, sloj: rule.layer, razina: level });

    if (!seasonActive) {
      obavijesti.push({
        razina: "obavijest",
        tekst: T(
          `${label}: zabrana vrijedi samo ${periodText(rule.sezona!)}; danas ne vrijedi.`,
          `${label}: the ban applies only ${periodText(rule.sezona!)}; not today.`,
        ),
        izvor: aref(rule),
      });
      continue;
    }

    if (level === "obavijest") {
      if (rule.layer === "natura2000") base.gdje.natura2000.push(hit.name ?? "Natura 2000");
      else if (rule.layer === "ribolovna_zona") {
        base.gdje.ribolovna_zona = (hit.props.zona as string) ?? hit.name;
        base.gdje.podzona = (hit.props.podzona as string) ?? null;
      }
      obavijesti.push({ razina: "obavijest", tekst: rule.razlog, naziv: hit.name ?? undefined, izvor: aref(rule) });
      continue;
    }

    if (hit.placeholder) {
      upozorenja.push({
        razina: "zuto",
        tekst: T(
          `Granice područja „${label}” su približne – ako si blizu ruba, provjeri na licu mjesta.`,
          `The boundaries of "${label}" are approximate – if you are near the edge, check locally.`,
        ),
      });
      if (level === "crveno") level = "zuto";
    }
    // needs_legal_check stays in the API (izvor.needs_legal_check) for review; not shown to users.
    candidates.push({ level, priority: rule.priority, razlog, izvor: aref(rule) });

    if (rule.dopusteni_alati) {
      const s = new Set(rule.dopusteni_alati);
      allowedHere = allowedHere ? new Set([...allowedHere].filter((x) => s.has(x))) : s;
    }
    if (rule.zabrana_rasvjete) lightsBanned = true;
  }

  // Missing data layers: never show green when we cannot know.
  const missing = rules.areas.podrucja.filter((r) => r.kritican && !loaded.has(r.layer)).map((r) => r.layer);
  const uniqueMissing = [...new Set(missing)];
  if (uniqueMissing.length) {
    candidates.push({
      level: "zuto",
      priority: 50,
      razlog: T(
        `Podaci nisu potpuni (nisu učitani slojevi: ${uniqueMissing.join(", ")}) – provjeri.`,
        `Data incomplete (layers not loaded: ${uniqueMissing.join(", ")}) – check.`,
      ),
      izvor: aref(areaRules.get(uniqueMissing[0]) ?? rules.areas.podrucja[0]),
    });
  }
  if (!loaded.has("uzgajaliste")) {
    obavijesti.push({
      razina: "obavijest",
      tekst: T(
        "Podaci o uzgajalištima nisu učitani: ribolov je zabranjen unutar 300 m od uzgajališta ribe i 50 m od uzgajališta školjkaša.",
        "Fish-farm data not loaded: fishing is prohibited within 300 m of fish farms and 50 m of shellfish farms.",
      ),
      izvor: aref(areaRules.get("uzgajaliste_riba")!),
    });
  }

  // 7. Spearfishing.
  if (p.mode === "podvodni") {
    const pr = gref(g.podvodni);
    obavijesti.push({ razina: "obavijest", tekst: g.podvodni.podsjetnik, izvor: pr });
    if (p.permit !== "sportska") {
      candidates.push({
        level: "crveno",
        priority: 0,
        razlog: T("Podvodni ribolov dopušten je samo uz sportsku dozvolu.", "Spearfishing is allowed only with a sport licence."),
        izvor: pr,
      });
    }
    const t = p.time ?? (p.date === zagrebDate(now) ? zagrebHM(now) : null);
    if (t && sm.izlazak && sm.zalazak) {
      const m = hmToMinutes(t);
      if (m < hmToMinutes(sm.izlazak) || m > hmToMinutes(sm.zalazak)) {
        candidates.push({
          level: "crveno",
          priority: 0,
          razlog: T(
            `Podvodni ribolov samo od izlaska (${sm.izlazak}) do zalaska sunca (${sm.zalazak}); sada je ${t}.`,
            `Spearfishing only from sunrise (${sm.izlazak}) to sunset (${sm.zalazak}); it is now ${t}.`,
          ),
          izvor: pr,
        });
      }
    } else {
      obavijesti.push({
        razina: "obavijest",
        tekst: T(
          `Podvodni ribolov samo od izlaska (${sm.izlazak}) do zalaska sunca (${sm.zalazak}).`,
          `Spearfishing only from sunrise (${sm.izlazak}) to sunset (${sm.zalazak}).`,
        ),
        izvor: pr,
      });
    }
  }

  // 5. Strictest level wins; the rest become notices.
  candidates.sort((a, b) => RANK[b.level] - RANK[a.level] || a.priority - b.priority);
  const top = candidates[0];
  if (top) {
    base.semafor = top.level;
    base.razlog = top.razlog;
    base.izvor = top.izvor;
    for (const c of candidates.slice(1)) obavijesti.push({ razina: c.level, tekst: c.razlog, izvor: c.izvor });
  } else {
    base.semafor = "zeleno";
    base.razlog = T(
      "Nema poznatih prostornih zabrana za ovu točku; poštuj opća pravila ispod.",
      "No known area restrictions at this point; follow the general rules below.",
    );
    base.izvor = gref(g.bez_dozvole);
  }

  // Distances to nearest port / beach / farm.
  const nearest = (layer: string) => {
    const ds = hits.filter((h) => h.layer === layer).map((h) => h.distance_m);
    return ds.length ? Math.round(Math.min(...ds)) : null;
  };
  base.gdje.udaljenost_luka_m = nearest("luka");
  base.gdje.udaljenost_plaza_m = nearest("plaza");
  base.gdje.udaljenost_uzgajaliste_m = nearest("uzgajaliste");

  // 4. Tools for this permit and mode.
  for (const t of g.alati) {
    if (!t.nacini.includes(p.mode)) continue;
    const sp = rules.permits.posebne.cijene.find((x) => x.key === t.posebna_dozvola);
    const out: ToolOut = {
      id: t.id,
      naziv: t.naziv,
      opis: t.opis,
      detalj: t.detalj,
      posebna_dozvola: t.posebna_dozvola,
      posebna_dozvola_naziv: sp?.naziv,
      posebna_dozvola_cijena_eur: sp?.cijena_eur,
      max: t.max,
      dopusteno: true,
      izvor: gref(t),
    };
    if (t.samo_dozvola && t.samo_dozvola !== p.permit) {
      out.dopusteno = false;
      out.razlog = T("Samo uz sportsku dozvolu (ne vrijedi rekreacijska).", "Sport licence only (not the recreational one).");
    } else if (t.posebna_dozvola && !p.special.includes(t.posebna_dozvola)) {
      out.dopusteno = false;
      out.razlog = T(`Treba posebna dozvola: ${(sp?.naziv.hr ?? t.naziv.hr).toLowerCase()}.`, `Needs a special permit: ${(sp?.naziv.en ?? t.naziv.en).toLowerCase()}.`);
    } else if (allowedHere && !allowedHere.has(t.id) && t.id !== "rucno_sakupljanje") {
      out.dopusteno = false;
      out.razlog = T("Nije dopušteno na ovom području.", "Not allowed in this area.");
    } else if (t.id === "rasvjeta" && lightsBanned) {
      out.dopusteno = false;
      out.razlog = T("Rasvjeta nije dopuštena na ovom području.", "Lights are not allowed in this area.");
    }
    if (t.zabrana_glavonosci && inPeriod(d, t.zabrana_glavonosci)) {
      out.napomena = T(
        `Rasvjeta za glavonošce zabranjena je ${periodText(t.zabrana_glavonosci)}; danas je dopuštena samo uz ost.`,
        `Lights for cephalopods are banned ${periodText(t.zabrana_glavonosci)}; today only allowed with a spear.`,
      );
    }
    base.alati.push(out);
  }

  // 4b. Today: closed seasons and species rules.
  const cs = rules.closedSeasons;
  const ms = rules.minSizes;
  const ph = rules.prohibited;
  base.danas = {
    lovostaj: cs.lovostaji
      .filter((c) => validOn(d, c) && inAnyPeriod(d, c.razdoblja))
      .map((c) => ({
        vrsta: c.vrsta,
        razdoblja: c.razdoblja,
        napomena: (c.napomena as Text | undefined) ?? null,
        izvor: ref(c, cs.zadnja_provjera),
      })),
    uvijek: cs.uvijek.map((u) => ({ razina: "obavijest" as const, tekst: u.tekst, izvor: ref(u, cs.zadnja_provjera) })),
    trajno_zabranjene: ph.zabranjene.filter((z) => validOn(d, z)).map((z) => ({ vrsta: z.vrsta, izvor: ref(z, ph.zadnja_provjera) })),
    strogo_zasticene: { vrste: ph.strogo_zasticene.vrste, izvor: ref(ph.strogo_zasticene, ph.zadnja_provjera) },
    min_velicine: ms.velicine
      .filter((v) => validOn(d, v))
      .map((v) => ({ vrsta: v.vrsta, min: v.min, napomena: (v.napomena as Text | undefined) ?? null, izvor: ref(v, ms.zadnja_provjera) })),
    tolerancija: { razina: "obavijest", tekst: ms.tolerancija.tekst, izvor: ref(ms.tolerancija, ms.zadnja_provjera) },
    dnevna_ogranicenja: g.dnevna_ogranicenja.map((r) => ({ razina: "obavijest" as const, tekst: r.tekst, izvor: gref(r) })),
    zabranjeno: g.zabranjeno.map((r) => ({ razina: "obavijest" as const, tekst: r.tekst, izvor: gref(r) })),
    oznacavanje: { razina: "obavijest", tekst: g.oznacavanje.tekst, izvor: gref(g.oznacavanje), vrste_djelomicno: g.oznacavanje.vrste_djelomicno },
    evidencija: {
      razina: "obavijest",
      tekst: g.evidencija.tekst,
      izvor: gref(g.evidencija),
      faze: g.evidencija.faze.map((f) => {
        const od = toIso(f.od) ?? "";
        return { od, tekst: f.tekst, na_snazi: od <= d };
      }),
    },
    bez_dozvole: { razina: "obavijest", tekst: g.bez_dozvole.tekst, izvor: gref(g.bez_dozvole) },
  };

  return base;
}

// ---------------------------------------------------------------- permits

export interface PermitSeller {
  naziv: string;
  adresa: string;
  grad: string;
  telefon: string[];
  email: string | null;
  lat: number | null;
  lon: number | null;
}

export interface PermitInfo {
  online_url: string;
  info_url: string;
  opis: Text;
  cijene: { trajanje: Text; cijena_eur: number }[];
  posebne: { napomena: Text; cijene: { key: string; naziv: Text; cijena_eur: number }[] };
  sportska: Text;
  djeca: Text;
  mrecfish: { info_url: string; ios_url: string; tekst: Text };
  najblizi_prodavaci: (PermitSeller & { udaljenost_km: number })[];
  izvor: SourceRef;
}

function km(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function permitInfo(rules: RuleSet, p: PinParams, sellers: PermitSeller[]): PermitInfo {
  const pr = rules.permits;
  return {
    online_url: pr.online_url,
    info_url: pr.info_url,
    opis: pr.opis,
    cijene: pr.cijene,
    posebne: pr.posebne,
    sportska: pr.sportska,
    djeca: pr.djeca,
    mrecfish: pr.mrecfish,
    najblizi_prodavaci: sellers
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => ({ ...s, udaljenost_km: Math.round(km(p.lat, p.lon, s.lat!, s.lon!) * 10) / 10 }))
      .sort((a, b) => a.udaljenost_km - b.udaljenost_km)
      .slice(0, 3),
    izvor: ref({ izvor: pr.izvor, url: pr.online_url, clanak: "–" }, pr.zadnja_provjera),
  };
}

export interface Shop {
  naziv: string;
  adresa: string;
  grad: string;
  telefon: string[];
  web: string | null;
  radno_vrijeme: string | null;
  lat: number | null;
  lon: number | null;
  partner: boolean;
}

/** Partner shops within 50 km first, then the nearest others; 3 in total. */
function nearestShops(p: PinParams, shops: Shop[]) {
  const withDist = shops
    .filter((s) => s.lat != null && s.lon != null)
    .map((s) => ({ ...s, udaljenost_km: Math.round(km(p.lat, p.lon, s.lat!, s.lon!) * 10) / 10 }))
    .sort((a, b) => a.udaljenost_km - b.udaljenost_km);
  const partners = withDist.filter((s) => s.partner && s.udaljenost_km <= 50);
  return [...partners, ...withDist.filter((s) => !partners.includes(s))].slice(0, 3);
}

/** "YYYY-MM-DD" + k days. */
function addDays(iso: string, k: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}
