import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  zh: { translation: zh },
};

const systemLanguage = Localization.getLocales()[0]?.languageCode ?? "en";
// const systemLanguage = "zh";

i18n.use(initReactI18next).init({
  resources,
  lng: systemLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
