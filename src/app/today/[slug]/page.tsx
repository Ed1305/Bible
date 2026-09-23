"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { bookName } from "@/lib/bible/books";
import { ReadLink } from "@/components/ReadLink";
import { TopBar } from "@/components/ui";
import { CheckIcon, ChevronRight } from "@/components/icons";

interface PlanDay {
  day: number;
  title: string;
  reference: string;
  readings: { book: string; chapter: number }[];
}
interface PlanRow {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  durationDays: number;
  days: PlanDay[];
}

export default function PlanDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { settings, completedDays, togglePlanDay, lang, t } = useStore();
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => setPlan((d.plans ?? []).find((p: PlanRow) => p.slug === slug) ?? null))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="px-4">
        <TopBar backHref="/today" title={t.readingPlans} />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[18px] bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="px-4">
        <TopBar backHref="/today" title={t.readingPlans} />
        <p className="mt-10 text-center text-muted">{t.empty}</p>
      </div>
    );
  }

  const done = completedDays(plan.slug);
  const pct = Math.round((done.length / plan.durationDays) * 100);

  return (
    <div>
      <TopBar backHref="/today" title={t.readingPlans} />
      <div className="px-4 pb-8">
        <div className="rounded-[20px] bg-gradient-to-br from-accent to-[#41618f] p-5 text-white shadow-soft">
          <h1 className="font-serif text-2xl font-semibold">{plan.title}</h1>
          <p className="mt-1 text-[14px] text-white/85">{plan.description ?? plan.subtitle}</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[12px] font-semibold">
              {done.length}/{plan.durationDays}
            </span>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5">
          {plan.days.map((d) => {
            const isDone = done.includes(d.day);
            const first = d.readings[0];
            return (
              <li
                key={d.day}
                className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-soft"
              >
                <button
                  onClick={() => togglePlanDay(plan.slug, d.day)}
                  aria-label={t.markComplete}
                  className={
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition " +
                    (isDone
                      ? "border-verdant bg-verdant text-white"
                      : "border-line bg-surface text-muted")
                  }
                >
                  {isDone ? <CheckIcon className="h-5 w-5" /> : <span className="text-sm font-semibold">{d.day}</span>}
                </button>
                <ReadLink
                  translation={settings.translation}
                  book={first?.book ?? "genesis"}
                  chapter={first?.chapter ?? 1}
                  className="flex flex-1 items-center justify-between"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                      {t.day} {d.day}
                    </p>
                    <p className={"font-medium " + (isDone ? "text-muted line-through" : "text-ink")}>
                      {d.title}
                    </p>
                    <p className="text-[13px] text-muted">
                      {first ? `${bookName(first.book, lang)} ${first.chapter}` : d.reference}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted" />
                </ReadLink>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
