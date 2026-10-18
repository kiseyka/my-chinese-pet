// src/constants/legal.ts
//
// Политика конфиденциальности и сторонние данные, которые приложение использует.
// Экран «Лицензии» строится из LICENSES.

/** Страница политики конфиденциальности. null — ещё не опубликована (заглушка). */
export const PRIVACY_POLICY_URL: string | null = null;

export interface LicenseEntry {
  title: string;
  /** Что именно взято. */
  usage: string;
  license: string;
  url: string;
}

export const LICENSES: LicenseEntry[] = [
  {
    title: "Make Me a Hanzi",
    usage:
      "Черты иероглифов (graphics.txt) — Arphic Public License; разбор иероглифов на части (dictionary.txt) — GNU LGPL 3.0 или новее",
    license: "Arphic Public License · GNU LGPL 3.0+",
    url: "https://github.com/skishore/makemeahanzi",
  },
  {
    title: "hanzi-writer-data",
    usage: "Черты и порядок написания иероглифов",
    license: "Arphic Public License",
    url: "https://github.com/chanind/hanzi-writer-data",
  },
  {
    title: "Complete HSK Vocabulary",
    usage: "Слова HSK, уровни, частота, английские переводы",
    license: "MIT",
    url: "https://github.com/drkameleon/complete-hsk-vocabulary",
  },
  {
    title: "Noto Serif SC",
    usage: "Шрифт для иероглифов",
    license: "SIL Open Font License 1.1",
    url: "https://fonts.google.com/noto/specimen/Noto+Serif+SC",
  },
  {
    title: "Nunito",
    usage: "Шрифт интерфейса",
    license: "SIL Open Font License 1.1",
    url: "https://fonts.google.com/specimen/Nunito",
  },
  {
    title: "Lucide",
    usage: "Иконки",
    license: "ISC",
    url: "https://lucide.dev",
  },
];
