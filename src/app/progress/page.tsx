"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore, dayKey } from "@/lib/store";
import { BOOKS, BOOKS_BY_SLUG, bookName, type Testament } from "@/lib/bible/books";
import { ReadLink } from "@/components/ReadLink";
import { BackIcon, SummitIcon, ChevronRight } from "@/components/icons";

const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0);

export default function ProgressPage() {
  const { user, lang, settings, t } = useStore();

  const pct = Math.round((user.chaptersRead.length / TOTAL_CHAPTERS) * 1000) / 10;

  // Current position per testament: the most recently opened book, shown as
  // the span of chapters read in it (e.g. "Genesis 1-25").
  const current = useMemo(() => {
    const last: Partial<Record<Testament, string>> = {};
    for (const day of Object.keys(user.readLog).sort()) {
      for (const key of user.readLog[day]) {
        const book = key.split(":")[0];
        const meta = BOOKS_BY_SLUG[book];
        if (meta) last[meta.testament] = book;
      }
    }
    const span = (book?: string) => {
      if (!book) return null;
      const chs = user.chaptersRead
        .filter((k) => k.startsWith(`${book}:`))
        .map((k) => Number(k.split(":")[1]));
      const lo = Math.min(...chs);
      const hi = Math.max(...chs);
      return `${bookName(book, lang)} ${lo === hi ? lo : `${lo}-${hi}`}`;
    };
    return { OT: span(last.OT), NT: span(last.NT) };
  }, [user.readLog, user.chaptersRead, lang]);

  const week = useMemo(() => {
    const out: { key: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      out.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: user.readLog[key]?.length ?? 0,
      });
    }
    return out;
  }, [user.readLog]);

  const weekTotal = week.reduce((n, d) => n + d.count, 0);
  const streak = useMemo(() => {
    let n = 0;
    const d = new Date();
    if (!user.readLog[dayKey(d)]?.length) d.setDate(d.getDate() - 1);
    while (user.readLog[dayKey(d)]?.length) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [user.readLog]);

  return (
    <div className="min-h-full px-6 pb-8 pt-3 text-white">
      <Link
        href="/"
        className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10"
        aria-label="Back"
      >
        <BackIcon className="h-5 w-5" />
      </Link>

      <h1 className="mt-4 text-[22px] font-bold">Current Reading Progress</h1>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <div>
          <p className="text-[14px] text-white/80">{t.oldTestament}</p>
          <p className="mt-2 text-[13px] font-bold">{current.OT ?? "Not started"}</p>
        </div>
        <SummitIcon className="mt-2 h-8 w-8 text-white" aria-hidden="true" />
        <div className="text-right">
          <p className="text-[14px] text-white/80">{t.newTestament}</p>
          <p className="mt-2 text-[13px] font-bold">{current.NT ?? "Not started"}</p>
        </div>
      </div>

      <Ring pct={pct} />

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <Stat value={user.chaptersRead.length} label={`of ${TOTAL_CHAPTERS} chapters`} />
        <Stat value={weekTotal} label="this week" />
        <Stat value={streak} label={streak === 1 ? "day streak" : "days streak"} />
      </div>

      <h2 className="mt-10 text-[15px] text-accent">
        My <span className="font-bold text-white">Weekly</span> Progress
      </h2>
      <WeeklyChart days={week} />

      {user.lastRead && (
        <ReadLink
          translation={user.lastRead.translation || settings.translation}
          book={user.lastRead.book}
          chapter={user.lastRead.chapter}
          className="mt-8 flex items-center justify-between rounded-xl bg-accent px-5 py-3.5 text-[15px] font-semibold text-white"
        >
          {t.continueReading}: {bookName(user.lastRead.book, lang)} {user.lastRead.chapter}
          <ChevronRight className="h-5 w-5" />
        </ReadLink>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-[20px] font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-white/60">{label}</p>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 80;
  const c = 2 * Math.PI * r;
  const shown = pct > 0 ? Math.max(pct, 0.8) : 0; // keep a sliver visible once started
  return (
    <div className="relative mx-auto mt-10 h-[200px] w-[200px]">
      {/* rotate(90): the arc starts at 6 o'clock and fills clockwise */}
      <svg viewBox="0 0 200 200" className="h-full w-full rotate-90">
        <circle cx="100" cy="100" r={r} fill="var(--navy-2)" stroke="var(--navy-line)" strokeWidth="3" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * c} ${c}`}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[40px] font-light leading-none tabular-nums">{pct}%</p>
          <p className="mt-2 text-[13px] text-accent">of the Bible</p>
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ days }: { days: { key: string; label: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 300;
  const H = 110;
  const top = 10;
  const max = Math.max(4, ...days.map((d) => d.count));
  const x = (i: number) => (i / (days.length - 1)) * W;
  const y = (v: number) => H - (v / max) * (H - top);
  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div className="relative mt-4">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full overflow-visible" role="img"
        aria-label={`Chapters read per day: ${days.map((d) => `${d.label} ${d.count}`).join(", ")}`}
      >
        <defs>
          <linearGradient id="wk-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.35" />
          </linearGradient>
          <filter id="wk-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {[0, 0.5, 1].map((f) => (
          <line key={f} x1="0" x2={W} y1={top + f * (H - top)} y2={top + f * (H - top)}
            stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        ))}

        <path d={area} fill="var(--accent)" opacity="0.55" filter="url(#wk-glow)" />
        <path d={area} fill="url(#wk-fill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />

        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={top} y2={H} stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(days[hover].count)} r="4" fill="var(--accent)" stroke="var(--navy)" strokeWidth="2" />
          </>
        )}

        {days.map((d, i) => (
          <text key={d.key} x={x(i)} y={H + 16} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"}
            fontSize="10" fill="rgba(255,255,255,0.6)">
            {d.label}
          </text>
        ))}

        {/* hit targets — one full-height band per day */}
        {days.map((d, i) => (
          <rect key={`hit-${d.key}`} x={x(i) - W / 12} y="0" width={W / 6} height={H} fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            onTouchStart={() => setHover(i)} />
        ))}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-navy shadow-float"
          style={{ left: `${Math.min(92, Math.max(8, (x(hover) / W) * 100))}%` }}
        >
          {days[hover].label}: {days[hover].count} {days[hover].count === 1 ? "chapter" : "chapters"}
        </div>
      )}
    </div>
  );
}
