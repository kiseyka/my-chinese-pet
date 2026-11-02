import { shuffle } from "@/utils/shuffle";
import { QuizQuestion, Word } from "./types";

// Вопрос бывает прямым (иероглиф → выбрать перевод), обратным (перевод → выбрать
// иероглиф из похожих) и про чтение (иероглиф → выбрать пиньинь с верным тоном).
// Обратный и про чтение строит вызывающий через ask: генератору не нужно знать
// ни прогресс слова, ни как подбирать похожие.

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
  /**
   * Не прямой вопрос для слова или null — тогда прямой. Решает вызывающий:
   *   reverse — варианты-слова (среди них само слово);
   *   pinyin — неверные чтения (верное добавит генератор).
   */
  ask?: (word: Word) => QuizAsk | null;
  /**
   * Слова, близкие по смыслу (например, той же темы): из них неверные варианты
   * берутся в первую очередь, остальное добирается как обычно.
   */
  related?: (word: Word) => Word[];
}

export type QuizAsk =
  | { direction: "reverse"; options: Word[] }
  | { direction: "pinyin"; wrong: string[] };

export function generateQuiz(
  words: Word[],
  {
    extraPool = [],
    translate = (key) => key,
    ask,
    related,
  }: GenerateQuizOptions = {},
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

  return selectedWords.map((word): QuizQuestion => {
    const special = ask?.(word);

    if (special?.direction === "pinyin" && special.wrong.length >= 2) {
      return {
        vocabularyId: word.vocabularyId,
        id: word.id,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        translation: word.translation,
        direction: "pinyin",
        correctAnswer: word.pinyin,
        options: shuffle([word.pinyin, ...special.wrong]),
      };
    }

    const reverseOptions =
      special?.direction === "reverse" ? special.options : null;
    if (reverseOptions && reverseOptions.length >= 2) {
      return {
        vocabularyId: word.vocabularyId,
        id: word.id,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        translation: word.translation,
        direction: "reverse",
        correctAnswer: word.vocabularyId,
        options: reverseOptions.map((option) => option.vocabularyId),
        optionWords: reverseOptions.map((option) => ({
          vocabularyId: option.vocabularyId,
          hanzi: option.hanzi,
          pinyin: option.pinyin,
        })),
      };
    }

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

    // Сначала близкие по смыслу, потом: в маленьком наборе — вперемешку с базой,
    // в большом — только свои
    const candidates = [
      ...shuffle(related?.(word) ?? []),
      ...(useExtra ? shuffle([...fromSet, ...fromExtra]) : fromSet),
    ];

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
      direction: "forward",
      correctAnswer: word.translation,
      options,
    };
  });
}
