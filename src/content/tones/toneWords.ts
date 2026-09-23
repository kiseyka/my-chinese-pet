import { allWords } from "@/content/flashcards/data";
import { getSyllableCount } from "@/utils/pinyinTones";

export const toneTrainingWords = allWords.filter(
  (word) => getSyllableCount(word.pinyin) <= 3,
);

// MVP: пока только односложные слова — формат ответа для 2-3 слогов ещё не определён
export const singleSyllableToneWords = toneTrainingWords.filter(
  (word) => getSyllableCount(word.pinyin) === 1,
);
