"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore, type ChapterData } from "@/lib/store";
import { BOOKS_BY_SLUG, bookName } from "@/lib/bible/books";
import { getTranslation } from "@/lib/bible/translations";
import { parseReadLocation } from "@/lib/bible/href";
import { downloadPack, isPackDownloaded } from "@/lib/offline";
import { ReadLink } from "@/components/ReadLink";
import {
  BackIcon,
  AAIcon,
  PenIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  ChevronRight,
  PlayIcon,
  DownloadIcon,
  CheckIcon,
} from "@/components/icons";
import { Sheet } from "@/components/ui";

export default function ReaderView() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const ref = parseReadLocation(pathname, search);
  const translation = ref.translation;
  const book = ref.book;
  const chapter = ref.chapter;

  const {
    fetchChapter,
    getCachedChapter,
    lang,
    settings,
    setTextScale,
    toggleBookmark,
    toggleHighlight,
    setNote,
    getNote,
    isBookmarked,
    isHighlighted,
    setLastRead,
    t,
  } = useStore();

  const meta = BOOKS_BY_SLUG[book];
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [showSize, setShowSize] = useState(false);
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showChapters, setShowChapters] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState("");
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchChapter(translation, book, chapter).then((d) => {
      if (!active) return;
      setData(d);
      setLoading(false);
    });
    setLastRead(book, chapter);
    setSelected(null);
    setShowChapters(false);
    setDownloaded(!!getCachedChapter(translation, book, chapter));
    void isPackDownloaded(translation).then((yes) => {
      if (active && yes) setDownloaded(true);
    });
    return () => {
      active = false;
    };
  }, [translation, book, chapter, fetchChapter, setLastRead, getCachedChapter]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 1600);
  }, []);

  const totalChapters = meta?.chapters ?? 1;
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < totalChapters ? chapter + 1 : null;

  const scale = settings.textScale;
  const shownTranslation = data?.translation || translation;
  const shownTr = getTranslation(shownTranslation);
  const chapterLabel = `${bookName(book, lang)} ${chapter} · ${shownTr.abbr}`;

  const onShare = useCallback(
    async (verse: number, text: string) => {
      const refLabel = `${bookName(book, lang)} ${chapter}:${verse} (${shownTr.abbr})`;
      const shareText = `"${text}" — ${refLabel}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: refLabel, text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          showToast("Copied to clipboard");
        }
      } catch {
        /* cancelled */
      }
    },
    [book, chapter, lang, shownTr.abbr, showToast],
  );

  const onDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const result = await downloadPack(translation);
      if (result.failed.length === 0) {
        setDownloaded(true);
        showToast(t.downloaded);
      } else {
        showToast(`${result.failed.length} books failed — tap to retry`);
      }
    } catch {
      showToast("Download failed. Try Settings → Offline Bibles.");
    } finally {
      setDownloading(false);
    }
  }, [downloading, translation, showToast, t.downloaded]);

  const verses = data?.verses ?? [];

  const noteVerse = useMemo(
    () => verses.find((v) => v.verse === noteFor),
    [verses, noteFor],
  );

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            onClick={() => router.back()}
            className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-2"
            aria-label="Back"
          >
            <BackIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowChapters(true)}
            className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted"
          >
            {chapterLabel}
            <ChevronRight className="h-3.5 w-3.5 rotate-90" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => void onDownload()}
              disabled={downloading}
              className={
                "grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2 " +
                (downloaded ? "text-verdant" : "text-ink")
              }
              aria-label={t.downloadOffline}
            >
              {downloaded ? <CheckIcon className="h-5 w-5" /> : <DownloadIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setShowSize((s) => !s)}
              className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-2"
              aria-label={t.textSize}
            >
              <AAIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showSize && (
          <div className="animate-pop mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-float">
            <span className="text-sm text-muted">{t.textSize}</span>
            <button
              onClick={() => setTextScale(scale - 0.1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-sm font-bold"
            >
              A-
            </button>
            <input
              type="range"
              min={0.85}
              max={1.6}
              step={0.05}
              value={scale}
              onChange={(e) => setTextScale(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <button
              onClick={() => setTextScale(scale + 0.1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-base font-bold"
            >
              A+
            </button>
          </div>
        )}
      </div>

      <article className="px-6 pb-10 pt-4">
        <h1 className="mb-1 text-center font-serif text-[28px] italic text-ink">
          {bookName(book, lang)} {chapter}
        </h1>
        <div className="mx-auto mb-6 h-px w-10 bg-line" />

        {loading && !verses.length ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-surface-2" style={{ width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        ) : verses.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="font-serif text-lg text-ink">{bookName(book, lang)} {chapter}</p>
            <p className="mt-2 text-sm text-muted">
              Unable to load {bookName(book, lang)} {chapter}. Download this Bible in Settings, or check your connection.
            </p>
            <button
              type="button"
              onClick={() => void onDownload()}
              disabled={downloading}
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {downloading ? t.downloading : t.downloadOffline}
            </button>
            {translation !== "ESV" && (
              <ReadLink
                translation="ESV"
                book={book}
                chapter={chapter}
                className="mt-3 block text-sm font-semibold text-accent"
              >
                Read in English (ESV)
              </ReadLink>
            )}
          </div>
        ) : (
          <div className="scripture" style={{ fontSize: `${17 * scale}px` }}>
            {verses.map((v) => {
              const active = selected === v.verse;
              const hl = isHighlighted(book, chapter, v.verse);
              const hasNote = !!getNote(book, chapter, v.verse);
              return (
                <div key={v.verse} className="relative">
                  {v.heading && (
                    <h2 className="mb-1 mt-5 font-sans text-[15px] font-bold text-ink">
                      {v.heading}
                    </h2>
                  )}
                  <p
                    onClick={() => setSelected(active ? null : v.verse)}
                    className={
                      "verse-row cursor-pointer transition-colors " +
                      (active ? "is-active " : "") +
                      (hl ? "is-highlighted " : "")
                    }
                  >
                    <span className="verse-text">
                      {hl && <span aria-hidden="true">★ </span>}
                      {v.text}
                      {hasNote && (
                        <PenIcon className="mb-0.5 ml-1 inline h-3.5 w-3.5 text-accent" />
                      )}
                    </span>
                    <span className="verse-num">{v.verse}</span>
                  </p>

                  {active && (
                    <div
                      ref={toolbarRef}
                      className="animate-pop absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-float"
                    >
                      <ToolbarBtn
                        label={t.note}
                        onClick={() => {
                          setNoteFor(v.verse);
                          setNoteDraft(getNote(book, chapter, v.verse));
                        }}
                      >
                        <PenIcon className="h-5 w-5 text-ink" />
                      </ToolbarBtn>
                      <ToolbarBtn
                        label={t.highlight}
                        onClick={() => {
                          toggleHighlight(book, chapter, v.verse);
                          setSelected(null);
                        }}
                      >
                        <HeartIcon
                          className={"h-5 w-5 " + (hl ? "fill-gold text-gold" : "text-ink")}
                        />
                      </ToolbarBtn>
                      <ToolbarBtn label={t.share} onClick={() => onShare(v.verse, v.text)}>
                        <ShareIcon className="h-5 w-5 text-ink" />
                      </ToolbarBtn>
                      <ToolbarBtn
                        label={t.bookmark}
                        onClick={() => {
                          toggleBookmark(book, chapter, v.verse);
                          showToast(isBookmarked(book, chapter, v.verse) ? "Removed" : "Bookmarked");
                        }}
                      >
                        <BookmarkIcon
                          className={
                            "h-5 w-5 " +
                            (isBookmarked(book, chapter, v.verse)
                              ? "fill-verdant text-verdant"
                              : "text-ink")
                          }
                        />
                      </ToolbarBtn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          {prevChapter ? (
            <ReadLink
              translation={shownTranslation}
              book={book}
              chapter={prevChapter}
              className="flex items-center gap-1 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-soft"
            >
              <BackIcon className="h-4 w-4" /> {chapter - 1}
            </ReadLink>
          ) : (
            <span />
          )}
          <a
            href={`/listen?translation=${shownTranslation}&book=${book}&chapter=${chapter}`}
            className="flex items-center gap-2 rounded-full bg-verdant px-5 py-2 text-sm font-semibold text-white shadow-soft"
          >
            <PlayIcon className="h-4 w-4" /> {t.listen}
          </a>
          {nextChapter ? (
            <ReadLink
              translation={shownTranslation}
              book={book}
              chapter={nextChapter}
              className="flex items-center gap-1 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-soft"
            >
              {chapter + 1} <ChevronRight className="h-4 w-4" />
            </ReadLink>
          ) : (
            <span />
          )}
        </div>
      </article>

      {noteFor !== null && (
        <Sheet onClose={() => setNoteFor(null)}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {bookName(book, lang)} {chapter}:{noteFor}
          </p>
          {noteVerse && (
            <p className="mt-1 font-serif text-sm text-ink">
              {noteVerse.text}
            </p>
          )}
          <textarea
            autoFocus
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={t.journalPlaceholder}
            className="mt-3 h-32 w-full resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setNote(book, chapter, noteFor, noteDraft);
                setNoteFor(null);
                setSelected(null);
                showToast(t.save);
              }}
              className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-white"
            >
              {t.save}
            </button>
          </div>
        </Sheet>
      )}

      {showChapters && (
        <Sheet onClose={() => setShowChapters(false)}>
          <p className="mb-3 text-center font-serif text-lg font-semibold">
            {bookName(book, lang)}
          </p>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((c) => (
              <ReadLink
                key={c}
                translation={shownTranslation}
                book={book}
                chapter={c}
                className={
                  "grid h-11 place-items-center rounded-xl text-sm font-medium " +
                  (c === chapter
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-ink hover:bg-line")
                }
              >
                {c}
              </ReadLink>
            ))}
          </div>
        </Sheet>
      )}

      {toast && (
        <div className="animate-pop fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#2b3340] px-4 py-2 text-sm text-white shadow-float">
          {toast}
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
