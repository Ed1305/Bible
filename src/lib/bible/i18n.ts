import type { LangCode } from "./books";

export type UiStrings = {
  bible: string;
  listen: string;
  today: string;
  prayers: string;
  journal: string;
  oldTestament: string;
  newTestament: string;
  search: string;
  searchPlaceholder: string;
  results: string;
  result: string;
  noResults: string;
  offline: string;
  translation: string;
  translations: string;
  chooseTranslation: string;
  readingPlans: string;
  plansSubtitle: string;
  day: string;
  days: string;
  startPlan: string;
  continuePlan: string;
  markComplete: string;
  completed: string;
  play: string;
  pause: string;
  stop: string;
  nowPlaying: string;
  audioBible: string;
  audioSubtitle: string;
  chooseChapter: string;
  bookmark: string;
  highlight: string;
  note: string;
  share: string;
  install: string;
  installApp: string;
  settings: string;
  language: string;
  textSize: string;
  myPrayers: string;
  addPrayer: string;
  prayerPlaceholder: string;
  answered: string;
  myJournal: string;
  addNote: string;
  journalPlaceholder: string;
  save: string;
  empty: string;
  chapter: string;
  downloadOffline: string;
  downloaded: string;
  offlinePacks: string;
  offlinePacksHint: string;
  downloading: string;
  remove: string;
  booksWord: string;
  continueReading: string;
  verseOfDay: string;
  selectChapter: string;
  theme: string;
  light: string;
  dark: string;
};

const en: UiStrings = {
  bible: "Bible",
  listen: "Listen",
  today: "Today",
  prayers: "Prayers",
  journal: "Journal",
  oldTestament: "Old Testament",
  newTestament: "New Testament",
  search: "Search",
  searchPlaceholder: "Search the Word...",
  results: "RESULTS",
  result: "RESULT",
  noResults: "No results found",
  offline: "YOU'RE OFFLINE",
  translation: "Translation",
  translations: "Translations",
  chooseTranslation: "Choose your Bible",
  readingPlans: "Reading Plans",
  plansSubtitle: "Grow every day in the Word",
  day: "Day",
  days: "days",
  startPlan: "Start plan",
  continuePlan: "Continue",
  markComplete: "Mark complete",
  completed: "Completed",
  play: "Play",
  pause: "Pause",
  stop: "Stop",
  nowPlaying: "Now playing",
  audioBible: "Audio Bible",
  audioSubtitle: "Listen to the Scriptures",
  chooseChapter: "Choose a chapter to listen",
  bookmark: "Bookmark",
  highlight: "Highlight",
  note: "Note",
  share: "Share",
  install: "Install",
  installApp: "Install app",
  settings: "Settings",
  language: "Language",
  textSize: "Text size",
  myPrayers: "My Prayers",
  addPrayer: "Add a prayer",
  prayerPlaceholder: "Write your prayer...",
  answered: "Answered",
  myJournal: "My Journal",
  addNote: "New entry",
  journalPlaceholder: "Write your reflection...",
  save: "Save",
  empty: "Nothing here yet",
  chapter: "Chapter",
  downloadOffline: "Download for offline",
  downloaded: "Downloaded",
  offlinePacks: "Offline Bibles",
  offlinePacksHint: "Download a full translation so you can read with zero signal — in the air, underground or offline.",
  downloading: "Downloading…",
  remove: "Remove",
  booksWord: "books",
  continueReading: "Continue reading",
  verseOfDay: "Verse of the day",
  selectChapter: "Select a chapter",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
};

const fr: UiStrings = {
  ...en,
  bible: "Bible",
  listen: "Écouter",
  today: "Aujourd'hui",
  prayers: "Prières",
  journal: "Journal",
  oldTestament: "Ancien Testament",
  newTestament: "Nouveau Testament",
  search: "Rechercher",
  searchPlaceholder: "Rechercher la Parole...",
  results: "RÉSULTATS",
  result: "RÉSULTAT",
  noResults: "Aucun résultat",
  offline: "VOUS ÊTES HORS LIGNE",
  translation: "Traduction",
  translations: "Traductions",
  chooseTranslation: "Choisissez votre Bible",
  readingPlans: "Plans de lecture",
  plansSubtitle: "Grandissez chaque jour dans la Parole",
  day: "Jour",
  days: "jours",
  startPlan: "Commencer",
  continuePlan: "Continuer",
  markComplete: "Terminer",
  completed: "Terminé",
  play: "Lire",
  pause: "Pause",
  stop: "Arrêter",
  nowPlaying: "En lecture",
  audioBible: "Bible audio",
  audioSubtitle: "Écoutez les Écritures",
  chooseChapter: "Choisissez un chapitre à écouter",
  bookmark: "Marque-page",
  highlight: "Surligner",
  note: "Note",
  share: "Partager",
  install: "Installer",
  installApp: "Installer l'app",
  settings: "Paramètres",
  language: "Langue",
  textSize: "Taille du texte",
  myPrayers: "Mes prières",
  addPrayer: "Ajouter une prière",
  prayerPlaceholder: "Écrivez votre prière...",
  answered: "Exaucée",
  myJournal: "Mon journal",
  addNote: "Nouvelle note",
  journalPlaceholder: "Écrivez votre réflexion...",
  save: "Enregistrer",
  empty: "Rien pour l'instant",
  chapter: "Chapitre",
  downloadOffline: "Télécharger hors ligne",
  downloaded: "Téléchargé",
  offlinePacks: "Bibles hors ligne",
  offlinePacksHint: "Téléchargez une traduction complète pour lire sans aucune connexion.",
  downloading: "Téléchargement…",
  remove: "Supprimer",
  booksWord: "livres",
  continueReading: "Continuer la lecture",
  verseOfDay: "Verset du jour",
  selectChapter: "Choisissez un chapitre",
  theme: "Thème",
  light: "Clair",
  dark: "Sombre",
};

const sw: UiStrings = {
  ...en,
  listen: "Sikiliza",
  today: "Leo",
  prayers: "Maombi",
  journal: "Shajara",
  oldTestament: "Agano la Kale",
  newTestament: "Agano Jipya",
  search: "Tafuta",
  searchPlaceholder: "Tafuta Neno...",
  results: "MATOKEO",
  result: "TOKEO",
  noResults: "Hakuna matokeo",
  offline: "HUKO NJE YA MTANDAO",
  translation: "Tafsiri",
  translations: "Tafsiri",
  chooseTranslation: "Chagua Biblia yako",
  readingPlans: "Mipango ya Kusoma",
  plansSubtitle: "Kua kila siku katika Neno",
  day: "Siku",
  days: "siku",
  startPlan: "Anza",
  continuePlan: "Endelea",
  markComplete: "Maliza",
  completed: "Imekamilika",
  play: "Cheza",
  pause: "Simamisha",
  stop: "Acha",
  nowPlaying: "Inachezwa",
  audioBible: "Biblia ya Sauti",
  audioSubtitle: "Sikiliza Maandiko",
  chooseChapter: "Chagua sura ya kusikiliza",
  bookmark: "Alamisho",
  highlight: "Angazia",
  note: "Dokezo",
  share: "Shiriki",
  settings: "Mipangilio",
  language: "Lugha",
  textSize: "Ukubwa wa maandishi",
  myPrayers: "Maombi Yangu",
  addPrayer: "Ongeza ombi",
  prayerPlaceholder: "Andika ombi lako...",
  answered: "Limejibiwa",
  myJournal: "Shajara Yangu",
  addNote: "Andiko jipya",
  journalPlaceholder: "Andika tafakari yako...",
  save: "Hifadhi",
  empty: "Hakuna kitu bado",
  chapter: "Sura",
  continueReading: "Endelea kusoma",
  verseOfDay: "Aya ya siku",
  selectChapter: "Chagua sura",
  theme: "Mandhari",
  light: "Mwanga",
  dark: "Giza",
};

const ln: UiStrings = {
  ...en,
  listen: "Yoka",
  today: "Lelo",
  prayers: "Mabondeli",
  journal: "Bokomi",
  oldTestament: "Kondimana ya Kala",
  newTestament: "Kondimana ya Sika",
  search: "Luka",
  searchPlaceholder: "Luka Liloba...",
  results: "BIUTI",
  result: "LIUTI",
  noResults: "Eloko emonani te",
  offline: "OZALI LIBANDA YA INTERNET",
  translation: "Libongoli",
  translations: "Mabongoli",
  chooseTranslation: "Pona Biblia na yo",
  readingPlans: "Mabongisi ya Kotanga",
  plansSubtitle: "Kola mokolo na mokolo na Liloba",
  day: "Mokolo",
  days: "mikolo",
  startPlan: "Banda",
  continuePlan: "Landa",
  markComplete: "Silisa",
  completed: "Esili",
  play: "Yoka",
  pause: "Pema",
  stop: "Tika",
  nowPlaying: "Ezali koyokana",
  audioBible: "Biblia ya Mongongo",
  audioSubtitle: "Yoka Makomi",
  chooseChapter: "Pona mokapo ya koyoka",
  bookmark: "Elembo",
  highlight: "Monisa",
  note: "Note",
  share: "Kabola",
  settings: "Bibongiseli",
  language: "Monoko",
  textSize: "Bonene ya makomi",
  myPrayers: "Mabondeli na Ngai",
  addPrayer: "Bakisa libondeli",
  prayerPlaceholder: "Koma libondeli na yo...",
  answered: "Eyanolami",
  myJournal: "Bokomi na Ngai",
  addNote: "Bokomi ya sika",
  journalPlaceholder: "Koma makanisi na yo...",
  save: "Bomba",
  empty: "Eloko ezali naino te",
  chapter: "Mokapo",
  continueReading: "Landa kotanga",
  verseOfDay: "Vɛrsɛ ya mokolo",
  selectChapter: "Pona mokapo",
  theme: "Lomengo",
  light: "Pole",
  dark: "Molili",
};

const lua: UiStrings = {
  ...en,
  listen: "Teleja",
  today: "Lelu",
  prayers: "Masambila",
  journal: "Mukanda",
  oldTestament: "Tshipungidi tshia Kale",
  newTestament: "Tshipungidi tshipiapia",
  search: "Keba",
  searchPlaceholder: "Keba Dîyi...",
  results: "MALUABI",
  result: "DILUABI",
  noResults: "Kakuena tshintu",
  offline: "KUENA PA ENTELENETE",
  translation: "Dikudimuinu",
  translations: "Nkudimuinu",
  chooseTranslation: "Sungula Bible webe",
  readingPlans: "Malongolodi a Kubala",
  plansSubtitle: "Kola dituku ne dituku mu Dîyi",
  day: "Dituku",
  days: "matuku",
  startPlan: "Tuadija",
  continuePlan: "Tungunuka",
  markComplete: "Jikija",
  completed: "Kujika",
  play: "Teleja",
  pause: "Imana",
  stop: "Lekela",
  nowPlaying: "Bidi biteleja",
  audioBible: "Bible wa Dîyi",
  audioSubtitle: "Teleja Mukanda wa Nzambi",
  chooseChapter: "Sungula nshapita wa kuteleja",
  bookmark: "Tshimanyinu",
  highlight: "Leja",
  note: "Note",
  share: "Abanya",
  settings: "Malongolodi",
  language: "Muakulu",
  textSize: "Bunene bua mukanda",
  myPrayers: "Masambila anyi",
  addPrayer: "Sakidila disambila",
  prayerPlaceholder: "Funda disambila diebe...",
  answered: "Diandamuna",
  myJournal: "Mukanda wanyi",
  addNote: "Difundilu dipiapia",
  journalPlaceholder: "Funda meji ebe...",
  save: "Lama",
  empty: "Kakuena tshintu",
  chapter: "Nshapita",
  continueReading: "Tungunuka kubala",
  verseOfDay: "Mvese wa dituku",
  selectChapter: "Sungula nshapita",
  theme: "Mufundilu",
  light: "Mueshu",
  dark: "Mfuku",
};

export const UI: Record<LangCode, UiStrings> = { en, fr, sw, ln, lua };

export function ui(lang: LangCode): UiStrings {
  return UI[lang] ?? UI.en;
}
