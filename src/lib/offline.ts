import { createStore, get, set, del, keys, type UseStore } from "idb-keyval";
import { BOOKS_BY_SLUG } from "./bible/books";

/**
 * Client-side offline Bible storage.
 *
 * Full translations ("packs") live in `public/bible/<CODE>/<book>.json` and are
 * downloaded into IndexedDB + Cache Storage book-by-book, so a phone with zero
 * signal can read the entire Bible. Chapter reads go through here first.
 */

export interface PackMeta {
  code: string;
  label: string;
  lang: string;
  licence: string;
  note?: string;
  books: number;
  chapters: number;
  verses: number;
  bytes: number;
  files: string[];
}

export interface BibleManifest {
  generatedAt: string;
  totalBytes: number;
  packs: PackMeta[];
}

export interface OfflineChapter {
  translation: string;
  book: string;
  chapters: Record<string, string[]>;
}

export interface PackState {
  books: string[];
  downloadedAt: number;
}

export type OfflineIndex = Record<string, PackState>;

const INDEX_KEY = "bible.offline.index";
const MANIFEST_KEY = "bible.offline.manifest";
export const BIBLE_PACK_CACHE = "lumina-bible-packs";
const bookKey = (code: string, book: string) => `bible.offline.book.${code}.${book}`;

// Dedicated IndexedDB database so Bible data never collides with other storage.
let store: UseStore | null = null;
function getStore(): UseStore | null {
  if (typeof indexedDB === "undefined") return null;
  store ??= createStore("lumina-bible", "offline");
  return store;
}

function versesFromBook(
  data: OfflineChapter | null | undefined,
  chapter: number,
): { verse: number; heading: null; text: string }[] | null {
  const verses = data?.chapters?.[String(chapter)];
  if (!verses || verses.length === 0) return null;
  const rows = verses
    .map((text, i) => ({ verse: i + 1, heading: null as null, text }))
    .filter((v) => v.text);
  return rows.length > 0 ? rows : null;
}

/* ------------------------------- manifest ------------------------------- */

let manifestPromise: Promise<BibleManifest | null> | null = null;

export function loadManifest(): Promise<BibleManifest | null> {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const res = await fetch("/bible/manifest.json");
        if (res.ok) {
          const data = (await res.json()) as BibleManifest;
          const s = getStore();
          if (s) await set(MANIFEST_KEY, data, s);
          return data;
        }
      } catch {
        /* offline — fall through to IndexedDB */
      }
      const s = getStore();
      if (!s) return null;
      try {
        return ((await get<BibleManifest>(MANIFEST_KEY, s)) as BibleManifest) ?? null;
      } catch {
        return null;
      }
    })();
  }
  return manifestPromise;
}

/* --------------------------------- index -------------------------------- */

export async function getOfflineIndex(): Promise<OfflineIndex> {
  const s = getStore();
  if (!s) return {};
  try {
    return ((await get<OfflineIndex>(INDEX_KEY, s)) as OfflineIndex) ?? {};
  } catch {
    return {};
  }
}

export async function getPackState(code: string): Promise<PackState | null> {
  const index = await getOfflineIndex();
  return index[code] ?? null;
}

export async function isPackDownloaded(code: string): Promise<boolean> {
  const [manifest, state] = await Promise.all([loadManifest(), getPackState(code)]);
  if (!state || state.books.length === 0) return false;
  const pack = manifest?.packs.find((p) => p.code === code);
  if (pack) return pack.files.every((b) => state.books.includes(b));
  // Manifest missing offline — 66 books is a complete Protestant pack.
  return state.books.length >= 66;
}

/** Chapter map for every downloaded pack, used when `/api/available` is unreachable. */
export async function getOfflineAvailability(): Promise<Record<string, Record<string, number[]>>> {
  const [manifest, index] = await Promise.all([loadManifest(), getOfflineIndex()]);
  const out: Record<string, Record<string, number[]>> = {};
  for (const [code, state] of Object.entries(index)) {
    const files = manifest?.packs.find((p) => p.code === code)?.files ?? state.books;
    out[code] = {};
    for (const book of files) {
      const meta = BOOKS_BY_SLUG[book];
      const count = meta?.chapters ?? 1;
      out[code][book] = Array.from({ length: count }, (_, i) => i + 1);
    }
  }
  return out;
}

/* -------------------------------- chapters ------------------------------- */

async function readBookFromIdb(code: string, book: string): Promise<OfflineChapter | null> {
  const s = getStore();
  if (!s) return null;
  try {
    return ((await get<OfflineChapter>(bookKey(code, book), s)) as OfflineChapter) ?? null;
  } catch {
    return null;
  }
}

async function persistBook(code: string, book: string, data: OfflineChapter): Promise<void> {
  const s = getStore();
  if (!s) return;
  try {
    await set(bookKey(code, book), data, s);
  } catch {
    /* quota — reading from Cache Storage still works */
  }
}

async function readBookFromCache(code: string, book: string): Promise<OfflineChapter | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(BIBLE_PACK_CACHE);
    const res = await cache.match(`/bible/${code}/${book}.json`);
    if (!res || !res.ok) return null;
    return (await res.json()) as OfflineChapter;
  } catch {
    return null;
  }
}

async function readBookFromNetwork(code: string, book: string): Promise<OfflineChapter | null> {
  try {
    const res = await fetch(`/bible/${code}/${book}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as OfflineChapter;
    if (typeof caches !== "undefined") {
      try {
        const cache = await caches.open(BIBLE_PACK_CACHE);
        await cache.put(`/bible/${code}/${book}.json`, new Response(JSON.stringify(data)));
      } catch {
        /* ignore */
      }
    }
    await persistBook(code, book, data);
    return data;
  } catch {
    return null;
  }
}

async function loadBook(code: string, book: string): Promise<OfflineChapter | null> {
  const idb = await readBookFromIdb(code, book);
  if (idb) return idb;
  const cached = await readBookFromCache(code, book);
  if (cached) {
    await persistBook(code, book, cached);
    return cached;
  }
  return readBookFromNetwork(code, book);
}

/** Read one chapter from IndexedDB, Cache Storage, or the bundled pack files. */
export async function getOfflineChapter(
  code: string,
  book: string,
  chapter: number,
): Promise<{ verse: number; heading: null; text: string }[] | null> {
  const data = await loadBook(code, book);
  return versesFromBook(data, chapter);
}

/** Prefer the requested translation, then any downloaded pack (Tshiluba has no corpus). */
export async function getOfflineChapterAny(
  code: string,
  book: string,
  chapter: number,
): Promise<{ translation: string; verses: { verse: number; heading: null; text: string }[] } | null> {
  const preferred = await getOfflineChapter(code, book, chapter);
  if (preferred && preferred.length > 0) {
    return { translation: code, verses: preferred };
  }

  const index = await getOfflineIndex();
  const fallbacks = Object.keys(index).filter((c) => c !== code);
  if (code === "LUA" && !fallbacks.includes("ESV")) fallbacks.unshift("ESV");

  for (const other of fallbacks) {
    const verses = await getOfflineChapter(other, book, chapter);
    if (verses && verses.length > 0) {
      return { translation: other, verses };
    }
  }
  return null;
}

/* ------------------------------- downloading ----------------------------- */

export interface DownloadProgress {
  done: number;
  total: number;
  book: string;
  bytes: number;
}

async function cacheBookResponse(code: string, book: string, data: OfflineChapter): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(BIBLE_PACK_CACHE);
    await cache.put(
      `/bible/${code}/${book}.json`,
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Download a whole translation into IndexedDB, one book at a time.
 * Already-downloaded books are skipped, so an interrupted download resumes.
 */
export async function downloadPack(
  code: string,
  onProgress?: (p: DownloadProgress) => void,
): Promise<{ downloaded: number; skipped: number; failed: string[] }> {
  const s = getStore();
  if (!s) throw new Error("IndexedDB is not available");

  const manifest = await loadManifest();
  const pack = manifest?.packs.find((p) => p.code === code);
  if (!pack) throw new Error(`Unknown pack: ${code}`);

  const state = (await getPackState(code)) ?? { books: [], downloadedAt: 0 };
  const existing = new Set(state.books);

  let downloaded = 0;
  let skipped = 0;
  const failed: string[] = [];
  let bytes = 0;
  let done = 0;

  const persistIndex = async () => {
    await set(
      INDEX_KEY,
      {
        ...(await getOfflineIndex()),
        [code]: { books: Array.from(existing), downloadedAt: Date.now() },
      },
      s,
    );
  };

  const fetchBook = async (book: string): Promise<boolean> => {
    const res = await fetch(`/bible/${code}/${book}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as OfflineChapter;
    if (!data?.chapters || Object.keys(data.chapters).length === 0) {
      throw new Error("empty book");
    }
    await set(bookKey(code, book), data, s);
    await cacheBookResponse(code, book, data);
    existing.add(book);
    downloaded += 1;
    bytes += res.headers.get("content-length")
      ? Number(res.headers.get("content-length"))
      : JSON.stringify(data).length;
    await persistIndex();
    return true;
  };

  for (const book of pack.files) {
    done += 1;
    if (existing.has(book)) {
      skipped += 1;
      onProgress?.({ done, total: pack.files.length, book, bytes });
      continue;
    }
    try {
      await fetchBook(book);
    } catch {
      try {
        await fetchBook(book);
      } catch {
        failed.push(book);
      }
    }
    onProgress?.({ done, total: pack.files.length, book, bytes });
  }

  await persistIndex();
  return { downloaded, skipped, failed };
}

/** Remove a downloaded translation and reclaim the storage. */
export async function removePack(code: string): Promise<void> {
  const s = getStore();
  if (!s) return;
  const state = await getPackState(code);
  if (state) {
    await Promise.all(state.books.map((b) => del(bookKey(code, b), s)));
    if (typeof caches !== "undefined") {
      try {
        const cache = await caches.open(BIBLE_PACK_CACHE);
        await Promise.all(state.books.map((b) => cache.delete(`/bible/${code}/${b}.json`)));
      } catch {
        /* ignore */
      }
    }
  }
  const index = await getOfflineIndex();
  delete index[code];
  await set(INDEX_KEY, index, s);
}

/** All IndexedDB keys for this store — used to show storage usage. */
export async function storageKeys(): Promise<string[]> {
  const s = getStore();
  if (!s) return [];
  try {
    return (await keys<string>(s)).map(String);
  } catch {
    return [];
  }
}
