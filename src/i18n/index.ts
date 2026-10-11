// src/i18n/index.ts
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { words } from "@/content/words/data/words";

import en from "./locales/en.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";

import enSets from "./locales/en/sets.json";
import ruSets from "./locales/ru/sets.json";

import enCommon from "./locales/en/common.json";
import ruCommon from "./locales/ru/common.json";

import enPhrases from "./locales/en/panda/phrases.json";
import ruPhrases from "./locales/ru/panda/phrases.json";

/**
 * Переводы слов — пространство имён «words», ключ — id слова.
 * Оба перевода берутся из src/content/words/data/words.ts (поля ru и en).
 * Если русского нет (пустая строка), срабатывает fallbackLng "en".
 */
function wordTranslations(field: "ru" | "en"): Record<string, string> {
  return Object.fromEntries(
    words.filter((word) => word[field]).map((word) => [word.id, word[field]]),
  );
}

const resources = {
  en: {
    translation: en,
    sets: enSets,
    common: enCommon,
    pandaPhrases: enPhrases,
    words: wordTranslations("en"),
  },
  ru: {
    translation: ru,
    sets: ruSets,
    common: ruCommon,
    pandaPhrases: ruPhrases,
    words: wordTranslations("ru"),
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
  ns: ["translation", "sets", "common", "panda", "pandaPhrases", "words"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
