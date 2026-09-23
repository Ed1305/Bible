"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getTranslation } from "@/lib/bible/translations";
import { bookName } from "@/lib/bible/books";
import { ReadLink } from "@/components/ReadLink";
import { ChevronRight, SunIcon } from "@/components/icons";

interface PlanRow {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  durationDays: number;
  accent: string | null;
  days: { day: number; title: string; reference: string }[];
}

const VOTD = [
  { book: "john", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life." },
  { book: "philippians", chapter: 4, verse: 13, text: "I can do all things through him who strengthens me." },
  { book: "psalms", chapter: 23, verse: 1, text: "The Lord is my shepherd; I shall not want." },
  { book: "proverbs", chapter: 3, verse: 5, text: "Trust in the Lord with all your heart, and do not lean on your own understanding." },
  { book: "isaiah", chapter: 40, verse: 31, text: "But they who wait for the Lord shall renew their strength." },
];

const accentClasses: Record<string, string> = {
  blue: "from-accent to-[#41618f]",
  green: "from-verdant to-[#559277]",
  gold: "from-gold to-[#c39a4d]",
};

export default function TodayPage() {
  const { completedDays, lang, settings, t } = useStore();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const votd = VOTD[new Date().getDate() % VOTD.length];
  const tr = getTranslation(settings.translation);

  return (
    <div className="px-4 pt-2">
      <header className="flex items-center gap-3 pt-1">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/20 text-gold">
          <SunIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-semibold leading-none text-ink">
            {t.today}
          </h1>
          <p className="mt-1 text-[13px] text-muted">{t.plansSubtitle}</p>
        </div>
      </header>

      {/* Verse of the day */}
      <ReadLink
        translation="ESV"
        book={votd.book}
        chapter={votd.chapter}
        className="mt-4 block overflow-hidden rounded-[20px] bg-gradient-to-br from-[#2b3a55] to-[#41618f] p-5 text-white shadow-soft"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
          {t.verseOfDay}
        </p>
        <p className="mt-2 font-serif text-lg leading-relaxed">
          &ldquo;{votd.text}&rdquo;
        </p>
        <p className="mt-3 text-[13px] font-medium text-white/80">
          {bookName(votd.book, lang)} {votd.chapter}:{votd.verse} · {tr.abbr}
        </p>
      </ReadLink>

      {/* Plans */}
      <h2 className="mb-3 mt-6 text-[13px] font-semibold uppercase tracking-wider text-muted">
        {t.readingPlans}
      </h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[20px] bg-surface-2" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3 pb-6">
          {plans.map((p) => {
            const done = completedDays(p.slug).length;
            const pct = Math.round((done / p.durationDays) * 100);
            const grad = accentClasses[p.accent ?? "blue"] ?? accentClasses.blue;
            return (
              <li key={p.slug}>
                <Link
                  href={`/today/${p.slug}`}
                  className="block rounded-[20px] border border-line bg-surface p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${grad} text-lg font-bold text-white`}
                      >
                        {p.durationDays}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{p.title}</p>
                        <p className="text-[13px] text-muted">{p.subtitle}</p>
                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                          {p.durationDays} {t.days} · {p.category}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-verdant transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-muted">
                      {done}/{p.durationDays}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
