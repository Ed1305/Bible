"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { bookName } from "@/lib/bible/books";
import { getTranslation } from "@/lib/bible/translations";
import { Chip } from "@/components/ui";
import { BackIcon, SearchIcon, CloseIcon } from "@/components/icons";

interface Result {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function SearchPage() {
  const { settings, lang, t } = useStore();
  const tr = getTranslation(settings.translation);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = ["Anxiety", "Doubt", "Faith", "Hope", "Love", "Peace", "Light"];
  const searchMap: Record<string, string> = {
    Anxiety: "anxious",
    Doubt: "believe",
    Faith: "faith",
    Hope: "hope",
    Love: "love",
    Peace: "peace",
    Light: "light",
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setTouched(true);
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}&translation=${settings.translation}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(id);
  }, [q, settings.translation]);

  const countLabel = useMemo(() => {
    if (!results.length) return "";
    return `${results.length} ${results.length === 1 ? t.result : t.results}`;
  }, [results.length, t]);

  return (
    <div className="px-4 pt-2">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-surface-2"
          aria-label="Back"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
        <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 shadow-soft">
          <SearchIcon className="h-5 w-5 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-muted"
              aria-label="Clear"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((s) => (
          <Chip
            key={s}
            active={q.toLowerCase() === (searchMap[s] ?? s).toLowerCase()}
            onClick={() => setQ(searchMap[s] ?? s)}
          >
            {s}
          </Chip>
        ))}
      </div>

      {/* Results */}
      <div className="mt-5">
        {countLabel && (
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {countLabel}
          </p>
        )}

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[18px] bg-surface-2" />
            ))}
          </div>
        )}

        {!loading && touched && q.trim().length >= 2 && results.length === 0 && (
          <div className="mt-16 text-center text-muted">
            <SearchIcon className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">{t.noResults}</p>
          </div>
        )}

        <ul className="space-y-3 pb-6">
          {results.map((r) => (
            <li key={`${r.book}-${r.chapter}-${r.verse}`}>
              <Link
                href={`/read/${settings.translation}/${r.book}/${r.chapter}`}
                className="block rounded-[18px] border border-line bg-surface p-4 shadow-soft"
              >
                <p className="text-[12px] font-semibold text-accent">
                  {bookName(r.book, lang)} {r.chapter}:{r.verse} · {tr.abbr}
                </p>
                <p className="scripture mt-1.5 text-[15px] leading-relaxed">
                  <Highlighted text={r.text} term={q.trim()} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Highlighted({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="hl-mark text-ink">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}
