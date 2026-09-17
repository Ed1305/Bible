"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_TRANSLATION, getTranslation } from "./bible/translations";
import { BOOKS_BY_SLUG, type LangCode, type Testament } from "./bible/books";
import { ui, type UiStrings } from "./bible/i18n";
import { getOfflineChapter } from "./offline";

export type ThemeMode = "light" | "dark";

export interface VerseData {
  verse: number;
  heading: string | null;
  text: string;
}

export interface ChapterData {
  translation: string;
  book: string;
  chapter: number;
  verses: VerseData[];
}

export interface Prayer {
  id: string;
  text: string;
  answered: boolean;
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  text: string;
  createdAt: number;
}

interface Settings {
  translation: string;
  textScale: number;
  theme: ThemeMode;
  lastTestament: Testament;
}

interface UserData {
  bookmarks: string[]; // `${translation}:${book}:${chapter}:${verse}`
  highlights: Record<string, boolean>;
  notes: Record<string, string>;
  planProgress: Record<string, number[]>;
  prayers: Prayer[];
  journal: JournalEntry[];
  lastRead: { translation: string; book: string; chapter: number } | null;
}

const DEFAULT_USER: UserData = {
  bookmarks: [],
  highlights: {},
  notes: {},
  planProgress: {},
  prayers: [],
  journal: [],
  lastRead: null,
};

interface StoreValue {
  ready: boolean;
  online: boolean;
  settings: Settings;
  user: UserData;
  lang: LangCode;
  t: UiStrings;
  setTranslation: (code: string) => void;
  setTextScale: (v: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setLastTestament: (testament: Testament) => void;
  verseKey: (book: string, chapter: number, verse: number, translation?: string) => string;
  toggleBookmark: (book: string, chapter: number, verse: number) => void;
  toggleHighlight: (book: string, chapter: number, verse: number) => void;
  setNote: (book: string, chapter: number, verse: number, note: string) => void;
  isBookmarked: (book: string, chapter: number, verse: number) => boolean;
  isHighlighted: (book: string, chapter: number, verse: number) => boolean;
  getNote: (book: string, chapter: number, verse: number) => string;
  setLastRead: (book: string, chapter: number) => void;
  togglePlanDay: (slug: string, day: number) => void;
  completedDays: (slug: string) => number[];
  addPrayer: (text: string) => void;
  togglePrayer: (id: string) => void;
  deletePrayer: (id: string) => void;
  addJournal: (title: string, text: string) => void;
  deleteJournal: (id: string) => void;
  fetchChapter: (translation: string, book: string, chapter: number) => Promise<ChapterData>;
  getCachedChapter: (translation: string, book: string, chapter: number) => ChapterData | null;
}

const StoreContext = createContext<StoreValue | null>(null);

const SETTINGS_KEY = "bible.settings";
const USER_KEY = "bible.user";
const chapterCacheKey = (tr: string, b: string, c: number) => `bible.ch.${tr}.${b}.${c}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    translation: DEFAULT_TRANSLATION,
    textScale: 1,
    theme: "light",
    lastTestament: "OT",
  });
  const [user, setUser] = useState<UserData>(DEFAULT_USER);

  // hydrate
  useEffect(() => {
    try {
      const rawS = localStorage.getItem(SETTINGS_KEY);
      const rawU = localStorage.getItem(USER_KEY);
      const parsedS = rawS ? JSON.parse(rawS) : {};
      const parsedU = rawU ? JSON.parse(rawU) : {};
      if (rawU) setUser((p) => ({ ...p, ...parsedU }));
      const theme: ThemeMode = parsedS.theme === "dark" ? "dark" : "light";
      let lastTestament: Testament =
        parsedS.lastTestament === "NT" ? "NT" : "OT";
      if (parsedS.lastTestament !== "OT" && parsedS.lastTestament !== "NT") {
        lastTestament = BOOKS_BY_SLUG[parsedU.lastRead?.book]?.testament ?? "OT";
      }
      setSettings((p) => ({
        ...p,
        ...parsedS,
        theme,
        lastTestament,
        textScale: typeof parsedS.textScale === "number" ? parsedS.textScale : p.textScale,
      }));
    } catch {
      /* ignore */
    }
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    setReady(true);
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }, [user, ready]);

  // online/offline
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const lang = getTranslation(settings.translation).lang;
  const t = ui(lang);

  const verseKey = useCallback(
    (book: string, chapter: number, verse: number, translation?: string) =>
      `${translation ?? settings.translation}:${book}:${chapter}:${verse}`,
    [settings.translation],
  );

  const setTranslation = useCallback((code: string) => {
    setSettings((p) => ({ ...p, translation: code }));
  }, []);

  const setTextScale = useCallback((v: number) => {
    setSettings((p) => ({ ...p, textScale: Math.min(1.6, Math.max(0.85, v)) }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((p) => ({ ...p, theme }));
  }, []);

  const setLastTestament = useCallback((testament: Testament) => {
    setSettings((p) => ({ ...p, lastTestament: testament }));
  }, []);

  const toggleBookmark = useCallback(
    (book: string, chapter: number, verse: number) => {
      const key = verseKey(book, chapter, verse);
      setUser((p) => ({
        ...p,
        bookmarks: p.bookmarks.includes(key)
          ? p.bookmarks.filter((k) => k !== key)
          : [...p.bookmarks, key],
      }));
    },
    [verseKey],
  );

  const toggleHighlight = useCallback(
    (book: string, chapter: number, verse: number) => {
      const key = verseKey(book, chapter, verse);
      setUser((p) => {
        const next = { ...p.highlights };
        if (next[key]) delete next[key];
        else next[key] = true;
        return { ...p, highlights: next };
      });
    },
    [verseKey],
  );

  const setNote = useCallback(
    (book: string, chapter: number, verse: number, note: string) => {
      const key = verseKey(book, chapter, verse);
      setUser((p) => {
        const next = { ...p.notes };
        if (note.trim()) next[key] = note;
        else delete next[key];
        return { ...p, notes: next };
      });
    },
    [verseKey],
  );

  const isBookmarked = useCallback(
    (book: string, chapter: number, verse: number) =>
      user.bookmarks.includes(verseKey(book, chapter, verse)),
    [user.bookmarks, verseKey],
  );
  const isHighlighted = useCallback(
    (book: string, chapter: number, verse: number) =>
      !!user.highlights[verseKey(book, chapter, verse)],
    [user.highlights, verseKey],
  );
  const getNote = useCallback(
    (book: string, chapter: number, verse: number) =>
      user.notes[verseKey(book, chapter, verse)] ?? "",
    [user.notes, verseKey],
  );

  const setLastRead = useCallback(
    (book: string, chapter: number) => {
      const testament = BOOKS_BY_SLUG[book]?.testament ?? "OT";
      setUser((p) => ({
        ...p,
        lastRead: { translation: settings.translation, book, chapter },
      }));
      setSettings((p) => ({ ...p, lastTestament: testament }));
    },
    [settings.translation],
  );

  const togglePlanDay = useCallback((slug: string, day: number) => {
    setUser((p) => {
      const cur = p.planProgress[slug] ?? [];
      const next = cur.includes(day)
        ? cur.filter((d) => d !== day)
        : [...cur, day].sort((a, b) => a - b);
      return { ...p, planProgress: { ...p.planProgress, [slug]: next } };
    });
  }, []);

  const completedDays = useCallback(
    (slug: string) => user.planProgress[slug] ?? [],
    [user.planProgress],
  );

  const addPrayer = useCallback((text: string) => {
    if (!text.trim()) return;
    setUser((p) => ({
      ...p,
      prayers: [
        { id: crypto.randomUUID(), text: text.trim(), answered: false, createdAt: Date.now() },
        ...p.prayers,
      ],
    }));
  }, []);
  const togglePrayer = useCallback((id: string) => {
    setUser((p) => ({
      ...p,
      prayers: p.prayers.map((pr) =>
        pr.id === id ? { ...pr, answered: !pr.answered } : pr,
      ),
    }));
  }, []);
  const deletePrayer = useCallback((id: string) => {
    setUser((p) => ({ ...p, prayers: p.prayers.filter((pr) => pr.id !== id) }));
  }, []);

  const addJournal = useCallback((title: string, text: string) => {
    if (!text.trim() && !title.trim()) return;
    setUser((p) => ({
      ...p,
      journal: [
        {
          id: crypto.randomUUID(),
          title: title.trim() || "Untitled",
          text: text.trim(),
          createdAt: Date.now(),
        },
        ...p.journal,
      ],
    }));
  }, []);
  const deleteJournal = useCallback((id: string) => {
    setUser((p) => ({ ...p, journal: p.journal.filter((j) => j.id !== id) }));
  }, []);

  const getCachedChapter = useCallback(
    (translation: string, book: string, chapter: number): ChapterData | null => {
      try {
        const raw = localStorage.getItem(chapterCacheKey(translation, book, chapter));
        if (raw) return JSON.parse(raw) as ChapterData;
      } catch {
        /* ignore */
      }
      return null;
    },
    [],
  );

  const fetchChapter = useCallback(
    async (translation: string, book: string, chapter: number): Promise<ChapterData> => {
      const cached = getCachedChapter(translation, book, chapter);

      // 1. Offline-first: full translations downloaded into IndexedDB need no network.
      try {
        const offlineVerses = await getOfflineChapter(translation, book, chapter);
        if (offlineVerses && offlineVerses.length > 0) {
          return { translation, book, chapter, verses: offlineVerses };
        }
      } catch {
        /* IndexedDB unavailable — continue with other sources */
      }

      // 2. Network (DB / bundled packs / upstream), mirrored into localStorage.
      try {
        const res = await fetch(
          `/api/chapter?translation=${translation}&book=${book}&chapter=${chapter}`,
        );
        if (!res.ok) throw new Error("bad");
        const data = (await res.json()) as ChapterData;
        if (data.verses.length > 0) {
          try {
            localStorage.setItem(
              chapterCacheKey(data.translation, book, chapter),
              JSON.stringify(data),
            );
          } catch {
            /* ignore quota */
          }
          return data;
        }
      } catch {
        /* offline or server error — fall through to caches */
      }

      // 3. Anything seen before, in any translation.
      if (cached) return cached;
      return { translation, book, chapter, verses: [] };
    },
    [getCachedChapter],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      online,
      settings,
      user,
      lang,
      t,
      setTranslation,
      setTextScale,
      setTheme,
      setLastTestament,
      verseKey,
      toggleBookmark,
      toggleHighlight,
      setNote,
      isBookmarked,
      isHighlighted,
      getNote,
      setLastRead,
      togglePlanDay,
      completedDays,
      addPrayer,
      togglePrayer,
      deletePrayer,
      addJournal,
      deleteJournal,
      fetchChapter,
      getCachedChapter,
    }),
    [
      ready, online, settings, user, lang, t, setTranslation, setTextScale, setTheme,
      setLastTestament, verseKey,
      toggleBookmark, toggleHighlight, setNote, isBookmarked, isHighlighted, getNote,
      setLastRead, togglePlanDay, completedDays, addPrayer, togglePrayer, deletePrayer,
      addJournal, deleteJournal, fetchChapter, getCachedChapter,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
