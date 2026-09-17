import type { LangCode } from "./books";

export interface TranslationMeta {
  code: string; // stored in DB verses.translation
  abbr: string; // short badge, e.g. ESV
  name: string; // full name
  language: string; // display language name
  lang: LangCode; // language code used for book names + TTS
  ttsLang: string; // BCP-47 lang for speech synthesis
}

export const TRANSLATIONS: TranslationMeta[] = [
  {
    code: "ESV",
    abbr: "ESV",
    name: "English Standard Version",
    language: "English",
    lang: "en",
    ttsLang: "en-US",
  },
  {
    code: "LSG",
    abbr: "LSG",
    name: "Louis Segond (Français)",
    language: "Français",
    lang: "fr",
    ttsLang: "fr-FR",
  },
  {
    code: "SW",
    abbr: "SW",
    name: "Biblia Takatifu (Kiswahili)",
    language: "Kiswahili",
    lang: "sw",
    ttsLang: "sw-KE",
  },
  {
    code: "LIN",
    abbr: "LIN",
    name: "Biblia (Lingala)",
    language: "Lingála",
    lang: "ln",
    ttsLang: "ln-CD",
  },
  {
    code: "LUA",
    abbr: "LUA",
    name: "Bible (Tshiluba)",
    language: "Tshiluba",
    lang: "lua",
    ttsLang: "lu-CD",
  },
];

export const TRANSLATIONS_BY_CODE: Record<string, TranslationMeta> =
  Object.fromEntries(TRANSLATIONS.map((t) => [t.code, t]));

export const DEFAULT_TRANSLATION = "ESV";

export function getTranslation(code: string): TranslationMeta {
  return TRANSLATIONS_BY_CODE[code] ?? TRANSLATIONS_BY_CODE[DEFAULT_TRANSLATION];
}
