"use client";

import {
  AlertTriangle,
  Bell,
  Calendar,
  Anchor,
  ChevronDown,
  CircleCheck,
  CircleX,
  Fish,
  Info,
  Moon,
  Ruler,
  Store,
  Sunrise,
  Sunset,
  Thermometer,
  Ticket,
  Waves,
  Wind,
} from "lucide-react";
import type { Notice, PinResult, SourceRef } from "@/lib/pin";
import type { SpeciesTip } from "@/lib/species";
import { c, COMPASS, LOCALE_TAG, t, type Lang } from "@/lib/i18n";

// ---------------------------------------------------------------- shared bits

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-card p-4 shadow-[0_1px_2px_rgba(11,37,64,.06),0_8px_24px_-12px_rgba(11,37,64,.18)] ${className}`}>{children}</section>;
}

export function H2({ icon, children, right }: { icon?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
        {icon}
        {children}
      </h2>
      {right}
    </div>
  );
}

/** Legal sources stay in the API (izvor) but are not shown: users care about the answer, not the gazette. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Src(_: { s?: SourceRef | null; lang: Lang }) {
  return null;
}

function Accordion({ title, icon, children, open = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-slate-100 last:border-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-100 text-sea-600">{icon}</span>
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="space-y-2 pb-4 pl-11 text-sm">{children}</div>
    </details>
  );
}

function Notices({ items, lang }: { items: Notice[]; lang: Lang }) {
  const dot = { zeleno: "bg-go", zuto: "bg-warn", crveno: "bg-stop", obavijest: "bg-slate-300" } as const;
  return (
    <ul className="space-y-2">
      {items.map((n, i) => (
        <li key={i} className="flex gap-2">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.razina]}`} />
          <div>
            {c(n.tekst, lang)}
            {n.naziv && <b> {n.naziv}</b>}
            <Src s={n.izvor} lang={lang} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- verdict

const VERDICT = {
  zeleno: { bg: "from-emerald-500 to-emerald-600", icon: CircleCheck },
  zuto: { bg: "from-amber-400 to-amber-500", icon: AlertTriangle },
  crveno: { bg: "from-rose-500 to-red-600", icon: CircleX },
} as const;

/** "2026-11-26" -> locale date with year. */
export const fmtDate = (iso: string, lang: Lang) =>
  iso ? new Intl.DateTimeFormat(LOCALE_TAG[lang], { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)) : "";

export function Verdict({ r, lang }: { r: PinResult; lang: Lang }) {
  if (r.status !== "ok" || !r.semafor) {
    return (
      <Card>
        <p className="font-semibold">{c(r.razlog, lang)}</p>
      </Card>
    );
  }
  const v = VERDICT[r.semafor];
  const Icon = v.icon;
  const dark = r.semafor === "zuto";
  return (
    <section className={`rounded-3xl bg-gradient-to-br ${v.bg} p-5 shadow-lg ${dark ? "text-navy-950" : "text-white"}`}>
      <div className="flex items-start gap-4">
        <Icon className="h-12 w-12 shrink-0" strokeWidth={2.2} />
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-tight tracking-tight">{t(r.semafor, lang)}</div>
          <p className="mt-1 text-[15px] font-medium opacity-95">{c(r.razlog, lang)}</p>
          {r.izvori_podataka.length > 0 && (
            <p className="mt-2 text-xs opacity-80">
              {t("dataFrom", lang)}: {r.izvori_podataka.map((s) => `${s.izvor} (${fmtDate(s.datum, lang)})`).join(", ")} · {t("rulesChecked", lang)}{" "}
              {fmtDate(r.zadnja_provjera, lang)}
            </p>
          )}
        </div>
      </div>
      {r.upozorenja.length > 0 && (
        <details className={`mt-3 rounded-2xl px-3 py-2 text-sm ${dark ? "bg-white/40" : "bg-black/10"}`}>
          <summary className="cursor-pointer font-semibold">
            {t("warnings", lang)} ({r.upozorenja.length})
          </summary>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {r.upozorenja.map((u, i) => (
              <li key={i}>{c(u.tekst, lang)}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- forecast & activity

const dirName = (deg: number | null, lang: Lang) => (deg == null ? "" : COMPASS[lang][Math.round(deg / 45) % 8]);

function Tile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-sand-50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Forecast({ r, lang }: { r: PinResult; lang: Lang }) {
  const w = r.vrijeme;
  const sm = r.sunce_mjesec;
  const n = (x: number | null | undefined, d = 0) => (x == null ? "–" : x.toFixed(d));
  return (
    <Card>
      <H2 icon={<Wind className="h-4 w-4 text-sea-600" />} right={w && <span className="text-xs text-slate-500">{w.sat}</span>}>
        {t("forecast", lang)}
      </H2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Tile
          icon={<Wind className="h-3.5 w-3.5" />}
          label={t("wind", lang)}
          value={
            <span className="flex items-center gap-1.5">
              {w?.vjetar.smjer_deg != null && (
                <span className="inline-block text-sea-600" style={{ transform: `rotate(${w.vjetar.smjer_deg + 180}deg)` }}>
                  ↑
                </span>
              )}
              {n(w?.vjetar.brzina_kmh)} <span className="text-sm font-bold text-slate-500">km/h</span>
            </span>
          }
          sub={w ? `${dirName(w.vjetar.smjer_deg, lang)} · ${t("gusts", lang)} ${n(w.vjetar.udari_kmh)}` : t("noWeather", lang)}
        />
        <Tile
          icon={<Waves className="h-3.5 w-3.5" />}
          label={t("waves", lang)}
          value={
            <>
              {n(w?.valovi.visina_m, 1)} <span className="text-sm font-bold text-slate-500">m</span>
            </>
          }
          sub={w?.valovi.period_s ? `${dirName(w.valovi.smjer_deg, lang)} · ${n(w.valovi.period_s)} s` : undefined}
        />
        <Tile
          icon={<Thermometer className="h-3.5 w-3.5" />}
          label={t("seaTempShort", lang)}
          value={<>{n(w?.temperatura_mora_c, 1)}°</>}
          sub={`${t("airShort", lang)} ${n(w?.temperatura_zraka_c)}°`}
        />
        <Tile
          icon={<Anchor className="h-3.5 w-3.5" />}
          label={t("depth", lang)}
          value={
            r.dubina?.dubina_m != null ? (
              <>
                {Math.round(r.dubina.dubina_m)} <span className="text-sm font-bold text-slate-500">m</span>
              </>
            ) : r.na_kopnu ? (
              t("onLand", lang)
            ) : (
              "–"
            )
          }
        />
        <Tile
          icon={<Sunrise className="h-3.5 w-3.5" />}
          label={t("sun", lang)}
          value={sm.izlazak ?? "–"}
          sub={
            <span className="inline-flex items-center gap-1">
              <Sunset className="h-3 w-3" /> {sm.zalazak ?? "–"}
            </span>
          }
        />
        <Tile icon={<Moon className="h-3.5 w-3.5" />} label={t("moon", lang)} value={`${sm.mjesec.osvijetljenost} %`} sub={c(sm.mjesec.faza, lang)} />
      </div>
      {w && <p className="mt-2 text-[11px] text-slate-400">{w.izvor}</p>}
    </Card>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 30;
  const len = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 76 76" className="h-20 w-20 shrink-0 -rotate-90">
      <circle cx="38" cy="38" r={r} fill="none" className="stroke-slate-200" strokeWidth="8" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="#0891b2" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(value / 100) * len} ${len}`} />
      <text x="38" y="38" textAnchor="middle" dominantBaseline="central" className="rotate-90 fill-ink text-[22px] font-extrabold" style={{ transformOrigin: "38px 38px" }}>
        {value}
      </text>
    </svg>
  );
}

export function ActivityCard({ r, lang, nowHour }: { r: PinResult; lang: Lang; nowHour: number | null }) {
  const a = r.aktivnost;
  if (!a) return null;
  return (
    <Card>
      <H2 icon={<Fish className="h-4 w-4 text-sea-600" />}>{t("activity", lang)}</H2>
      <div className="flex items-center gap-4">
        <ScoreRing value={a.dnevna_ocjena} />
        <div>
          <div className="text-xl font-extrabold capitalize">{c(a.oznaka, lang)}</div>
          <div className="text-sm text-slate-600">{t("bestTimes", lang)}:</div>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {a.najbolje.map((w) => (
              <span key={w.od} className="rounded-full bg-sea-100 px-2.5 py-0.5 text-sm font-bold text-sea-600">
                {w.od}–{w.do}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex h-24 items-end gap-[3px]">
        {a.sati.map((h, i) => (
          <div key={h.sat} className="relative flex h-full flex-1 flex-col justify-end" title={`${h.sat}: ${h.ocjena}`}>
            <div
              className={`rounded-t-md ${i === nowHour ? "bg-navy-900" : h.ocjena >= 65 ? "bg-sea-500" : h.ocjena >= 40 ? "bg-sea-500/60" : "bg-sea-500/25"}`}
              style={{ height: `${Math.max(6, h.ocjena)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {t("major", lang)}: {a.glavni_periodi.join(", ") || "–"} · {t("minor", lang)}: {a.sporedni_periodi.join(", ") || "–"}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{c(a.napomena, lang)}</p>
    </Card>
  );
}

// ---------------------------------------------------------------- fish strip

export function FishStrip({ species, lang, onOpen, onAll }: { species: SpeciesTip[]; lang: Lang; onOpen: (s: SpeciesTip) => void; onAll: () => void }) {
  if (!species.length) return null;
  return (
    <Card className="px-0">
      <div className="px-4">
        <H2
          icon={<Fish className="h-4 w-4 text-sea-600" />}
          right={
            <button onClick={onAll} className="text-sm font-semibold text-sea-600">
              {t("allFish", lang)} →
            </button>
          }
        >
          {t("fishToday", lang)}
        </H2>
      </div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {species.map((s) => (
          <button key={s.key} onClick={() => onOpen(s)} className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-sand-50 text-left">
            <div className="relative h-24 bg-sea-100">
              {s.slika ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.slika} alt={c(s.naziv, lang)} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <Fish className="m-auto h-full w-10 text-sea-600/50" />
              )}
              {s.lovostaj_danas ? (
                <span className="absolute left-2 top-2 rounded-full bg-stop px-2 py-0.5 text-[10px] font-bold text-white">{t("closed", lang)}</span>
              ) : s.ocjena_sada >= 3 ? (
                <span className="absolute left-2 top-2 rounded-full bg-go px-2 py-0.5 text-[10px] font-bold text-white">🎣 {t("biteNow", lang)}</span>
              ) : s.sezona_sada ? (
                <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold text-sea-600">{t("inSeason", lang)}</span>
              ) : null}
            </div>
            <div className="p-2.5">
              <div className="truncate text-sm font-bold">{c(s.naziv, lang)}</div>
              <div className="truncate text-[11px] text-slate-500">{s.lokalni_nazivi[0] ?? s.latinski}</div>
              {s.min_velicina && (
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                  <Ruler className="h-3 w-3" /> {s.min_velicina}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- next days & reminders

export function NextDays({ r, lang }: { r: PinResult; lang: Lang }) {
  if (r.sljedeci_dani.length < 2) return null;
  const best = Math.max(...r.sljedeci_dani.map((d) => d.ocjena));
  const name = (iso: string, i: number) =>
    i === 0
      ? t("today", lang)
      : i === 1
        ? t("tomorrow", lang)
        : new Intl.DateTimeFormat(LOCALE_TAG[lang], { weekday: "long" }).format(new Date(`${iso}T12:00:00Z`));
  return (
    <Card>
      <H2 icon={<Calendar className="h-4 w-4 text-sea-600" />}>{t("nextDays", lang)}</H2>
      <div className="grid grid-cols-3 gap-2">
        {r.sljedeci_dani.map((d, i) => {
          const rough = (d.udari_max_kmh ?? 0) > 50 || (d.valovi_max_m ?? 0) > 2;
          return (
            <div key={d.datum} className={`rounded-2xl p-3 ${d.ocjena === best && !rough ? "bg-sea-100 ring-2 ring-sea-500" : "bg-sand-50"}`}>
              <div className="text-xs font-bold capitalize text-slate-500">{name(d.datum, i)}</div>
              <div className="text-2xl font-extrabold">{d.ocjena}</div>
              <div className="text-xs capitalize">{c(d.oznaka, lang)}</div>
              {/* each value is coloured on its own: gusts > 50 km/h, waves > 2 m */}
              <div className="mt-1 text-[11px] text-slate-500">{t("maxGusts", lang)}</div>
              <div className="text-[11px]">
                {d.udari_max_kmh != null && (
                  <span className={(d.udari_max_kmh ?? 0) > 50 ? "font-bold text-stop" : "text-slate-600"}>💨 {Math.round(d.udari_max_kmh)} km/h</span>
                )}
                {d.valovi_max_m != null && (
                  <span className={(d.valovi_max_m ?? 0) > 2 ? "font-bold text-stop" : "text-slate-600"}> · 🌊 {d.valovi_max_m.toFixed(1)} m</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{t("nextDaysNote", lang)}</p>
    </Card>
  );
}

export function Reminders({ r, lang }: { r: PinResult; lang: Lang }) {
  if (!r.podsjetnici.length) return null;
  return (
    <div className="space-y-2">
      {r.podsjetnici.map((p, i) => (
        <div key={i} className={`flex items-start gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold ${p.razina === "zuto" ? "bg-amber-100 text-amber-900" : "bg-card text-ink shadow-sm"}`}>
          <Bell className="mt-0.5 h-4 w-4 shrink-0" /> {c(p.tekst, lang)}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- tourists

/** Short onboarding for first-time visitors: the essentials in plain words. */
export function FirstTimeCard({ lang }: { lang: Lang }) {
  const tips = ["tip1", "tip2", "tip3", "tip4", "tip5"] as const;
  return (
    <Card>
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 text-xl">👋</span>
          <span className="flex-1">
            <span className="block font-extrabold">{t("firstTime", lang)}</span>
            <span className="block text-sm text-slate-500">{t("firstTimeSub", lang)}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </summary>
        <ol className="mt-4 space-y-3">
          {tips.map((k, i) => (
            <li key={k} className="flex gap-3 text-[15px]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">{i + 1}</span>
              <span>{t(k, lang)}</span>
            </li>
          ))}
        </ol>
      </details>
    </Card>
  );
}

/** Placeholder blocks while data loads. */
export function Skeleton() {
  return (
    <div className="space-y-4">
      {[160, 300, 260].map((h, i) => (
        <div key={i} className="animate-pulse rounded-3xl bg-card/80 shadow-sm" style={{ height: h }}>
          <div className="space-y-3 p-5">
            <div className="h-5 w-1/3 rounded-full bg-slate-200" />
            <div className="h-4 w-2/3 rounded-full bg-slate-100" />
            <div className="h-4 w-1/2 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- licence

export function LicenceCard({ r, lang }: { r: PinResult; lang: Lang }) {
  const d = r.dozvola;
  return (
    <section className="rounded-3xl bg-navy-900 p-5 text-white shadow-lg">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Ticket className="h-5 w-5" />
        </span>
        <div>
          <div className="text-lg font-extrabold">{t("licenceNeeded", lang)}</div>
          <p className="text-sm text-white/75">{t("licenceSub", lang)}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {d.cijene.slice(0, 3).map((pc) => (
          <div key={pc.trajanje.hr} className="rounded-2xl bg-white/10 py-2">
            <div className="text-lg font-extrabold">{pc.cijena_eur.toFixed(0)} €</div>
            <div className="text-xs text-white/70">{c(pc.trajanje, lang)}</div>
          </div>
        ))}
      </div>
      <a href={d.online_url} target="_blank" rel="noreferrer" className="mt-4 block rounded-2xl bg-sea-500 py-3 text-center font-extrabold hover:bg-sea-600">
        {t("buyLicence", lang)} →
      </a>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-white/80">{t("details", lang)}</summary>
        <div className="mt-2 space-y-2 text-white/85">
          <p>{c(d.opis, lang)}</p>
          <ul>
            {d.cijene.slice(3).map((pc) => (
              <li key={pc.trajanje.hr} className="flex justify-between border-b border-white/10 py-0.5">
                <span>{c(pc.trajanje, lang)}</span>
                <span>{pc.cijena_eur.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
          <p className="text-xs">{c(d.posebne.napomena, lang)}</p>
          <p className="text-xs">{c(d.sportska, lang)}</p>
          <p className="text-xs">{c(d.djeca, lang)}</p>
          {d.najblizi_prodavaci.length > 0 && (
            <>
              <div className="pt-1 font-bold">{t("sellers", lang)}</div>
              <ul className="space-y-1.5">
                {d.najblizi_prodavaci.map((s) => (
                  <li key={s.naziv + s.adresa}>
                    <b>{s.naziv}</b> · {s.adresa}, {s.grad} <span className="text-white/60">(~{s.udaljenost_km} km)</span>
                    <div className="text-xs">
                      {s.telefon.map((tel) => (
                        <a key={tel} href={`tel:${tel.replace(/\s/g, "")}`} className="mr-2 underline">
                          {tel}
                        </a>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </details>
    </section>
  );
}

// ---------------------------------------------------------------- gear

function GearItem({ a, lang }: { a: PinResult["alati"][number]; lang: Lang }) {
  return (
    <li className="rounded-2xl bg-sand-50 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold">{c(a.naziv, lang)}</span>
        {a.max != null && a.dopusteno && (
          <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-slate-600">
            {t("maxAtOnce", lang).replace("{n}", String(a.max))}
          </span>
        )}
      </div>
      {a.opis && <p className="mt-0.5 text-[13px] text-slate-600">{c(a.opis, lang)}</p>}
      {a.detalj && <p className="mt-0.5 text-[11px] text-slate-400">{c(a.detalj, lang)}</p>}
      {!a.dopusteno && a.razlog && <p className="mt-1 text-xs font-semibold text-stop">{c(a.razlog, lang)}</p>}
      {!a.dopusteno && a.posebna_dozvola_cijena_eur != null && (
        <p className="mt-0.5 text-xs text-slate-500">
          {t("permitPrice", lang).replace("{eur}", a.posebna_dozvola_cijena_eur.toFixed(2).replace(".", lang === "hr" ? "," : "."))}
        </p>
      )}
      {a.napomena && <p className="mt-1 text-xs font-semibold text-amber-700">{c(a.napomena, lang)}</p>}
    </li>
  );
}

/** Gear grouped the way a visitor thinks about it: what I may use now, and what needs more. */
function GearList({ r, lang }: { r: PinResult; lang: Lang }) {
  const ok = r.alati.filter((a) => a.dopusteno);
  const needPermit = r.alati.filter((a) => !a.dopusteno && a.posebna_dozvola);
  const other = r.alati.filter((a) => !a.dopusteno && !a.posebna_dozvola);
  const group = (title: string, items: typeof ok, tone: string) =>
    items.length > 0 && (
      <div>
        <div className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${tone}`}>{title}</div>
        <ul className="space-y-2">
          {items.map((a) => (
            <GearItem key={a.id} a={a} lang={lang} />
          ))}
        </ul>
      </div>
    );
  return (
    <div className="space-y-4">
      {group(t("gearAllowed", lang), ok, "text-go")}
      {group(t("gearNeedsPermit", lang), needPermit, "text-sea-600")}
      {needPermit.length > 0 && <p className="text-xs text-slate-500">{c(r.dozvola.posebne.napomena, lang)}</p>}
      {group(t("gearNotHere", lang), other, "text-stop")}
    </div>
  );
}

// ---------------------------------------------------------------- rules

export function RulesCard({ r, lang }: { r: PinResult; lang: Lang }) {
  const d = r.danas!;
  const g = r.gdje;
  const km = (m: number | null) => (m == null ? t("unknown", lang) : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);
  return (
    <Card className="py-1">
      <Accordion title={t("tools", lang)} icon={<Fish className="h-4 w-4" />}>
        <GearList r={r} lang={lang} />
      </Accordion>
      <Accordion title={t("limitsAndSizes", lang)} icon={<Ruler className="h-4 w-4" />}>
        <div className="font-semibold">{t("closed", lang)}</div>
        {d.lovostaj.length ? (
          <div className="flex flex-wrap gap-1.5">
            {d.lovostaj.map((l, i) => (
              <span key={i} className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                {c(l.vrsta, lang)}
              </span>
            ))}
          </div>
        ) : (
          <p>{t("noClosed", lang)}</p>
        )}
        <Notices items={d.uvijek} lang={lang} />
        <div className="pt-2 font-semibold">{t("limits", lang)}</div>
        <Notices items={d.dnevna_ogranicenja} lang={lang} />
        <div className="pt-2 font-semibold">{t("minSizes", lang)}</div>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {d.min_velicine.map((m, i) => (
            <div key={i} className="flex justify-between gap-2 border-b border-slate-100 py-1 text-xs">
              <span>{c(m.vrsta, lang)}</span>
              <b className="whitespace-nowrap">{m.min}</b>
            </div>
          ))}
        </div>
        <Src s={d.min_velicine[0]?.izvor} lang={lang} />
        <div className="pt-2 font-semibold">{t("prohibited", lang)}</div>
        <p className="text-xs">{d.trajno_zabranjene.map((z) => c(z.vrsta, lang)).join(" · ")}</p>
        <div className="pt-2 font-semibold">{t("strict", lang)}</div>
        <p className="text-xs">{c(d.strogo_zasticene.vrste, lang)}</p>
      </Accordion>
      <Accordion title={t("where", lang)} icon={<Anchor className="h-4 w-4" />}>
        <p>
          {t("zone", lang)}: <b>{g.ribolovna_zona ?? t("unknown", lang)}</b> · {t("subzone", lang)}: <b>{g.podzona ?? t("unknown", lang)}</b>
        </p>
        <p>
          {t("areas", lang)}: {g.podrucja.length ? g.podrucja.map((p) => p.naziv ?? p.sloj).join(", ") : t("none", lang)}
        </p>
        <p>
          {t("natura", lang)}: {g.natura2000.length ? g.natura2000.join(", ") : t("none", lang)}
        </p>
        <p>
          {t("port", lang)}: {km(g.udaljenost_luka_m)} · {t("beach", lang)}: {km(g.udaljenost_plaza_m)}
        </p>
      </Accordion>
      <Accordion title={t("info", lang)} icon={<Info className="h-4 w-4" />}>
        <Notices items={r.obavijesti} lang={lang} />
        <div className="pt-2 font-semibold">{t("forbidden", lang)}</div>
        <Notices items={d.zabranjeno} lang={lang} />
        <div className="pt-2 font-semibold">{t("marking", lang)}</div>
        <Notices items={[d.oznacavanje]} lang={lang} />
        <div className="pt-2 font-semibold">{t("reporting", lang)}</div>
        <Notices items={[d.evidencija]} lang={lang} />
        <Notices items={[d.bez_dozvole]} lang={lang} />
      </Accordion>
      {r.trgovine.length > 0 && (
        <Accordion title={t("shops", lang)} icon={<Store className="h-4 w-4" />}>
          <ul className="space-y-2">
            {r.trgovine.map((s) => (
              <li key={s.naziv + s.lat}>
                <b>{s.naziv}</b>
                {s.partner && <span className="ml-1 rounded bg-sea-100 px-1 text-xs text-sea-600">{t("partner", lang)}</span>}{" "}
                <span className="text-slate-500">(~{s.udaljenost_km} km)</span>
                <div className="text-xs text-slate-600">
                  {[s.adresa, s.grad].filter(Boolean).join(", ")}
                  {s.telefon.map((tel) => (
                    <a key={tel} href={`tel:${tel.replace(/\s/g, "")}`} className="ml-2 underline">
                      {tel}
                    </a>
                  ))}
                  {s.lat != null && (
                    <a href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=17/${s.lat}/${s.lon}`} target="_blank" rel="noreferrer" className="ml-2 underline">
                      {t("onMap", lang)}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Accordion>
      )}
    </Card>
  );
}
