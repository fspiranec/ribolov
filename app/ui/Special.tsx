"use client";

import { useState } from "react";
import { AlertTriangle, Camera, ExternalLink, HeartPulse, ShieldAlert, ShieldCheck } from "lucide-react";
import type { SpecialCategory, SpecialSpecies } from "@/lib/special";
import type { Recipe } from "@/lib/recipes";
import { RecipeOffer } from "./Recipes";
import type { Text } from "@/lib/rules/types";
import { c, t, type Key, type Lang } from "@/lib/i18n";
import { Card, H2 } from "./Dashboard";

/** Category label and colours: protected = red, invasive = red/yellow (by species), dangerous = yellow. */
export const CATEGORY: Record<SpecialCategory, { label: Key; icon: typeof ShieldCheck }> = {
  zasticena: { label: "catZasticena", icon: ShieldCheck },
  invazivna: { label: "catInvazivna", icon: ShieldAlert },
  opasna: { label: "catOpasna", icon: AlertTriangle },
};

const tone = (razina: "crveno" | "zuto") => (razina === "crveno" ? "bg-stop text-white" : "bg-warn text-navy-950");

export function CategoryBadge({ s, lang }: { s: Pick<SpecialSpecies, "kategorija" | "razina">; lang: Lang }) {
  const Icon = CATEGORY[s.kategorija].icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone(s.razina)}`}>
      <Icon className="h-3 w-3" /> {t(CATEGORY[s.kategorija].label, lang)}
    </span>
  );
}

const TABS: { k: SpecialCategory; label: Key }[] = [
  { k: "zasticena", label: "tabProtected" },
  { k: "invazivna", label: "tabInvasive" },
  { k: "opasna", label: "tabDangerous" },
];

/** Dashboard card: one tab per category, all species of that category in a grid (no sideways scrolling). */
export function SpecialCard({ species, lang, onOpen }: { species: SpecialSpecies[]; lang: Lang; onOpen: (s: SpecialSpecies) => void }) {
  const [tab, setTab] = useState<SpecialCategory>("zasticena");
  if (!species.length) return null;
  const shown = species.filter((s) => s.kategorija === tab);
  return (
    <Card>
      <H2 icon={<ShieldAlert className="h-4 w-4 text-stop" />}>{t("specialTitle", lang)}</H2>
      <div className="flex rounded-2xl bg-sand-100 p-1" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.k}
            role="tab"
            aria-selected={tab === x.k}
            onClick={() => setTab(x.k)}
            className={`flex-1 rounded-xl px-2 py-2 text-sm font-bold transition ${tab === x.k ? "bg-card text-ink shadow" : "text-slate-500"}`}
          >
            {t(x.label, lang)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-600">{t(CATEGORY[tab].label, lang)}</p>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((s) => (
          <button key={s.key} onClick={() => onOpen(s)} className="overflow-hidden rounded-2xl bg-sand-50 text-left">
            <div className="relative h-24 bg-sea-100">
              {s.slika && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.slika} alt={c(s.naziv, lang)} loading="lazy" className="h-full w-full object-cover" />
              )}
              <span className={`absolute left-2 top-2 h-3 w-3 rounded-full ring-2 ring-white ${s.razina === "crveno" ? "bg-stop" : "bg-warn"}`} aria-hidden />
            </div>
            <div className="p-2.5">
              <div className="text-sm font-bold leading-tight">{c(s.naziv, lang)}</div>
              <div className="mt-0.5 line-clamp-3 text-[11px] text-slate-600">{c(s.sto_uciniti, lang)}</div>
            </div>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{t("speciesDisclaimer", lang)}</p>
    </Card>
  );
}

/** First aid and the "report a sighting" link, shared by the detail sheet and My catch. */
export function SpecialActions({ prva_pomoc, prijava_url, lang }: { prva_pomoc: Text | null; prijava_url: string | null; lang: Lang }) {
  return (
    <>
      {prva_pomoc && (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950">
          <div className="flex items-center gap-1.5 font-extrabold">
            <HeartPulse className="h-4 w-4" /> {t("firstAid", lang)}
          </div>
          <p className="mt-1">{c(prva_pomoc, lang)}</p>
          <p className="mt-2 flex gap-1.5 text-xs font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {t("medicalDisclaimer", lang)}
          </p>
        </div>
      )}
      {prijava_url && (
        <div className="mt-3">
          <a href={prijava_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3 font-extrabold text-white">
            <Camera className="h-4 w-4" /> {t("reportFind", lang)} <ExternalLink className="h-4 w-4" />
          </a>
          <p className="mt-1 text-xs text-slate-500">{t("reportHint", lang)}</p>
        </div>
      )}
    </>
  );
}

export function SpecialDetail({ s, lang, recipe, onRecipe }: { s: SpecialSpecies; lang: Lang; recipe?: Recipe; onRecipe?: (key: string) => void }) {
  return (
    <div>
      {s.slika && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.slika} alt={c(s.naziv, lang)} className="-mx-5 -mt-5 mb-4 h-56 w-[calc(100%+2.5rem)] max-w-none rounded-t-3xl object-cover" />
      )}
      <CategoryBadge s={s} lang={lang} />
      <h3 className="mt-2 text-2xl font-extrabold tracking-tight">{c(s.naziv, lang)}</h3>
      <div className="text-sm italic text-slate-500">{s.latinski}</div>
      <p className="mt-3 text-[15px]">{c(s.recenica, lang)}</p>
      <div className={`mt-3 rounded-2xl p-3 ${s.razina === "crveno" ? "bg-rose-50 text-rose-950" : "bg-amber-50 text-amber-950"}`}>
        <div className="font-extrabold">{t("whatToDo", lang)}</div>
        <p className="mt-0.5 text-[15px] font-semibold">{c(s.sto_uciniti, lang)}</p>
      </div>
      <SpecialActions prva_pomoc={s.prva_pomoc} prijava_url={s.prijava_url} lang={lang} />
      {onRecipe && <RecipeOffer recipe={recipe} lang={lang} onOpen={onRecipe} className="mt-3" />}
      <p className="mt-4 text-xs text-slate-500">{t("speciesDisclaimer", lang)}</p>
    </div>
  );
}
