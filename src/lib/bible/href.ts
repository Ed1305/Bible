export function readHref(translation: string, book: string, chapter: number): string {
  const q = new URLSearchParams({
    translation,
    book,
    chapter: String(chapter),
  });
  return `/read?${q.toString()}`;
}

export function parseReadLocation(
  pathname: string,
  search: URLSearchParams,
): { translation: string; book: string; chapter: number } {
  const path = pathname.match(/^\/read\/([^/]+)\/([^/]+)\/(\d+)/);
  if (path) {
    return {
      translation: decodeURIComponent(path[1]),
      book: decodeURIComponent(path[2]),
      chapter: Number(path[3]) || 1,
    };
  }
  return {
    translation: search.get("translation") || "ESV",
    book: search.get("book") || "genesis",
    chapter: Number(search.get("chapter")) || 1,
  };
}
