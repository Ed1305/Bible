"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { bookName } from "@/lib/bible/books";
import { getTranslation } from "@/lib/bible/translations";
import { ReadLink } from "@/components/ReadLink";
import { Chip } from "@/components/ui";
import { BackIcon, SearchIcon, CloseIcon } from "@/components/icons";

const HISTORY_KEY = "bible.searchHistory";

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
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

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

  const saveHistory = (term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setHistory((prev) => {
      const next = [clean, ...prev.filter((h) => h.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  };

  const term = q.trim();

  return (
    <div className="min-h-full bg-surface px-5 pt-3">
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveHistory(term);
          inputRef.current?.blur();
        }}
        className="flex items-center gap-2"
      >
        <Link
          href="/"
          className="grid h-9 w-7 shrink-0 place-items-center text-ink"
          aria-label="Back"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
        <div className="flex flex-1 items-center border border-ink/40 bg-surface px-3 py-2 focus-within:border-ink">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="grid h-6 w-6 place-items-center rounded-full text-muted"
              aria-label="Clear"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center text-muted" aria-label={t.search}>
          <SearchIcon className="h-5 w-5" />
        </button>
      </form>

      {/* History */}
      <div className="mt-4 flex items-center justify-between pl-9 text-[14px] text-ink">
        <span>History</span>
        {history.length > 0 && (
          <button onClick={clearHistory} className="text-ink">
            Clear
          </button>
        )}
      </div>
      {history.length > 0 ? (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1 pl-9">
          {history.map((h) => (
            <Chip key={h} active={term.toLowerCase() === h.toLowerCase()} onClick={() => setQ(h)}>
              {h}
            </Chip>
          ))}
        </div>
      ) : (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1 pl-9">
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
      )}

      {/* Results */}
      <div className="mt-4 pl-9">
        {term.length >= 2 && (
          <p className="mb-3 text-[14px] text-muted">
            Search results for <span className="font-semibold text-ink">&lsquo;{term}&rsquo;</span>
            {countLabel && <span className="ml-1 text-[12px]">· {countLabel.toLowerCase()}</span>}
          </p>
        )}

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-accent/20" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
              </div>
            ))}
          </div>
        )}

        {!loading && touched && term.length >= 2 && results.length === 0 && (
          <div className="mt-16 text-center text-muted">
            <SearchIcon className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">{t.noResults}</p>
          </div>
        )}

        <ul className="space-y-4 pb-6">
          {!loading &&
            results.map((r) => (
              <li key={`${r.book}-${r.chapter}-${r.verse}`}>
                <ReadLink
                  translation={settings.translation}
                  book={r.book}
                  chapter={r.chapter}
                  onClick={() => saveHistory(term)}
                  className="block"
                >
                  <p className="text-[15px] font-bold text-accent">
                    {bookName(r.book, lang)} {r.chapter}:{r.verse}
                    <span className="ml-1.5 text-[11px] font-semibold text-muted">{tr.abbr}</span>
                  </p>
                  <p className="mt-0.5 text-[14px] leading-snug text-ink">
                    <Highlighted text={r.text} term={term} />
                  </p>
                </ReadLink>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function Highlighted({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-ink">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
