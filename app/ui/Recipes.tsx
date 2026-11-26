"use client";

import { ChefHat, Clock, ExternalLink, Leaf, Scissors, Skull } from "lucide-react";
import type { Recipe, Recipes } from "@/lib/recipes";
import { c, t, type Lang } from "@/lib/i18n";
import { Card } from "./Dashboard";

/** "How to prepare it: <recipe>" – offered in the fish description and right after a kept fish in My catch. */
export function RecipeOffer({ recipe, lang, onOpen, className = "" }: { recipe: Recipe | undefined; lang: Lang; onOpen: (key: string) => void; className?: string }) {
  if (!recipe) return null;
  return (
    <button
      onClick={() => onOpen(recipe.key)}
      className={`flex w-full items-center gap-3 rounded-2xl bg-sand-100 p-3 text-left text-ink ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-sea-600">
        <ChefHat className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-500">{t("howToPrepare", lang)}</span>
        <span className="block font-extrabold">{c(recipe.naziv, lang)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
        <Clock className="h-3 w-3" /> {recipe.vrijeme_min} min →
      </span>
    </button>
  );
}

/** Small card on the main screen that opens the recipes. */
export function RecipesCard({ lang, onOpen }: { lang: Lang; onOpen: () => void }) {
  return (
    <Card>
      <button onClick={onOpen} className="flex w-full items-center gap-3 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 text-sea-600">
          <ChefHat className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">{t("recipes", lang)}</span>
          <span className="block text-sm text-slate-500">{t("recipesSub", lang)}</span>
        </span>
      </button>
    </Card>
  );
}

function RecipeView({ r, lang, open }: { r: Recipe; lang: Lang; open: boolean }) {
  return (
    <details id={`recept-${r.key}`} open={open} className={`rounded-2xl p-3 ${r.istaknuto ? "bg-emerald-50 ring-2 ring-go" : "bg-sand-50"}`}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {r.istaknuto === "dobro_za_more" && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-go px-2 py-0.5 text-[11px] font-bold text-white">
            <Leaf className="h-3 w-3" /> {t("goodForSea", lang)}
          </span>
        )}
        <div className="font-extrabold">{c(r.naziv, lang)}</div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" /> {r.vrijeme_min} min · {t("ingredients", lang)}: {r.sastojci.length}
        </div>
      </summary>
      <p className="mt-2 text-sm italic text-slate-600">{c(r.prica, lang)}</p>
      {r.ciscenje.length > 0 && (
        <div className="mt-3 rounded-xl bg-sea-100 p-3">
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <Scissors className="h-4 w-4 text-sea-600" /> {t("cleaningFish", lang)}
          </div>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
            {r.ciscenje.map((s, i) => (
              <li key={i}>{c(s, lang)}</li>
            ))}
          </ol>
        </div>
      )}
      <div className="mt-3 text-sm font-bold">{t("ingredients", lang)}</div>
      <ul className="list-disc pl-5 text-sm">
        {r.sastojci.map((s, i) => (
          <li key={i}>{c(s, lang)}</li>
        ))}
      </ul>
      <div className="mt-2 text-sm font-bold">{t("steps", lang)}</div>
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        {r.koraci.map((s, i) => (
          <li key={i}>{c(s, lang)}</li>
        ))}
      </ol>
      {(r.autor || r.link) && (
        <p className="mt-2 text-xs text-slate-500">
          {t("recipeBy", lang)}: {r.link ? (
            <a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-sea-600 underline">
              {r.autor ?? r.link} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            r.autor
          )}
        </p>
      )}
    </details>
  );
}

/** Recipes sheet: how to clean a fish, the pufferfish warning, then the recipes (one opened when coming from a fish card). */
export function RecipesSheet({ data, lang, focus }: { data: Recipes; lang: Lang; focus: string | null }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
        <ChefHat className="h-6 w-6 text-sea-600" /> {t("recipes", lang)}
      </h3>
      <p className="text-sm text-slate-500">{t("recipesSub", lang)}</p>

      {/* never eat a pufferfish – instead of a recipe */}
      <div className="mt-4 flex gap-3 rounded-2xl bg-stop p-4 text-white">
        <Skull className="h-8 w-8 shrink-0" />
        <div>
          <div className="text-lg font-extrabold">{t("pufferNoEat", lang)}</div>
          <p className="text-sm">{t("pufferNoEatSub", lang)}</p>
        </div>
      </div>

      {data.ciscenje && (
        <details open={!focus} className="mt-4 rounded-2xl bg-sea-100 p-3">
          <summary className="cursor-pointer font-extrabold">{c(data.ciscenje.naslov, lang)}</summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
            {data.ciscenje.koraci.map((k, i) => (
              <li key={i}>{c(k, lang)}</li>
            ))}
          </ol>
        </details>
      )}

      <div className="mt-4 space-y-3">
        {data.recepti.map((r) => (
          <RecipeView key={r.key} r={r} lang={lang} open={focus === r.key || data.recepti.length === 1} />
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">{t("recipesDisclaimer", lang)}</p>
    </div>
  );
}
