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

/** Вариант ответа в обратном вопросе: иероглиф (пиньинь показываем после ответа). */
export type QuizOptionWord = {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
};

export type QuizQuestion = {
  vocabularyId: string;
  id: string;
  hanzi: string;
  pinyin: string;
  /** Перевод слова. В прямом вопросе — он же правильный вариант ответа. */
  translation: string;
  /**
   * forward — показан иероглиф, выбрать перевод (варианты — ключи переводов);
   * reverse — показан перевод, выбрать иероглиф из похожих (варианты — id слов);
   * pinyin — показан иероглиф, выбрать чтение из вариантов с другими тонами
   *   (варианты — строки пиньиня).
   */
  direction: "forward" | "reverse" | "pinyin";
  correctAnswer: string;
  options: string[];
  /** Только у reverse: иероглифы вариантов в том же порядке, что options. */
  optionWords?: QuizOptionWord[];
};
