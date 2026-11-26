"use client";

import { useState } from "react";
import { Clock, Fish, MapPin, Ruler, Search, Sparkles, Wrench } from "lucide-react";
import type { SpeciesTip } from "@/lib/species";
import type { Recipe } from "@/lib/recipes";
import { RecipeOffer } from "./ui/Recipes";
import { c, t, type Lang } from "@/lib/i18n";

/** Full details for one species (used inside a sheet). */
export function SpeciesDetail({ s, lang, recipe, onRecipe }: { s: SpeciesTip; lang: Lang; recipe?: Recipe; onRecipe?: (key: string) => void }) {
  const row = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sea-100 text-sea-600">{icon}</span>
      <div>
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="text-[15px]">{value}</div>
      </div>
    </div>
  );
  return (
    <div>
      <div className="relative -mx-5 -mt-5 mb-4 h-52 bg-sea-100">
        {s.slika ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.slika} alt={c(s.naziv, lang)} className="h-full w-full object-cover" />
        ) : (
          <Fish className="m-auto h-full w-16 text-sea-600/40" />
        )}
      </div>
      <h3 className="text-2xl font-extrabold tracking-tight">{c(s.naziv, lang)}</h3>
      <p className="text-sm italic text-slate-500">{s.latinski}</p>
      {onRecipe && <RecipeOffer recipe={recipe} lang={lang} onOpen={onRecipe} className="mt-3" />}
      {s.lokalni_nazivi.length > 0 && (
        <p className="mt-1 text-sm">
          <span className="font-semibold">{t("localNames", lang)}:</span> {s.lokalni_nazivi.join(", ")}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {s.min_velicina && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-3 py-1 text-sm font-bold">
            <Ruler className="h-3.5 w-3.5" /> {t("minSize", lang)}: {s.min_velicina}
          </span>
        )}
        {s.lovostaj_danas && <span className="rounded-full bg-stop px-3 py-1 text-sm font-bold text-white">{t("closedToday", lang)}</span>}
      </div>
      {s.prepoznavanje && (
        <div className="mt-4 rounded-2xl bg-sea-100/60 p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-sea-600">{t("howToRecognize", lang)}</div>
          <p className="mt-1 text-[15px]">{c(s.prepoznavanje, lang)}</p>
        </div>
      )}
      <div className={`mt-3 rounded-2xl p-3 ${s.lovostaj_danas ? "bg-rose-50" : "bg-emerald-50"}`}>
        <div className={`text-xs font-bold uppercase tracking-wide ${s.lovostaj_danas ? "text-stop" : "text-go"}`}>{t("keepOrRelease", lang)}</div>
        <p className="mt-1 text-[15px] font-semibold">
          {s.lovostaj_danas
            ? t("releaseClosed", lang)
            : s.min_velicina
              ? `${t("keepIfSize", lang)} ${s.min_velicina}.`
              : t("keepYes", lang)}
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {row(<Wrench className="h-4 w-4" />, t("hook", lang), s.udica)}
        {row(<Sparkles className="h-4 w-4" />, t("bait", lang), c(s.mamci, lang))}
        {row(<Fish className="h-4 w-4" />, t("technique", lang), c(s.tehnika, lang))}
        {row(<Clock className="h-4 w-4" />, t("when", lang), c(s.kada, lang))}
        {row(<MapPin className="h-4 w-4" />, t("whereFish", lang), c(s.gdje, lang))}
      </div>
      {s.opis && <p className="mt-5 text-sm leading-relaxed text-slate-600">{c(s.opis, lang)}</p>}
      {s.wiki_url?.[lang === "hr" ? "hr" : "en"] && (
        <a href={s.wiki_url[lang === "hr" ? "hr" : "en"]!} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-slate-500 underline">
          Wikipedia (CC BY-SA)
        </a>
      )}
    </div>
  );
}

/** Searchable list of all species. */
export function SpeciesList({ species, lang, onOpen }: { species: SpeciesTip[]; lang: Lang; onOpen: (s: SpeciesTip) => void }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = species.filter((v) => !needle || [v.naziv.hr, v.naziv.en, v.latinski, ...v.lokalni_nazivi].some((n) => n.toLowerCase().includes(needle)));
  return (
    <div>
      <h3 className="mb-3 text-2xl font-extrabold tracking-tight">{t("guide", lang)}</h3>
      <label className="mb-4 flex items-center gap-2 rounded-2xl bg-sand-100 px-3 py-2.5">
        <Search className="h-4 w-4 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search", lang)} className="w-full bg-transparent outline-none" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        {list.map((s) => (
          <button key={s.key} onClick={() => onOpen(s)} className="overflow-hidden rounded-2xl bg-sand-50 text-left">
            <div className="relative h-24 bg-sea-100">
              {s.slika ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.slika} alt={c(s.naziv, lang)} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <Fish className="m-auto h-full w-10 text-sea-600/40" />
              )}
              {s.lovostaj_danas && <span className="absolute left-2 top-2 rounded-full bg-stop px-2 py-0.5 text-[10px] font-bold text-white">{t("closed", lang)}</span>}
            </div>
            <div className="p-2.5">
              <div className="truncate text-sm font-bold">{c(s.naziv, lang)}</div>
              <div className="truncate text-[11px] text-slate-500">{s.lokalni_nazivi.join(", ") || s.latinski}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
