import type { Metadata } from "next";
import { LANGS, LOCALE_TAG, c, t, type Lang } from "@/lib/i18n";
import { loadPrivacy } from "@/lib/privacy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privatnost · Ribolov" };

type Search = Promise<Record<string, string | string[] | undefined>>;

/** /privatnost?lang= – privacy policy in the chosen language (text: data/privacy.yaml). */
export default async function PrivacyPage({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const lang = (LANGS.some((l) => l.code === q.lang) ? q.lang : "hr") as Lang;
  const p = loadPrivacy();
  const date = p.vrijedi_od
    ? new Intl.DateTimeFormat(LOCALE_TAG[lang], { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${p.vrijedi_od}T12:00:00Z`))
    : "";
  const withEmail = (s: string) =>
    s.split("{email}").flatMap((part, i) =>
      i === 0
        ? [part]
        : [
            <a key={i} href={`mailto:${p.voditelj.email}`} className="font-semibold text-sea-600 underline">
              {p.voditelj.email}
            </a>,
            part,
          ],
    );

  return (
    <main lang={lang} className="mx-auto max-w-2xl px-4 py-6">
      <a href="/" className="text-sm font-semibold text-sea-600">
        ← {t("backToMap", lang)}
      </a>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{t("privacy", lang)}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {t("validFrom", lang)} {date}
      </p>

      <nav className="mt-3 flex flex-wrap gap-1.5" aria-label="Language">
        {LANGS.map((l) => (
          <a
            key={l.code}
            href={`/privatnost?lang=${l.code}`}
            aria-current={l.code === lang ? "page" : undefined}
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${l.code === lang ? "bg-navy-900 text-white" : "bg-sand-100"}`}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <section className="mt-5 rounded-3xl bg-card p-4 shadow-sm">
        <h2 className="font-extrabold">{t("controller", lang)}</h2>
        <p className="mt-1">
          {p.voditelj.ime} ·{" "}
          <a href={`mailto:${p.voditelj.email}`} className="font-semibold text-sea-600 underline">
            {p.voditelj.email}
          </a>
        </p>
      </section>

      <div className="mt-4 space-y-4">
        {p.odjeljci.map((o, i) => (
          <section key={i}>
            <h2 className="text-lg font-extrabold">{c(o.naslov, lang)}</h2>
            <p className="mt-1 text-[15px] leading-relaxed">{withEmail(c(o.tekst, lang))}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
