"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useStore, type ChapterData } from "@/lib/store";
import { BOOKS_BY_SLUG, bookName } from "@/lib/bible/books";
import { getTranslation } from "@/lib/bible/translations";
import { parseReadLocation } from "@/lib/bible/href";
import { downloadPack, isPackDownloaded } from "@/lib/offline";
import { ReadLink } from "@/components/ReadLink";
import Link from "next/link";
import {
  BackIcon,
  PenIcon,
  ShareIcon,
  BookmarkIcon,
  ChevronRight,
  DownloadIcon,
  CheckIcon,
  MenuIcon,
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  HeadphonesIcon,
  ProgressIcon,
  SpeakerIcon,
  CommentIcon,
} from "@/components/icons";
import { Sheet } from "@/components/ui";
import { PassagePicker } from "@/components/PassagePicker";

export default function ReaderView() {
  const pathname = usePathname();
  const search = useSearchParams();
  const ref = parseReadLocation(pathname, search);
  const translation = ref.translation;
  const book = ref.book;
  const chapter = ref.chapter;
  const targetVerse = ref.verse;

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
  // A tap only overrides the ?verse= deep link it was made under; a new deep link
  // (or chapter change, which resets it) selects the linked verse again.
  const [picked, setPicked] = useState<{ link: number | null; verse: number | null } | null>(null);
  const selected = picked && picked.link === targetVerse ? picked.verse : targetVerse;
  const setSelected = useCallback(
    (verse: number | null | undefined) =>
      setPicked(verse === undefined ? null : { link: targetVerse, verse }),
    [targetVerse],
  );
  const [showSize, setShowSize] = useState(false);
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showChapters, setShowChapters] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchChapter(translation, book, chapter).then((d) => {
      if (!active) return;
      setData(d);
      setLoading(false);
    });
    setLastRead(book, chapter);
    setPicked(null);
    setShowChapters(false);
    setDownloaded(!!getCachedChapter(translation, book, chapter));
    void isPackDownloaded(translation).then((yes) => {
      if (active && yes) setDownloaded(true);
    });
    return () => {
      active = false;
    };
  }, [translation, book, chapter, fetchChapter, setLastRead, getCachedChapter]);

  // Deep link (?verse=N): select that verse and bring it into view once loaded.
  useEffect(() => {
    if (!targetVerse || !data || data.book !== book || data.chapter !== chapter) return;
    if (!data.verses.some((v) => v.verse === targetVerse)) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(`v-${targetVerse}`);
      if (!el) return;
      const header = document.querySelector<HTMLElement>("[data-reader-header]");
      const offset = (header?.offsetHeight ?? 0) + 16;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
    });
  }, [targetVerse, data, book, chapter]);

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

  const verses = useMemo(() => data?.verses ?? [], [data]);

  const noteVerse = useMemo(
    () => verses.find((v) => v.verse === noteFor),
    [verses, noteFor],
  );

  const target = selected ?? 1;
  const targetBookmarked = isBookmarked(book, chapter, target);
  const selectedVerse = verses.find((v) => v.verse === selected);

  const requireVerse = (fn: (verse: number) => void) => {
    if (selected === null) {
      showToast("Tap a verse first");
      return;
    }
    fn(selected);
  };

  // Group verses under their section headings so each group flows as one paragraph.
  const groups = useMemo(() => {
    const out: { heading: string | null; verses: typeof verses }[] = [];
    for (const v of verses) {
      if (v.heading || out.length === 0) out.push({ heading: v.heading, verses: [] });
      out[out.length - 1].verses.push(v);
    }
    return out;
  }, [verses]);

  const sideBtn =
    "fixed top-1/2 z-20 hidden -translate-y-1/2 place-items-center rounded-full p-1.5 text-ink/70 hover:bg-surface-2 hover:text-ink sm:grid";

  return (
    <div className="relative min-h-full bg-surface">
      {targetBookmarked && (
        <span
          aria-hidden="true"
          className="absolute right-5 top-0 z-40 h-6 w-4 bg-accent [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]"
        />
      )}

      <div data-reader-header className="sticky top-0 z-30 bg-surface">
        <div className="read-col flex items-center justify-between px-4 pb-2 pt-3 text-ink md:px-6">
          <IconLink href="/settings" label={t.settings}>
            <MenuIcon className="h-5 w-5" />
          </IconLink>
          <div className="flex items-center gap-1">
            <IconLink href="/" label={t.bible}>
              <HomeIcon className="h-5 w-5" />
            </IconLink>
            <IconLink href="/search" label={t.search}>
              <SearchIcon className="h-5 w-5" />
            </IconLink>
            <button
              onClick={() => setShowChapters(true)}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2"
              aria-label={t.selectChapter}
            >
              <LibraryIcon className="h-5 w-5" />
            </button>
            <IconLink
              href={`/listen?translation=${shownTranslation}&book=${book}&chapter=${chapter}`}
              label={t.listen}
              plain
            >
              <HeadphonesIcon className="h-5 w-5" />
            </IconLink>
            <IconLink href="/progress" label="Reading progress">
              <ProgressIcon className="h-5 w-5" />
            </IconLink>
          </div>
        </div>

        <div className="read-col flex items-center justify-between px-6 pb-3 pt-1 md:px-8">
          <button
            onClick={() => setShowChapters(true)}
            className="flex items-baseline gap-2 text-left"
          >
            <span className="text-[17px] font-bold uppercase tracking-wide text-accent">
              {bookName(book, lang)} {chapter}
            </span>
            <span className="text-[12px] font-semibold italic text-ink">{shownTr.abbr}</span>
          </button>
          <button
            onClick={() => void onDownload()}
            disabled={downloading}
            className={
              "grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2 " +
              (downloaded ? "text-verdant" : "text-muted")
            }
            aria-label={t.downloadOffline}
          >
            {downloaded ? <CheckIcon className="h-4.5 w-4.5" /> : <DownloadIcon className="h-4.5 w-4.5" />}
          </button>
        </div>

        <div className="bg-navy text-white">
        <div className="read-col flex items-center justify-between px-6 py-3 md:px-8">
          <span className="text-[15px] font-semibold md:text-[16px]">
            {bookName(book, lang)} {chapter}
            {selected !== null && <span className="font-normal text-white/60">:{selected}</span>}
          </span>
          <button
            onClick={() => {
              toggleBookmark(book, chapter, target);
              showToast(targetBookmarked ? "Removed" : "Bookmarked");
            }}
            className="flex items-center gap-1.5 text-[12px] text-white/90"
          >
            <BookmarkIcon className={"h-4 w-4 text-accent " + (targetBookmarked ? "fill-accent" : "fill-accent/0")} />
            {targetBookmarked ? "Bookmarked" : t.bookmark}
          </button>
        </div>
        </div>

        {showSize && (
          <div className="animate-pop mx-4 mt-3 flex items-center gap-3 rounded-2xl md:mx-auto md:max-w-xl border border-line bg-surface p-3 shadow-float">
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

      {prevChapter && (
        <ReadLink
          translation={shownTranslation}
          book={book}
          chapter={prevChapter}
          className={sideBtn + " left-[max(0.5rem,calc(50vw_-_var(--shell)/2_+_0.5rem))]"}
        >
          <BackIcon className="h-6 w-6" />
        </ReadLink>
      )}
      {nextChapter && (
        <ReadLink
          translation={shownTranslation}
          book={book}
          chapter={nextChapter}
          className={sideBtn + " right-[max(0.5rem,calc(50vw_-_var(--shell)/2_+_0.5rem))]"}
        >
          <ChevronRight className="h-6 w-6" />
        </ReadLink>
      )}

      <article className="read-col px-6 pb-8 pt-5 md:px-8 md:pt-8">
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
          <div className="scripture-flow" style={{ fontSize: `calc(var(--read-size) * ${scale})` }}>
            {groups.map((g, gi) => (
              <div key={gi}>
                {g.heading && (
                  <h2 className="mb-1 mt-5 text-[0.95em] font-bold text-ink first:mt-0">
                    {g.heading}
                  </h2>
                )}
                <p className="mb-3">
                  {g.verses.map((v) => {
                    const active = selected === v.verse;
                    const hl = isHighlighted(book, chapter, v.verse);
                    const hasNote = !!getNote(book, chapter, v.verse);
                    return (
                      <span
                        key={v.verse}
                        id={`v-${v.verse}`}
                        onClick={() => setSelected(active ? null : v.verse)}
                        className={"v " + (active ? "is-active " : "") + (hl ? "is-highlighted" : "")}
                      >
                        <span className="v-num">{v.verse}</span>
                        {v.text}
                        {hasNote && (
                          <PenIcon className="mb-0.5 ml-1 inline h-3.5 w-3.5 text-accent" />
                        )}{" "}
                      </span>
                    );
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {prevChapter ? (
            <ReadLink
              translation={shownTranslation}
              book={book}
              chapter={prevChapter}
              className="flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
            >
              <BackIcon className="h-4 w-4" /> {chapter - 1}
            </ReadLink>
          ) : (
            <span />
          )}
          {nextChapter ? (
            <ReadLink
              translation={shownTranslation}
              book={book}
              chapter={nextChapter}
              className="flex items-center gap-1 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white"
            >
              {bookName(book, lang)} {chapter + 1} <ChevronRight className="h-4 w-4" />
            </ReadLink>
          ) : (
            <span />
          )}
        </div>
      </article>

      <div
        className="sticky bottom-0 z-20 -mb-24 border-t border-accent/40 bg-surface pt-2"
        // Extends under the translucent bottom nav so verses never show through it.
        style={{ paddingBottom: "calc(88px + env(safe-area-inset-bottom))" }}
      >
        <div className="read-col flex items-center justify-between px-6 text-ink md:px-8">
          <ToolbarBtn label={t.textSize} onClick={() => setShowSize((s) => !s)}>
            <span className="text-[15px] font-medium">Aa</span>
          </ToolbarBtn>
          <ToolbarBtn
            label={t.highlight}
            onClick={() =>
              requireVerse((verse) => {
                toggleHighlight(book, chapter, verse);
                setSelected(null);
              })
            }
          >
            <PenIcon className={"h-5 w-5 " + (selected !== null && isHighlighted(book, chapter, selected) ? "text-accent" : "")} />
          </ToolbarBtn>
          <a
            href={`/listen?translation=${shownTranslation}&book=${book}&chapter=${chapter}`}
            aria-label={t.listen}
            className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
          >
            <SpeakerIcon className="h-5 w-5" />
          </a>
          {selectedVerse && (
            <ToolbarBtn label={t.share} onClick={() => onShare(selectedVerse.verse, selectedVerse.text)}>
              <ShareIcon className="h-5 w-5" />
            </ToolbarBtn>
          )}
          <ToolbarBtn
            label={t.note}
            onClick={() =>
              requireVerse((verse) => {
                setNoteFor(verse);
                setNoteDraft(getNote(book, chapter, verse));
              })
            }
          >
            <CommentIcon className="h-5 w-5" />
          </ToolbarBtn>
        </div>
      </div>

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
          <PassagePicker
            translation={shownTranslation}
            initialBook={book}
            initialChapter={chapter}
            initialStep="book"
            onDone={() => setShowChapters(false)}
          />
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

function IconLink({
  href,
  label,
  plain,
  children,
}: {
  href: string;
  label: string;
  plain?: boolean;
  children: React.ReactNode;
}) {
  const cls = "grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2";
  // Listen uses a full navigation so audio starts from a clean page.
  if (plain) {
    return (
      <a href={href} aria-label={label} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cls}>
      {children}
    </Link>
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
