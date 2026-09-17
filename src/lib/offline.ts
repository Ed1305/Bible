import { createStore, get, set, del, keys, type UseStore } from "idb-keyval";

/**
 * Client-side offline Bible storage.
 *
 * Full translations ("packs") live in `public/bible/<CODE>/<book>.json` and are
 * downloaded into IndexedDB book-by-book, so a phone with zero signal can read
 * the entire Bible. Chapter reads go through here first, before any network.
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
const bookKey = (code: string, book: string) => `bible.offline.book.${code}.${book}`;

// Dedicated IndexedDB database so Bible data never collides with other storage.
let store: UseStore | null = null;
function getStore(): UseStore | null {
  if (typeof indexedDB === "undefined") return null;
  store ??= createStore("lumina-bible", "offline");
  return store;
}

/* ------------------------------- manifest ------------------------------- */

let manifestPromise: Promise<BibleManifest | null> | null = null;

export function loadManifest(): Promise<BibleManifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch("/bible/manifest.json", { cache: "force-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<BibleManifest>) : null))
      .catch(() => null);
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
  const pack = manifest?.packs.find((p) => p.code === code);
  if (!pack || !state) return false;
  return pack.files.every((b) => state.books.includes(b));
}

/* -------------------------------- chapters ------------------------------- */

/** Read one chapter straight from IndexedDB. No network, ever. */
export async function getOfflineChapter(
  code: string,
  book: string,
  chapter: number,
): Promise<{ verse: number; heading: null; text: string }[] | null> {
  const s = getStore();
  if (!s) return null;
  try {
    const data = await get<OfflineChapter>(bookKey(code, book), s);
    const verses = data?.chapters?.[String(chapter)];
    if (!verses || verses.length === 0) return null;
    return verses
      .map((text, i) => ({ verse: i + 1, heading: null as null, text }))
      .filter((v) => v.text);
  } catch {
    return null;
  }
}

/* ------------------------------- downloading ----------------------------- */

export interface DownloadProgress {
  done: number;
  total: number;
  book: string;
  bytes: number;
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

  for (const book of pack.files) {
    done += 1;
    if (existing.has(book)) {
      skipped += 1;
      onProgress?.({ done, total: pack.files.length, book, bytes });
      continue;
    }
    try {
      const res = await fetch(`/bible/${code}/${book}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OfflineChapter;
      await set(bookKey(code, book), data, s);
      existing.add(book);
      downloaded += 1;
      bytes += res.headers.get("content-length")
        ? Number(res.headers.get("content-length"))
        : JSON.stringify(data).length;

      // Persist progress after every book so an interrupted download resumes.
      await set(
        INDEX_KEY,
        {
          ...(await getOfflineIndex()),
          [code]: { books: Array.from(existing), downloadedAt: Date.now() },
        },
        s,
      );
    } catch {
      failed.push(book);
    }
    onProgress?.({ done, total: pack.files.length, book, bytes });
  }

  await set(
    INDEX_KEY,
    {
      ...(await getOfflineIndex()),
      [code]: { books: Array.from(existing), downloadedAt: Date.now() },
    },
    s,
  );

  return { downloaded, skipped, failed };
}

/** Remove a downloaded translation and reclaim the storage. */
export async function removePack(code: string): Promise<void> {
  const s = getStore();
  if (!s) return;
  const state = await getPackState(code);
  if (state) {
    await Promise.all(state.books.map((b) => del(bookKey(code, b), s)));
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
