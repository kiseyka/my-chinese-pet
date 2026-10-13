export type Word = {
  vocabularyId: string;
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  colloquial?: {
    hanzi: string;
    pinyin: string;
    note: string; // i18n-строка или ключ: "неформальный вариант, используется среди друзей"
  };
};

export type PracticeSet = {
  id: string;
  title: string;
  description?: string;
  words: Word[];
  xpReward: number;
};

export type QuizQuestion = {
  vocabularyId: string;
  id: string;
  hanzi: string;
  pinyin: string;
  /** Перевод слова — он же правильный вариант ответа. */
  translation: string;
  correctAnswer: string;
  options: string[];
};
