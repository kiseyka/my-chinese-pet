// src/i18n/index.ts
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { hskWords } from "@/content/words/generated/hskWords";

import en from "./locales/en.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";

import enSets from "./locales/en/sets.json";
import ruSets from "./locales/ru/sets.json";

import enCommon from "./locales/en/common.json";
import ruCommon from "./locales/ru/common.json";

import enPhrases from "./locales/en/panda/phrases.json";
import ruPhrases from "./locales/ru/panda/phrases.json";

import ruHsk from "./locales/ru/hsk.json";

/**
 * Английские переводы HSK-слов берутся прямо из сгенерированного файла
 * (ключ — id слова, например "hsk-需要"). Русские — из locales/ru/hsk.json,
 * его ведёшь вручную. Если русского перевода нет, срабатывает fallbackLng "en".
 */
const enHsk: Record<string, string> = Object.fromEntries(
  hskWords.map((word) => [word.id, word.translationEn]),
);

const resources = {
  en: {
    translation: en,
    sets: enSets,
    common: enCommon,
    pandaPhrases: enPhrases,
    hsk: enHsk,
  },
  ru: {
    translation: ru,
    sets: ruSets,
    common: ruCommon,
    pandaPhrases: ruPhrases,
    hsk: ruHsk,
  },
  zh: { translation: zh },
};

const systemLanguage = Localization.getLocales()[0]?.languageCode ?? "en";
// const systemLanguage = "zh";

i18n.use(initReactI18next).init({
  resources,
  lng: systemLanguage,
  fallbackLng: "en",
  defaultNS: "translation",
  ns: ["translation", "sets", "common", "panda", "pandaPhrases", "hsk"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
