"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { BOOKS_BY_SLUG, bookName } from "@/lib/bible/books";
import { getTranslation } from "@/lib/bible/translations";
import { ReadLink } from "@/components/ReadLink";
import { Segmented } from "@/components/ui";
import { BackIcon, BookmarkIcon, TrashIcon, PenIcon } from "@/components/icons";

type Order = "recent" | "bible";

interface Saved {
  key: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
}

function parseKey(key: string): Saved | null {
  const [translation, book, chapter, verse] = key.split(":");
  if (!translation || !BOOKS_BY_SLUG[book]) return null;
  const c = Number(chapter);
  const v = Number(verse);
  if (!c || !v) return null;
  return { key, translation, book, chapter: c, verse: v };
}

export default function BookmarksPage() {
  const { user, lang, fetchChapter, removeBookmark } = useStore();
  const [order, setOrder] = useState<Order>("recent");
  // Verse text by bookmark key; undefined = still loading, "" = unavailable.
  const [texts, setTexts] = useState<Record<string, string>>({});

  const saved = useMemo(
    () => user.bookmarks.map(parseKey).filter((b): b is Saved => b !== null),
    [user.bookmarks],
  );

  const list = useMemo(() => {
    if (order === "recent") return [...saved].reverse(); // newest saved first
    return [...saved].sort(
      (a, b) =>
        BOOKS_BY_SLUG[a.book].order - BOOKS_BY_SLUG[b.book].order ||
        a.chapter - b.chapter ||
        a.verse - b.verse,
    );
  }, [saved, order]);

  // Load each chapter once (offline-first), then pick out the saved verses.
  useEffect(() => {
    let active = true;
    const chapters = new Map<string, Saved[]>();
    for (const b of saved) {
      if (texts[b.key] !== undefined) continue;
      const id = `${b.translation}:${b.book}:${b.chapter}`;
      chapters.set(id, [...(chapters.get(id) ?? []), b]);
    }
    for (const group of chapters.values()) {
      const { translation, book, chapter } = group[0];
      fetchChapter(translation, book, chapter).then((data) => {
        if (!active) return;
        setTexts((prev) => {
          const next = { ...prev };
          for (const b of group) {
            next[b.key] = data.verses.find((v) => v.verse === b.verse)?.text ?? "";
          }
          return next;
        });
      });
    }
    return () => {
      active = false;
    };
    // `texts` is intentionally left out: it only skips already-loaded verses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved, fetchChapter]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-8 pt-2 md:px-6">
      <header className="flex items-center gap-2 pt-1">
        <Link
          href="/"
          className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2"
          aria-label="Back"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold leading-none text-ink">Bookmarks</h1>
          <p className="mt-1 text-[13px] text-muted">
            {saved.length} saved {saved.length === 1 ? "verse" : "verses"}
          </p>
        </div>
      </header>

      {saved.length > 1 && (
        <div className="mt-4">
          <Segmented
            value={order}
            onChange={setOrder}
            options={[
              { value: "recent", label: "Recently saved" },
              { value: "bible", label: "Bible order" },
            ]}
          />
        </div>
      )}

      {saved.length === 0 ? (
        <div className="mt-20 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            <BookmarkIcon className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-ink">No bookmarks yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            While reading, tap a verse and then <span className="font-semibold">Bookmark</span> in
            the navy bar to save it here.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
          >
            Start reading
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((b) => {
            const text = texts[b.key];
            const note = user.notes[b.key];
            return (
              <li
                key={b.key}
                className="flex items-start gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-soft"
              >
                <ReadLink
                  translation={b.translation}
                  book={b.book}
                  chapter={b.chapter}
                  verse={b.verse}
                  className="min-w-0 flex-1"
                >
                  <p className="text-[15px] font-bold text-accent">
                    {bookName(b.book, lang)} {b.chapter}:{b.verse}
                    <span className="ml-1.5 text-[11px] font-semibold text-muted">
                      {getTranslation(b.translation).abbr}
                    </span>
                  </p>
                  {text === undefined ? (
                    <div className="mt-2 space-y-1.5">
                      <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
                    </div>
                  ) : (
                    <p className="mt-1 text-[15px] leading-relaxed text-ink">
                      {text || (
                        <span className="text-muted">
                          Download this Bible in Settings to see the verse offline.
                        </span>
                      )}
                    </p>
                  )}
                  {note && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[13px] text-muted">
                      <PenIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      {note}
                    </p>
                  )}
                </ReadLink>
                <button
                  type="button"
                  onClick={() => removeBookmark(b.key)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-accent"
                  aria-label={`Remove ${bookName(b.book, lang)} ${b.chapter}:${b.verse}`}
                >
                  <TrashIcon className="h-4.5 w-4.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
