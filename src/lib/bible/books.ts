export type Testament = "OT" | "NT";
export type LangCode = "en" | "fr" | "sw" | "ln" | "lua";

export interface BookMeta {
  slug: string;
  testament: Testament;
  order: number;
  chapters: number;
  // localized display names
  names: Record<LangCode, string>;
}

// Canonical 66-book Protestant order with localized names.
// English (ESV), French (Louis Segond), Swahili, Lingala, Tshiluba.
export const BOOKS: BookMeta[] = [
  { slug: "genesis", testament: "OT", order: 1, chapters: 50, names: { en: "Genesis", fr: "Genèse", sw: "Mwanzo", ln: "Ebandeli", lua: "Ntuadijilu" } },
  { slug: "exodus", testament: "OT", order: 2, chapters: 40, names: { en: "Exodus", fr: "Exode", sw: "Kutoka", ln: "Kobima", lua: "Ekedu" } },
  { slug: "leviticus", testament: "OT", order: 3, chapters: 27, names: { en: "Leviticus", fr: "Lévitique", sw: "Mambo ya Walawi", ln: "Balevi", lua: "Balewi" } },
  { slug: "numbers", testament: "OT", order: 4, chapters: 36, names: { en: "Numbers", fr: "Nombres", sw: "Hesabu", ln: "Mituya", lua: "Nomba" } },
  { slug: "deuteronomy", testament: "OT", order: 5, chapters: 34, names: { en: "Deuteronomy", fr: "Deutéronome", sw: "Kumbukumbu la Torati", ln: "Deteronome", lua: "Dutelonome" } },
  { slug: "joshua", testament: "OT", order: 6, chapters: 24, names: { en: "Joshua", fr: "Josué", sw: "Yoshua", ln: "Yozue", lua: "Yoshua" } },
  { slug: "judges", testament: "OT", order: 7, chapters: 21, names: { en: "Judges", fr: "Juges", sw: "Waamuzi", ln: "Basambisi", lua: "Balumbuluishi" } },
  { slug: "ruth", testament: "OT", order: 8, chapters: 4, names: { en: "Ruth", fr: "Ruth", sw: "Ruthu", ln: "Luti", lua: "Luta" } },
  { slug: "1-samuel", testament: "OT", order: 9, chapters: 31, names: { en: "1 Samuel", fr: "1 Samuel", sw: "1 Samweli", ln: "1 Samuele", lua: "1 Samwele" } },
  { slug: "2-samuel", testament: "OT", order: 10, chapters: 24, names: { en: "2 Samuel", fr: "2 Samuel", sw: "2 Samweli", ln: "2 Samuele", lua: "2 Samwele" } },
  { slug: "1-kings", testament: "OT", order: 11, chapters: 22, names: { en: "1 Kings", fr: "1 Rois", sw: "1 Wafalme", ln: "1 Bakonzi", lua: "1 Bakalenge" } },
  { slug: "2-kings", testament: "OT", order: 12, chapters: 25, names: { en: "2 Kings", fr: "2 Rois", sw: "2 Wafalme", ln: "2 Bakonzi", lua: "2 Bakalenge" } },
  { slug: "1-chronicles", testament: "OT", order: 13, chapters: 29, names: { en: "1 Chronicles", fr: "1 Chroniques", sw: "1 Mambo ya Nyakati", ln: "1 Masolo", lua: "1 Kulondolola" } },
  { slug: "2-chronicles", testament: "OT", order: 14, chapters: 36, names: { en: "2 Chronicles", fr: "2 Chroniques", sw: "2 Mambo ya Nyakati", ln: "2 Masolo", lua: "2 Kulondolola" } },
  { slug: "ezra", testament: "OT", order: 15, chapters: 10, names: { en: "Ezra", fr: "Esdras", sw: "Ezra", ln: "Esidrasi", lua: "Esdala" } },
  { slug: "nehemiah", testament: "OT", order: 16, chapters: 13, names: { en: "Nehemiah", fr: "Néhémie", sw: "Nehemia", ln: "Nehemia", lua: "Nehemiya" } },
  { slug: "esther", testament: "OT", order: 17, chapters: 10, names: { en: "Esther", fr: "Esther", sw: "Esta", ln: "Esitere", lua: "Esta" } },
  { slug: "job", testament: "OT", order: 18, chapters: 42, names: { en: "Job", fr: "Job", sw: "Ayubu", ln: "Yobo", lua: "Yobo" } },
  { slug: "psalms", testament: "OT", order: 19, chapters: 150, names: { en: "Psalms", fr: "Psaumes", sw: "Zaburi", ln: "Nzembo", lua: "Misambu" } },
  { slug: "proverbs", testament: "OT", order: 20, chapters: 31, names: { en: "Proverbs", fr: "Proverbes", sw: "Mithali", ln: "Masese", lua: "Nsumuinu" } },
  { slug: "ecclesiastes", testament: "OT", order: 21, chapters: 12, names: { en: "Ecclesiastes", fr: "Ecclésiaste", sw: "Mhubiri", ln: "Mosakoli", lua: "Muambi" } },
  { slug: "song-of-solomon", testament: "OT", order: 22, chapters: 8, names: { en: "Song of Solomon", fr: "Cantique des Cantiques", sw: "Wimbo Ulio Bora", ln: "Loyembo ya Salomo", lua: "Musambu wa Solomo" } },
  { slug: "isaiah", testament: "OT", order: 23, chapters: 66, names: { en: "Isaiah", fr: "Ésaïe", sw: "Isaya", ln: "Yisaya", lua: "Yeshaya" } },
  { slug: "jeremiah", testament: "OT", order: 24, chapters: 52, names: { en: "Jeremiah", fr: "Jérémie", sw: "Yeremia", ln: "Yeremia", lua: "Yelemiya" } },
  { slug: "lamentations", testament: "OT", order: 25, chapters: 5, names: { en: "Lamentations", fr: "Lamentations", sw: "Maombolezo", ln: "Bileli", lua: "Madidilu" } },
  { slug: "ezekiel", testament: "OT", order: 26, chapters: 48, names: { en: "Ezekiel", fr: "Ézéchiel", sw: "Ezekieli", ln: "Ezekiele", lua: "Ezekiele" } },
  { slug: "daniel", testament: "OT", order: 27, chapters: 12, names: { en: "Daniel", fr: "Daniel", sw: "Danieli", ln: "Daniele", lua: "Daniele" } },
  { slug: "hosea", testament: "OT", order: 28, chapters: 14, names: { en: "Hosea", fr: "Osée", sw: "Hosea", ln: "Oze", lua: "Hoshea" } },
  { slug: "joel", testament: "OT", order: 29, chapters: 3, names: { en: "Joel", fr: "Joël", sw: "Yoeli", ln: "Yoele", lua: "Yoele" } },
  { slug: "amos", testament: "OT", order: 30, chapters: 9, names: { en: "Amos", fr: "Amos", sw: "Amosi", ln: "Amosi", lua: "Amosa" } },
  { slug: "obadiah", testament: "OT", order: 31, chapters: 1, names: { en: "Obadiah", fr: "Abdias", sw: "Obadia", ln: "Abidiasi", lua: "Obadiya" } },
  { slug: "jonah", testament: "OT", order: 32, chapters: 4, names: { en: "Jonah", fr: "Jonas", sw: "Yona", ln: "Yona", lua: "Yona" } },
  { slug: "micah", testament: "OT", order: 33, chapters: 7, names: { en: "Micah", fr: "Michée", sw: "Mika", ln: "Mishe", lua: "Mika" } },
  { slug: "nahum", testament: "OT", order: 34, chapters: 3, names: { en: "Nahum", fr: "Nahum", sw: "Nahumu", ln: "Nauma", lua: "Nahuma" } },
  { slug: "habakkuk", testament: "OT", order: 35, chapters: 3, names: { en: "Habakkuk", fr: "Habacuc", sw: "Habakuki", ln: "Habakuke", lua: "Habakuka" } },
  { slug: "zephaniah", testament: "OT", order: 36, chapters: 3, names: { en: "Zephaniah", fr: "Sophonie", sw: "Sefania", ln: "Sofonia", lua: "Sefaniya" } },
  { slug: "haggai", testament: "OT", order: 37, chapters: 2, names: { en: "Haggai", fr: "Aggée", sw: "Hagai", ln: "Agaye", lua: "Hagai" } },
  { slug: "zechariah", testament: "OT", order: 38, chapters: 14, names: { en: "Zechariah", fr: "Zacharie", sw: "Zekaria", ln: "Zakaria", lua: "Zekariya" } },
  { slug: "malachi", testament: "OT", order: 39, chapters: 4, names: { en: "Malachi", fr: "Malachie", sw: "Malaki", ln: "Malashi", lua: "Malaki" } },
  { slug: "matthew", testament: "NT", order: 40, chapters: 28, names: { en: "Matthew", fr: "Matthieu", sw: "Mathayo", ln: "Matai", lua: "Matayi" } },
  { slug: "mark", testament: "NT", order: 41, chapters: 16, names: { en: "Mark", fr: "Marc", sw: "Marko", ln: "Marko", lua: "Mako" } },
  { slug: "luke", testament: "NT", order: 42, chapters: 24, names: { en: "Luke", fr: "Luc", sw: "Luka", ln: "Luka", lua: "Luka" } },
  { slug: "john", testament: "NT", order: 43, chapters: 21, names: { en: "John", fr: "Jean", sw: "Yohana", ln: "Yoane", lua: "Yohane" } },
  { slug: "acts", testament: "NT", order: 44, chapters: 28, names: { en: "Acts", fr: "Actes", sw: "Matendo", ln: "Misala", lua: "Bienzedi" } },
  { slug: "romans", testament: "NT", order: 45, chapters: 16, names: { en: "Romans", fr: "Romains", sw: "Warumi", ln: "Baroma", lua: "Bena-Loma" } },
  { slug: "1-corinthians", testament: "NT", order: 46, chapters: 16, names: { en: "1 Corinthians", fr: "1 Corinthiens", sw: "1 Wakorintho", ln: "1 Bakorinti", lua: "1 Bena-Kolinto" } },
  { slug: "2-corinthians", testament: "NT", order: 47, chapters: 13, names: { en: "2 Corinthians", fr: "2 Corinthiens", sw: "2 Wakorintho", ln: "2 Bakorinti", lua: "2 Bena-Kolinto" } },
  { slug: "galatians", testament: "NT", order: 48, chapters: 6, names: { en: "Galatians", fr: "Galates", sw: "Wagalatia", ln: "Bagalatia", lua: "Bena-Galatia" } },
  { slug: "ephesians", testament: "NT", order: 49, chapters: 6, names: { en: "Ephesians", fr: "Éphésiens", sw: "Waefeso", ln: "Baefese", lua: "Bena-Efeso" } },
  { slug: "philippians", testament: "NT", order: 50, chapters: 4, names: { en: "Philippians", fr: "Philippiens", sw: "Wafilipi", ln: "Bafilipi", lua: "Bena-Filipoi" } },
  { slug: "colossians", testament: "NT", order: 51, chapters: 4, names: { en: "Colossians", fr: "Colossiens", sw: "Wakolosai", ln: "Bakolose", lua: "Bena-Kolose" } },
  { slug: "1-thessalonians", testament: "NT", order: 52, chapters: 5, names: { en: "1 Thessalonians", fr: "1 Thessaloniciens", sw: "1 Wathesalonike", ln: "1 Batesaloniki", lua: "1 Bena-Tesalonike" } },
  { slug: "2-thessalonians", testament: "NT", order: 53, chapters: 3, names: { en: "2 Thessalonians", fr: "2 Thessaloniciens", sw: "2 Wathesalonike", ln: "2 Batesaloniki", lua: "2 Bena-Tesalonike" } },
  { slug: "1-timothy", testament: "NT", order: 54, chapters: 6, names: { en: "1 Timothy", fr: "1 Timothée", sw: "1 Timotheo", ln: "1 Timote", lua: "1 Timote" } },
  { slug: "2-timothy", testament: "NT", order: 55, chapters: 4, names: { en: "2 Timothy", fr: "2 Timothée", sw: "2 Timotheo", ln: "2 Timote", lua: "2 Timote" } },
  { slug: "titus", testament: "NT", order: 56, chapters: 3, names: { en: "Titus", fr: "Tite", sw: "Tito", ln: "Tito", lua: "Tito" } },
  { slug: "philemon", testament: "NT", order: 57, chapters: 1, names: { en: "Philemon", fr: "Philémon", sw: "Filemoni", ln: "Filemo", lua: "Filemona" } },
  { slug: "hebrews", testament: "NT", order: 58, chapters: 13, names: { en: "Hebrews", fr: "Hébreux", sw: "Waebrania", ln: "Baebre", lua: "Bena-Ebelu" } },
  { slug: "james", testament: "NT", order: 59, chapters: 5, names: { en: "James", fr: "Jacques", sw: "Yakobo", ln: "Yakobo", lua: "Yakoba" } },
  { slug: "1-peter", testament: "NT", order: 60, chapters: 5, names: { en: "1 Peter", fr: "1 Pierre", sw: "1 Petro", ln: "1 Petro", lua: "1 Petelo" } },
  { slug: "2-peter", testament: "NT", order: 61, chapters: 3, names: { en: "2 Peter", fr: "2 Pierre", sw: "2 Petro", ln: "2 Petro", lua: "2 Petelo" } },
  { slug: "1-john", testament: "NT", order: 62, chapters: 5, names: { en: "1 John", fr: "1 Jean", sw: "1 Yohana", ln: "1 Yoane", lua: "1 Yohane" } },
  { slug: "2-john", testament: "NT", order: 63, chapters: 1, names: { en: "2 John", fr: "2 Jean", sw: "2 Yohana", ln: "2 Yoane", lua: "2 Yohane" } },
  { slug: "3-john", testament: "NT", order: 64, chapters: 1, names: { en: "3 John", fr: "3 Jean", sw: "3 Yohana", ln: "3 Yoane", lua: "3 Yohane" } },
  { slug: "jude", testament: "NT", order: 65, chapters: 1, names: { en: "Jude", fr: "Jude", sw: "Yuda", ln: "Yuda", lua: "Yuda" } },
  { slug: "revelation", testament: "NT", order: 66, chapters: 22, names: { en: "Revelation", fr: "Apocalypse", sw: "Ufunuo", ln: "Emoniseli", lua: "Buakabuluibua" } },
];

export const BOOKS_BY_SLUG: Record<string, BookMeta> = Object.fromEntries(
  BOOKS.map((b) => [b.slug, b]),
);

export function bookName(slug: string, lang: LangCode): string {
  const b = BOOKS_BY_SLUG[slug];
  if (!b) return slug;
  return b.names[lang] ?? b.names.en;
}
