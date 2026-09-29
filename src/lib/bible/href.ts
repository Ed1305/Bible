export function readHref(
  translation: string,
  book: string,
  chapter: number,
  verse?: number | null,
): string {
  const q = new URLSearchParams({
    translation,
    book,
    chapter: String(chapter),
  });
  if (verse) q.set("verse", String(verse));
  return `/read?${q.toString()}`;
}

export function parseReadLocation(
  pathname: string,
  search: URLSearchParams,
): { translation: string; book: string; chapter: number; verse: number | null } {
  const verse = Number(search.get("verse")) || null;
  const path = pathname.match(/^\/read\/([^/]+)\/([^/]+)\/(\d+)/);
  if (path) {
    return {
      translation: decodeURIComponent(path[1]),
      book: decodeURIComponent(path[2]),
      chapter: Number(path[3]) || 1,
      verse,
    };
  }
  return {
    translation: search.get("translation") || "ESV",
    book: search.get("book") || "genesis",
    chapter: Number(search.get("chapter")) || 1,
    verse,
  };
}
