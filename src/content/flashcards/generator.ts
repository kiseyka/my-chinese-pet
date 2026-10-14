import { shuffle } from "@/utils/shuffle";
import { QuizQuestion, Word } from "./types";

const QUESTIONS_PER_SESSION = 10;

/**
 * Если в наборе меньше слов, неправильные варианты добираются из всей базы:
 * иначе в маленьком наборе каждый раз видны одни и те же 4 перевода
 * и ответ угадывается методом исключения.
 */
const MIN_SET_DISTRACTORS = 7;

interface GenerateQuizOptions {
  /** Откуда добирать неправильные варианты, если в наборе мало слов. */
  extraPool?: Word[];
  /**
   * Перевод ключа (t из i18next). Нужен, чтобы среди вариантов не было
   * двух одинаковых переводов (например, 再见 и 拜拜 — оба «до свидания»).
   */
  translate?: (key: string) => string;
}

export function generateQuiz(
  words: Word[],
  { extraPool = [], translate = (key) => key }: GenerateQuizOptions = {},
): QuizQuestion[] {
  if (words.length < 4) {
    throw new Error(
      "A Practice Set must contain at least 4 words to generate a quiz.",
    );
  }

  // Если слов больше 10 — берём 10 случайных.
  // Если слов 10 или меньше — берём все.
  const selectedWords = shuffle(words).slice(0, QUESTIONS_PER_SESSION);

  const setIds = new Set(words.map((word) => word.id));
  const useExtra = words.length - 1 < MIN_SET_DISTRACTORS;

  return selectedWords.map((word) => {
    const correctText = translate(word.translation);

    const fromSet = shuffle(words.filter((other) => other.id !== word.id));
    const fromExtra = useExtra
      ? shuffle(extraPool.filter((other) => !setIds.has(other.id))).slice(
          0,
          MIN_SET_DISTRACTORS * 3,
        )
      : [];

    // Неправильные варианты: без повторов перевода и без совпадения с правильным
    const seenTexts = new Set([correctText]);
    const wrongAnswers: string[] = [];

    // В маленьком наборе варианты перемешаны с базой, в большом — только свои
    const candidates = useExtra ? shuffle([...fromSet, ...fromExtra]) : fromSet;

    for (const other of candidates) {
      if (wrongAnswers.length === 3) break;

      const text = translate(other.translation);
      if (seenTexts.has(text)) continue;

      seenTexts.add(text);
      wrongAnswers.push(other.translation);
    }

    const options = shuffle([word.translation, ...wrongAnswers]);

    return {
      vocabularyId: word.vocabularyId,
      id: word.id,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      translation: word.translation,
      correctAnswer: word.translation,
      options,
    };
  });
}
