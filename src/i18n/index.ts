// src/i18n/index.ts
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";

import enSets from "./locales/en/sets.json";
import ruSets from "./locales/ru/sets.json";

import enCommon from "./locales/en/common.json";
import ruCommon from "./locales/ru/common.json";

// import enCommon from "./locales/en/common.json";
import enPandaPraise from "./locales/en/panda/praise.json";
import ruPandaPraise from "./locales/ru/panda/praise.json";

import {
  default as enPandaGreetings,
  default as ruPandaGreetings,
} from "./locales/ru/panda/greetings.json";

const resources = {
  en: {
    translation: en,
    sets: enSets,
    common: enCommon,
    pandaP: enPandaPraise,
    pandaG: enPandaGreetings,
  },
  ru: {
    translation: ru,
    sets: ruSets,
    common: ruCommon,
    pandaP: ruPandaPraise,
    pandaG: ruPandaGreetings,
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
  ns: ["translation", "sets", "common", "panda"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
