"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, CloudOff, Moon, Star, Sun, Crosshair, Loader2, Map as MapIcon, MapPin, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import type { PinResult } from "@/lib/pin";
import type { SpeciesTip } from "@/lib/species";
import { LANGS, LOCALE_TAG, c, t, type Lang } from "@/lib/i18n";
import { MapView } from "./ui/MapView";
import { ActivityCard, Card, FirstTimeCard, FishStrip, Forecast, LicenceCard, NextDays, Reminders, RulesCard, Skeleton, Verdict } from "./ui/Dashboard";
import { SpeciesDetail, SpeciesList } from "./SpeciesGuide";
import { MyCatchSheet, MyCatchSummary, useCatch } from "./ui/MyCatch";

const SPECIAL = ["parangal", "vrse", "osti", "rasvjeta", "velika_riba"] as const;
type Mode = "obala" | "brod" | "podvodni";
type Permit = "rekreacijska" | "sportska";
type Loc = { lat: number; lon: number; source: "gps" | "map" };

function todayZagreb() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(new Date());
}

/** Bottom sheet on mobile, centred dialog on desktop. */
function Sheet({ open, onClose, children, full = false }: { open: boolean; onClose: () => void; children: React.ReactNode; full?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl ${full ? "h-[92dvh] sm:h-[85dvh]" : "max-h-[92dvh]"}`}
      >
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-card/90 p-2 shadow" aria-label="close">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-2xl bg-sand-100 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded-xl px-2 py-2 text-sm font-bold transition ${value === o.v ? "bg-card text-ink shadow" : "text-slate-500"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("hr");
  const [permit, setPermit] = useState<Permit>("rekreacijska");
  const [special, setSpecial] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("obala");
  const [date, setDate] = useState(todayZagreb());
  const [time, setTime] = useState("");
  const [loc, setLoc] = useState<Loc | null>(null);
  const [gps, setGps] = useState<"idle" | "locating" | "denied">("idle");
  const [result, setResult] = useState<PinResult | null>(null);
  const [species, setSpecies] = useState<SpeciesTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "map" | "settings" | "fish" | "allfish" | "catch">(null);
  const [fish, setFish] = useState<SpeciesTip | null>(null);
  const [draft, setDraft] = useState<{ lat: number; lon: number } | null>(null);
  const [offline, setOffline] = useState(false);
  const [retry, setRetry] = useState(0);
  const myCatch = useCatch(date);
  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("ribolov:tema", next);
    } catch {}
  };
  const [saved, setSaved] = useState<{ naziv: string; lat: number; lon: number }[]>([]);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("ribolov:mjesta") ?? "[]"));
    } catch {}
  }, []);
  const persistSaved = (x: typeof saved) => {
    setSaved(x);
    try {
      localStorage.setItem("ribolov:mjesta", JSON.stringify(x));
    } catch {}
  };
  const isSaved = !!loc && saved.some((p) => Math.abs(p.lat - loc.lat) < 1e-4 && Math.abs(p.lon - loc.lon) < 1e-4);
  const toggleSaved = () => {
    if (!loc) return;
    if (isSaved) persistSaved(saved.filter((p) => !(Math.abs(p.lat - loc.lat) < 1e-4 && Math.abs(p.lon - loc.lon) < 1e-4)));
    else persistSaved([...saved, { naziv: result?.mjesto?.naziv ?? `${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}`, lat: loc.lat, lon: loc.lon }].slice(-12));
  };

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) return setGps("denied");
    setGps("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: Number(p.coords.latitude.toFixed(5)), lon: Number(p.coords.longitude.toFixed(5)), source: "gps" });
        setGps("idle");
      },
      () => setGps("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // A shared link (?lat=..&lon=..) wins; otherwise use the GPS position on start.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const lat = Number(q.get("lat"));
    const lon = Number(q.get("lon"));
    if (q.get("lat") && q.get("lon") && Number.isFinite(lat) && Number.isFinite(lon)) setLoc({ lat, lon, source: "map" });
    else locate();
  }, [locate]);

  // Keep the URL shareable.
  useEffect(() => {
    if (loc) window.history.replaceState(null, "", `?lat=${loc.lat}&lon=${loc.lon}`);
  }, [loc]);

  useEffect(() => {
    const h = date === todayZagreb() ? new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zagreb", hour: "2-digit", hour12: false }).format(new Date()) : "";
    fetch(`/api/species?date=${date}${h ? `&hour=${Number(h)}` : ""}`)
      .then((r) => r.json())
      .then((g) => setSpecies(g.vrste ?? []))
      .catch(() => setSpecies([]));
  }, [date]);

  useEffect(() => {
    if (!loc) return;
    const q = new URLSearchParams({ lat: String(loc.lat), lon: String(loc.lon), date, permit: [permit, ...special].join(","), mode });
    if (time) q.set("time", time);
    setLoading(true);
    setError(null);
    const key = q.toString();
    fetch(`/api/pin?${q}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? r.statusText);
        setResult(j);
        setOffline(false);
        // Keep the last answer for when there is no signal at sea.
        try {
          localStorage.setItem("ribolov:last", JSON.stringify({ key, result: j }));
        } catch {}
      })
      .catch((e) => {
        let cached: { key: string; result: PinResult } | null = null;
        try {
          cached = JSON.parse(localStorage.getItem("ribolov:last") ?? "null");
        } catch {}
        if (cached?.result) {
          setResult(cached.result);
          setOffline(true);
        } else setError(String(e.message));
      })
      .finally(() => setLoading(false));
  }, [loc, date, time, permit, special, mode, retry]);

  const nowHour = date === todayZagreb() ? Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zagreb", hour: "2-digit", hour12: false }).format(new Date())) : null;
  // Open-season species first.
  // Best biting now first (season + time of day), closed-season species last.
  const fishSorted = [...species].sort((a, b) => b.ocjena_sada - a.ocjena_sada || Number(a.lovostaj_danas) - Number(b.lovostaj_danas));
  const [y, mo, dd] = date.split("-").map(Number);
  const isToday = date === todayZagreb();
  const dateLabel =
    (isToday ? t("today", lang) + ", " : "") +
    new Intl.DateTimeFormat(LOCALE_TAG[lang], { day: "numeric", month: "numeric", ...(isToday ? {} : { year: "numeric" }), timeZone: "UTC" }).format(new Date(Date.UTC(y, mo - 1, dd)));
  const settingsSummary = [t(permit, lang), ...special.map((s) => t(s as (typeof SPECIAL)[number], lang)), t(mode, lang)].join(" · ");

  return (
    <div className="min-h-dvh">
      {/* Header: location first */}
      <header className="bg-gradient-to-b from-navy-900 to-navy-800 px-4 pb-16 pt-4 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-white/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="" className="h-7 w-7 rounded-lg" />
              RIBOLOV
            </div>
            <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-xl bg-white/10 p-1.5 hover:bg-white/20" aria-label={t("themeToggle", lang)} title={t("themeToggle", lang)}>
              <Moon className="h-4 w-4 dark-hide" />
              <Sun className="h-4 w-4 light-hide" />
            </button>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-xl bg-white/10 px-2 py-1 text-sm font-semibold text-white outline-none" aria-label="Language">
              {LANGS.map((l) => (
                <option key={l.code} value={l.code} className="text-navy-900">
                  {l.label}
                </option>
              ))}
            </select>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-white/70">
                <MapPin className="h-4 w-4" />
                {loc ? (loc.source === "gps" ? t("gps", lang) : t("pickedOnMap", lang)) : gps === "locating" ? t("locating", lang) : t("whereFishing", lang)}
              </div>
              <h1 className="truncate text-3xl font-extrabold tracking-tight sm:text-4xl">
                {result?.mjesto?.naziv ?? (loc ? `${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}` : "Jadran")}
              </h1>
              {result?.mjesto && result.status === "ok" && (
                <div className="text-sm text-white/75">
                  {result.na_kopnu ? t("onShore", lang) : t("atSea", lang)}
                  {result.mjesto.udaljenost_km >= 0.8 &&
                    ` · ${result.mjesto.udaljenost_km.toLocaleString(LOCALE_TAG[lang])} km ${t("fromCentre", lang)}`}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {loc && (
                <button onClick={toggleSaved} className="rounded-2xl bg-white/10 p-3 hover:bg-white/20" aria-label={t("savePlace", lang)} title={t("savePlace", lang)}>
                  <Star className={`h-5 w-5 ${isSaved ? "fill-amber-300 text-amber-300" : ""}`} />
                </button>
              )}
              <button onClick={locate} className="rounded-2xl bg-white/10 p-3 hover:bg-white/20" aria-label={t("useMyLocation", lang)}>
                {gps === "locating" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crosshair className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  setDraft(loc);
                  setSheet("map");
                }}
                className="rounded-2xl bg-white/10 p-3 hover:bg-white/20"
                aria-label={t("openMap", lang)}
              >
                <MapIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            <button onClick={() => setSheet("settings")} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20">
              <SlidersHorizontal className="h-4 w-4" /> {settingsSummary}
            </button>
            <label className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
              <Calendar className="h-4 w-4" />
              <span>{dateLabel}</span>
              {/* native picker on top, invisible: shows our own Croatian date label */}
              <input type="date" value={date} onChange={(e) => setDate(e.target.value || todayZagreb())} className="absolute inset-0 cursor-pointer opacity-0" aria-label={t("date", lang)} />
            </label>
            {saved.map((p) => (
              <button
                key={`${p.lat},${p.lon}`}
                onClick={() => setLoc({ lat: p.lat, lon: p.lon, source: "map" })}
                className="flex shrink-0 items-center gap-1 rounded-full bg-amber-300/20 px-3 py-1.5 text-sm font-semibold text-amber-100 hover:bg-amber-300/30"
              >
                <Star className="h-3.5 w-3.5 fill-current" /> {p.naziv}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-12 max-w-5xl px-4 pb-12">
        {!loc ? (
          <Card className="mx-auto max-w-xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sea-100 text-sea-600">
              {gps === "locating" ? <Loader2 className="h-7 w-7 animate-spin" /> : <MapPin className="h-7 w-7" />}
            </div>
            <h2 className="text-xl font-extrabold">{gps === "locating" ? t("locating", lang) : t("whereFishing", lang)}</h2>
            <p className="mt-1 text-slate-600">{gps === "denied" ? t("gpsDenied", lang) : t("whereFishingSub", lang)}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button onClick={locate} className="flex items-center justify-center gap-2 rounded-2xl bg-sea-500 px-5 py-3 font-bold text-white hover:bg-sea-600">
                <Crosshair className="h-5 w-5" /> {t("useMyLocation", lang)}
              </button>
              <button onClick={() => setSheet("map")} className="flex items-center justify-center gap-2 rounded-2xl bg-sand-100 px-5 py-3 font-bold">
                <MapIcon className="h-5 w-5" /> {t("pickOnMap", lang)}
              </button>
            </div>
          </Card>
        ) : (
          <div key={result ? `${result.upit.lat},${result.upit.lon}` : "x"} className={`grid animate-[fadein_.35s_ease-out] grid-cols-1 gap-4 transition-opacity lg:grid-cols-[minmax(0,1fr)_380px] ${loading && result ? "opacity-60" : ""}`}>
            <div className="space-y-4">
              {offline && (
                <div className="flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-900">
                  <CloudOff className="h-4 w-4" /> {t("offline", lang)}
                </div>
              )}
              {error && (
                <Card className="text-center">
                  <CloudOff className="mx-auto h-8 w-8 text-slate-400" />
                  <div className="mt-2 font-extrabold">{t("errorTitle", lang)}</div>
                  <p className="text-sm text-slate-600">{t("errorText", lang)}</p>
                  <button onClick={() => setRetry((n) => n + 1)} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2 font-bold text-white">
                    <RefreshCw className="h-4 w-4" /> {t("retry", lang)}
                  </button>
                </Card>
              )}
              {!result && loading && <Skeleton />}
              {result && <Verdict r={result} lang={lang} />}
              {result && result.status === "ok" && <Reminders r={result} lang={lang} />}
              {result && result.status === "ok" && (
                <>
                  <MyCatchSummary lang={lang} result={myCatch.result} count={myCatch.items.length} onOpen={() => setSheet("catch")} />
                  <ActivityCard r={result} lang={lang} nowHour={nowHour} />
                  <Forecast r={result} lang={lang} />
                  <NextDays r={result} lang={lang} />
                  <FishStrip
                    species={fishSorted}
                    lang={lang}
                    onOpen={(s) => {
                      setFish(s);
                      setSheet("fish");
                    }}
                    onAll={() => setSheet("allfish")}
                  />
                </>
              )}
            </div>
            <div className="space-y-4">
              {result && result.status === "ok" && <LicenceCard r={result} lang={lang} />}
              <FirstTimeCard lang={lang} />
              <button
                onClick={() => {
                  setDraft(loc);
                  setSheet("map");
                }}
                className="relative block h-40 w-full overflow-hidden rounded-3xl shadow"
              >
                <MapView lat={loc.lat} lon={loc.lon} interactive={false} />
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-card/95 px-3 py-1 text-sm font-bold shadow">
                  <MapIcon className="h-4 w-4" /> {t("openMap", lang)}
                </span>
              </button>
              {result && result.status === "ok" && result.danas && (
                <>
                  <h2 className="px-1 pt-1 text-[15px] font-bold">{t("rules", lang)}</h2>
                  <RulesCard r={result} lang={lang} />
                </>
              )}
              {result && (
                <p className="px-1 text-xs text-slate-500">
                  {c(result.odricanje, lang)} · {t("checked", lang)} {result.zadnja_provjera}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Full-screen map picker */}
      {sheet === "map" && (
        <div className="fixed inset-0 z-50 bg-card">
          <MapView lat={draft?.lat ?? loc?.lat ?? null} lon={draft?.lon ?? loc?.lon ?? null} onPick={setDraft} />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
            <span className="rounded-full bg-card/95 px-4 py-2 text-sm font-bold shadow">{t("tapToPick", lang)}</span>
            <button onClick={() => setSheet(null)} className="rounded-full bg-card/95 p-2.5 shadow" aria-label={t("close", lang)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <button
              disabled={!draft}
              onClick={() => {
                if (draft) setLoc({ ...draft, source: "map" });
                setSheet(null);
              }}
              className="mx-auto block w-full max-w-md rounded-2xl bg-sea-500 py-3.5 font-extrabold text-white shadow-lg disabled:opacity-50"
            >
              {t("chooseThis", lang)}
            </button>
          </div>
        </div>
      )}

      <Sheet open={sheet === "settings"} onClose={() => setSheet(null)}>
        <h3 className="mb-4 text-xl font-extrabold">{t("settings", lang)}</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-sm font-semibold text-slate-500">{t("permit", lang)}</div>
            <Segmented value={permit} onChange={setPermit} options={[{ v: "rekreacijska", label: t("rekreacijska", lang) }, { v: "sportska", label: t("sportska", lang) }]} />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-semibold text-slate-500">{t("mode", lang)}</div>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { v: "obala", label: t("obala", lang) },
                { v: "brod", label: t("brod", lang) },
                { v: "podvodni", label: t("podvodni", lang) },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-semibold text-slate-500">{t("special", lang)}</div>
            <div className="flex flex-wrap gap-2">
              {SPECIAL.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecial(special.includes(s) ? special.filter((x) => x !== s) : [...special, s])}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ${special.includes(s) ? "bg-navy-900 text-white" : "bg-sand-100"}`}
                >
                  {t(s, lang)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-sm font-semibold text-slate-500">{t("time", lang)}</div>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-2xl bg-sand-100 px-3 py-2.5 outline-none" />
          </div>
          <button onClick={() => setSheet(null)} className="w-full rounded-2xl bg-navy-900 py-3 font-extrabold text-white">
            {t("done", lang)}
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === "fish" && !!fish} onClose={() => setSheet(null)}>
        {fish && <SpeciesDetail s={fish} lang={lang} />}
      </Sheet>

      <Sheet open={sheet === "catch"} onClose={() => setSheet(null)} full>
        <MyCatchSheet lang={lang} species={species} items={myCatch.items} setItems={myCatch.setItems} result={myCatch.result} />
      </Sheet>

      <Sheet open={sheet === "allfish"} onClose={() => setSheet(null)} full>
        <SpeciesList
          species={species}
          lang={lang}
          onOpen={(s) => {
            setFish(s);
            setSheet("fish");
          }}
        />
      </Sheet>
    </div>
  );
}
