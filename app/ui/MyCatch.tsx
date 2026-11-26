"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleCheck, CircleX, Fish, Plus, Ruler, Scale, Trash2 } from "lucide-react";
import type { CatchItem, CatchResult } from "@/lib/catch";
import type { SpeciesTip } from "@/lib/species";
import type { SpecialSpecies } from "@/lib/special";
import { CategoryBadge, SpecialActions } from "./Special";
import { c, t, type Lang } from "@/lib/i18n";
import { Card } from "./Dashboard";

const storeKey = (date: string) => `ribolov:ulov:${date}`;

function load(date: string): CatchItem[] {
  try {
    return JSON.parse(localStorage.getItem(storeKey(date)) ?? "[]");
  } catch {
    return [];
  }
}

/** Fish album (a small game for children): species ever entered in My catch -> first date. Stored on the device. */
const ALBUM_KEY = "ribolov:album";
export type Album = Record<string, string>;

export function readAlbum(): Album {
  try {
    return JSON.parse(localStorage.getItem(ALBUM_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function addToAlbum(keys: string[], date: string) {
  const a = readAlbum();
  let changed = false;
  for (const k of keys)
    if (!a[k] || a[k] > date) {
      a[k] = date;
      changed = true;
    }
  if (changed)
    try {
      localStorage.setItem(ALBUM_KEY, JSON.stringify(a));
    } catch {}
}

/** Today's catch for the dashboard: stored on the device, checked by the server. */
export function useCatch(date: string) {
  const [items, setItems] = useState<CatchItem[]>([]);
  const [result, setResult] = useState<CatchResult | null>(null);

  useEffect(() => setItems(load(date)), [date]);

  useEffect(() => {
    try {
      localStorage.setItem(storeKey(date), JSON.stringify(items));
    } catch {}
    addToAlbum(
      items.map((i) => i.key),
      date,
    );
    fetch("/api/catch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, items }) })
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult(null));
  }, [items, date]);

  return { items, setItems, result };
}

/** Compact card on the dashboard. */
export function MyCatchSummary({ lang, result, count, onOpen }: { lang: Lang; result: CatchResult | null; count: number; onOpen: () => void }) {
  const kept = result?.stavke.filter((s) => s.status === "zadrzi").length ?? 0;
  const pct = result ? Math.min(100, (result.zadrzano_kg / result.limit_kg) * 100) : 0;
  return (
    <Card>
      <button onClick={onOpen} className="flex w-full items-center gap-3 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sea-100 text-sea-600">
          <Fish className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">{t("myCatch", lang)}</span>
          <span className="block text-sm text-slate-500">
            {count === 0 ? t("myCatchEmpty", lang) : `${kept} ${t("kept", lang)} · ${result?.zadrzano_kg ?? 0} / ${result?.limit_kg ?? 5} kg`}
          </span>
          {count > 0 && (
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-sand-100">
              <span className={`block h-full rounded-full ${pct >= 100 ? "bg-stop" : "bg-sea-500"}`} style={{ width: `${pct}%` }} />
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-navy-900 px-3 py-1.5 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> {t("addFish", lang)}
        </span>
      </button>
    </Card>
  );
}

/** Full catch sheet: add a fish, see verdicts, track the 5 kg limit. */
export function MyCatchSheet({
  lang,
  species,
  special,
  items,
  setItems,
  result,
}: {
  lang: Lang;
  species: SpeciesTip[];
  special: SpecialSpecies[];
  items: CatchItem[];
  setItems: (f: (x: CatchItem[]) => CatchItem[]) => void;
  result: CatchResult | null;
}) {
  const [key, setKey] = useState("");
  const [len, setLen] = useState("");
  const [kg, setKg] = useState("");
  const sorted = useMemo(() => [...species].sort((a, b) => c(a.naziv, lang).localeCompare(c(b.naziv, lang))), [species, lang]);
  const selected = species.find((s) => s.key === key);
  const needsKg = selected?.min_velicina?.includes("kg");

  const add = () => {
    if (!key) return;
    const n = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);
    setItems((x) => [...x, { key, duljina_cm: n(len), masa_kg: n(kg) }]);
    setLen("");
    setKg("");
  };

  const last = result?.stavke[result.stavke.length - 1];
  const pct = result ? Math.min(100, (result.zadrzano_kg / result.limit_kg) * 100) : 0;

  return (
    <div>
      <h3 className="text-2xl font-extrabold tracking-tight">{t("myCatch", lang)}</h3>
      <p className="text-sm text-slate-500">{t("myCatchSub", lang)}</p>

      {/* add form */}
      <div className="mt-4 space-y-2 rounded-3xl bg-sand-50 p-4">
        <select value={key} onChange={(e) => setKey(e.target.value)} className="w-full rounded-2xl bg-card px-3 py-3 font-semibold outline-none">
          <option value="">{t("chooseFish", lang)}</option>
          {sorted.map((s) => (
            <option key={s.key} value={s.key}>
              {c(s.naziv, lang)}
              {s.min_velicina ? ` · min ${s.min_velicina}` : ""}
            </option>
          ))}
          {/* protected / invasive / dangerous species not in the fish guide (pufferfish, turtle…) */}
          <optgroup label={t("specialTitle", lang)}>
            {special
              .filter((p) => !species.some((s) => s.key === p.key))
              .map((p) => (
                <option key={p.key} value={p.key}>
                  {c(p.naziv, lang)}
                </option>
              ))}
          </optgroup>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2.5">
            <Ruler className="h-4 w-4 shrink-0 text-slate-400" />
            <input inputMode="decimal" value={len} onChange={(e) => setLen(e.target.value)} placeholder={t("lengthCm", lang)} className="w-full outline-none" />
          </label>
          <label className={`flex items-center gap-2 rounded-2xl bg-card px-3 py-2.5 ${needsKg ? "ring-2 ring-sea-500" : ""}`}>
            <Scale className="h-4 w-4 shrink-0 text-slate-400" />
            <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder={t("weightKg", lang)} className="w-full outline-none" />
          </label>
        </div>
        <button onClick={add} disabled={!key} className="w-full rounded-2xl bg-sea-500 py-3 font-extrabold text-white disabled:opacity-40">
          {t("checkFish", lang)}
        </button>
        <p className="text-xs text-slate-500">{t("weightHint", lang)}</p>
      </div>

      {/* verdict of the last fish, big; protected / invasive species get a big red warning */}
      {last && (
        <div
          className={`mt-3 rounded-3xl p-4 ${
            last.posebno && last.status !== "zadrzi"
              ? last.posebno.razina === "crveno"
                ? "bg-stop text-white"
                : "bg-warn text-navy-950"
              : last.status === "zadrzi"
                ? "bg-emerald-50"
                : last.status === "izmjeri"
                  ? "bg-amber-50"
                  : "bg-rose-50"
          }`}
        >
          <div className="flex gap-3">
            {last.status === "zadrzi" ? (
              <CircleCheck className={`h-8 w-8 shrink-0 ${last.posebno ? "" : "text-go"}`} />
            ) : last.posebno ? (
              <AlertTriangle className="h-8 w-8 shrink-0" />
            ) : (
              <CircleX className={`h-8 w-8 shrink-0 ${last.status === "pusti" ? "text-stop" : "text-warn"}`} />
            )}
            <div className="min-w-0">
              {last.posebno && <CategoryBadge s={last.posebno} lang={lang} />}
              <div className="font-extrabold">{c(last.naziv, lang)}</div>
              <div className="text-[15px] font-semibold">{c(last.razlog, lang)}</div>
              {last.posebno && <div className="mt-1 text-[15px]">{c(last.posebno.sto_uciniti, lang)}</div>}
              {last.napomene.map((n, i) => (
                <div key={i} className={`mt-1 text-sm ${last.posebno && last.status !== "zadrzi" ? "" : "text-slate-600"}`}>
                  • {c(n, lang)}
                </div>
              ))}
            </div>
          </div>
          {last.posebno && (
            <div className="text-ink">
              <SpecialActions prva_pomoc={last.posebno.prva_pomoc} prijava_url={last.posebno.prijava_url} lang={lang} />
              <p className={`mt-2 text-xs ${last.status !== "zadrzi" ? "opacity-90" : "text-slate-500"}`}>{t("speciesDisclaimer", lang)}</p>
            </div>
          )}
        </div>
      )}

      {/* daily limit */}
      {result && items.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>{t("dailyLimit", lang)}</span>
            <span>
              {result.zadrzano_kg} / {result.limit_kg} kg
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sand-100">
            <div className={`h-full rounded-full ${pct >= 100 ? "bg-stop" : "bg-sea-500"}`} style={{ width: `${pct}%` }} />
          </div>
          {result.bez_mase > 0 && <p className="mt-1 text-xs text-slate-500">{t("noWeightCount", lang).replace("{n}", String(result.bez_mase))}</p>}
          {result.mrecfish && (
            <div className="mt-2 rounded-2xl bg-navy-900 px-3 py-2.5 text-sm text-white">
              <p className="font-semibold">📱 {c(result.mrecfish, lang)}</p>
              <div className="mt-1.5 flex gap-3 text-xs">
                <a href={result.mrecfish_linkovi.ios_url} target="_blank" rel="noreferrer" className="underline">
                  mRecFish (App Store)
                </a>
                <a href={result.mrecfish_linkovi.info_url} target="_blank" rel="noreferrer" className="underline">
                  {t("instructions", lang)}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* list */}
      {result && items.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {result.stavke.map((s, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.status === "zadrzi" ? "bg-go" : s.status === "pusti" || s.status === "prijavi" ? "bg-stop" : "bg-warn"}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">
                  {c(s.naziv, lang)}
                  <span className="font-normal text-slate-500">
                    {items[i]?.duljina_cm ? ` · ${items[i].duljina_cm} cm` : ""}
                    {items[i]?.masa_kg ? ` · ${items[i].masa_kg} kg` : ""}
                  </span>
                </div>
                <div className="truncate text-xs text-slate-500">{c(s.razlog, lang)}</div>
              </div>
              <button onClick={() => setItems((x) => x.filter((_, j) => j !== i))} className="rounded-full p-2 text-slate-400 hover:bg-sand-100" aria-label={t("delete", lang)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[11px] text-slate-400">{t("catchPrivacy", lang)}</p>
    </div>
  );
}
