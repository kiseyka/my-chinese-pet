// src/content/words/types.ts

export type WordEntry = {
  /**
   * Стабильный ключ слова. Под ним хранится весь прогресс пользователя,
   * поэтому после создания id менять нельзя.
   */
  id: string;
  hanzi: string;
  /** Пиньинь с тоновыми знаками. */
  pinyin: string;
  /** Ключ перевода (i18n). */
  translation: string;
  /** Разговорный вариант слова (необязательно). */
  colloquial?: {
    hanzi: string;
    pinyin: string;
    /** Ключ пояснения (i18n). */
    note: string;
  };
  /** Уровень HSK (необязательно, на будущее). */
  hsk?: number;
};
