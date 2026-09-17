"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { BOOKS, bookName, type Testament } from "@/lib/bible/books";
import { getTranslation } from "@/lib/bible/translations";
import { Avatar, Segmented } from "@/components/ui";
import {
  SearchIcon,
  BellIcon,
  HeartIcon,
  NoteIcon,
  BookmarkIcon,
  ChevronRight,
  SettingsIcon,
  GlobeIcon,
} from "@/components/icons";

type AvailMap = Record<string, Record<string, number[]>>;

export default function BibleHome() {
  const { settings, user, lang, t } = useStore();
  const [testament, setTestament] = useState<Testament>("OT");
  const [avail, setAvail] = useState<AvailMap>({});
  const tr = getTranslation(settings.translation);

  useEffect(() => {
    fetch("/api/available")
      .then((r) => r.json())
      .then((d) => setAvail(d.available ?? {}))
      .catch(() => setAvail({}));
  }, []);

  // Per-book badge counts for the active translation.
  const counts = useMemo(() => {
    const c: Record<string, { hl: number; note: number; bm: number }> = {};
    const prefix = `${settings.translation}:`;
    for (const key of Object.keys(user.highlights)) {
      if (!key.startsWith(prefix)) continue;
      const book = key.split(":")[1];
      c[book] ??= { hl: 0, note: 0, bm: 0 };
      c[book].hl++;
    }
    for (const key of Object.keys(user.notes)) {
      if (!key.startsWith(prefix)) continue;
      const book = key.split(":")[1];
      c[book] ??= { hl: 0, note: 0, bm: 0 };
      c[book].note++;
    }
    for (const key of user.bookmarks) {
      if (!key.startsWith(prefix)) continue;
      const book = key.split(":")[1];
      c[book] ??= { hl: 0, note: 0, bm: 0 };
      c[book].bm++;
    }
    return c;
  }, [user, settings.translation]);

  const books = BOOKS.filter((b) => b.testament === testament);
  const availForTr = avail[settings.translation] ?? {};

  return (
    <div className="px-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Avatar label="LB" />
          <div>
            <h1 className="font-serif text-2xl font-semibold leading-none text-ink">
              {t.bible}
            </h1>
            <Link
              href="/settings"
              className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-accent"
            >
              {tr.abbr}
              <GlobeIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2"
            aria-label={t.search}
          >
            <SearchIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/today"
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2"
            aria-label={t.today}
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-verdant ring-2 ring-bg" />
          </Link>
          <Link
            href="/settings"
            className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2"
            aria-label={t.settings}
          >
            <SettingsIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Continue reading */}
      {user.lastRead && (
        <Link
          href={`/read/${user.lastRead.translation}/${user.lastRead.book}/${user.lastRead.chapter}`}
          className="mt-4 flex items-center justify-between rounded-[18px] bg-gradient-to-r from-accent to-[#41618f] p-4 text-white shadow-soft"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              {t.continueReading}
            </p>
            <p className="mt-0.5 font-serif text-lg font-semibold">
              {bookName(user.lastRead.book, lang)} {user.lastRead.chapter}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/80" />
        </Link>
      )}

      {/* Testament toggle */}
      <div className="mt-4">
        <Segmented<Testament>
          value={testament}
          onChange={setTestament}
          options={[
            { value: "OT", label: t.oldTestament },
            { value: "NT", label: t.newTestament },
          ]}
        />
      </div>

      {/* Book list */}
      <ul className="mt-3 space-y-2 pb-6">
        {books.map((b) => {
          const c = counts[b.slug];
          const has = (availForTr[b.slug]?.length ?? 0) > 0;
          return (
            <li key={b.slug}>
              <Link
                href={`/read/${settings.translation}/${b.slug}/1`}
                className="flex items-center justify-between rounded-[16px] border border-line bg-surface px-4 py-3.5 shadow-soft transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-[13px] font-semibold text-muted">
                    {b.order}
                  </span>
                  <div>
                    <span className="font-medium text-ink">
                      {bookName(b.slug, lang)}
                    </span>
                    <span className="ml-2 text-[11px] text-muted">
                      {b.chapters} {t.chapter.toLowerCase()}
                      {b.chapters > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-muted">
                  {c?.hl ? (
                    <span className="flex items-center gap-1 text-[12px]">
                      <HeartIcon className="h-4 w-4 text-gold" />
                      {c.hl}
                    </span>
                  ) : null}
                  {c?.note ? (
                    <span className="flex items-center gap-1 text-[12px]">
                      <NoteIcon className="h-4 w-4 text-accent" />
                      {c.note}
                    </span>
                  ) : null}
                  {c?.bm ? (
                    <span className="flex items-center gap-1 text-[12px]">
                      <BookmarkIcon className="h-4 w-4 text-verdant" />
                      {c.bm}
                    </span>
                  ) : null}
                  {has && !c && (
                    <span className="h-1.5 w-1.5 rounded-full bg-verdant" title="Available offline" />
                  )}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
