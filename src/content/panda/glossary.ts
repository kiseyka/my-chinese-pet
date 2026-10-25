// src/content/panda/glossary.ts
//
// СЛОВА ПАНДЫ, КОТОРЫХ НЕТ В СЛОВАРЕ: её имя и то, что нужно для её фраз (кактус).
// Во фразах они всегда считаются знакомыми — не ждут точек; по тапу перевод отсюда
// (utils/panda/phraseSegments). Проверка фраз (scripts/check-panda-phrases.mjs) их
// тоже знает. Добавлять сюда только то, что не стоит класть в общий словарь.

/**
 * Имя панды: 竹竹 Zhúzhu («бамбук», ласковое удвоение, как у имён питомцев),
 * по-русски — Жужа. (Без импортов: файл читает и scripts/check-panda-phrases.mjs.)
 */
export const PANDA_NAME = {
  hanzi: "竹竹",
  pinyin: "Zhúzhu",
  ru: "Жужа",
  en: "Zhuzhu",
} as const;

export interface GlossaryEntry {
  pinyin: string;
  ru: string;
  en: string;
}

export const PANDA_GLOSSARY: Record<string, GlossaryEntry> = {
  [PANDA_NAME.hanzi]: {
    pinyin: PANDA_NAME.pinyin,
    ru: `${PANDA_NAME.ru} — имя панды`,
    en: `${PANDA_NAME.en}, the panda's name`,
  },
  仙人掌: { pinyin: "xiān rén zhǎng", ru: "кактус", en: "cactus" },
};
