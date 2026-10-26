// src/utils/writing/lessonResults.ts
//
// Конец урока письма: точки за написанное, данные для экрана итогов и панды, награда.
// Сам ход урока (этапы, черты, подсказки) — в useWritingLesson.

import {
  useGameStore,
  type FlashcardQuestionResult,
  type WritingCharResult,
  type WritingWordResult,
} from "@/store/gameStore";
import type { WordChange } from "@/store/pandaStore";
import type { WordLevel } from "@/store/wordProgressStore";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
import { finishTraining, getAccuracy } from "@/utils/finishTraining";
import { answerWord, applyAnswerStatus } from "@/utils/learning";
import { readWordLevel } from "@/utils/wordLevel";
import type { LessonItem } from "./plans";
import type { Point } from "./strokeCheck";
import { getCharacterWord } from "./words";

export interface CharOutcome {
  hanzi: string;
  /** Иероглиф написан на итоговом этапе без раскрытых подсказок. */
  success: boolean;
}

export interface WordOutcome {
  word: LessonItem["word"];
  /** Линии пользователя на последнем этапе по каждому иероглифу (для экрана итогов). */
  raws: Point[][][];
  /** Слово написано на последнем этапе без раскрытых подсказок. */
  success: boolean;
  /**
   * Результат каждого иероглифа слова (только для слов из нескольких иероглифов,
   * повторяющийся иероглиф — один раз). Каждый получает точку как отдельный иероглиф:
   * под словом из базы или под «char:么», как в окне выбора.
   */
  chars: CharOutcome[];
  /** Это была работа над ошибками (в счёт урока не идёт). */
  deep: boolean;
  /** Слово нужно отправить на работу над ошибками, если не получилось. */
  retryDeep: boolean;
}

/** Результаты отдельных иероглифов слова по тому, где на итоговом этапе были подсказки. */
export function charOutcomesOf(
  hanzi: string,
  assistedChars: number[],
): CharOutcome[] {
  const list = Array.from(hanzi);
  if (list.length < 2) return [];

  return Array.from(new Set(list)).map((character) => ({
    hanzi: character,
    // Повторяющийся иероглиф засчитывается, только если все его вхождения без подсказок
    success: list.every(
      (c, index) => c !== character || !assistedChars.includes(index),
    ),
  }));
}

/** Точки письма слов урока до начала: чтобы показать, что изменилось. */
export function readWritingLevels(words: LessonItem["word"][]) {
  return Object.fromEntries(
    words.map((word) => [
      word.vocabularyId,
      readWordLevel(word.vocabularyId, "writing"),
    ]),
  ) as Record<string, number>;
}

/**
 * Завершает урок: начисляет точки, сохраняет итоги для экрана статистики,
 * передаёт результат панде, начисляет награду и уходит на /games/stats.
 *
 * @param levelsBefore точки слов урока на момент его начала (readWritingLevels)
 */
export function finishWritingLesson(
  outcomes: WordOutcome[],
  levelsBefore: Record<string, number>,
) {
  const game = useGameStore.getState();
  const before = { ...levelsBefore };

  // 0. Уровни иероглифов до начисления точек (у слов урока они уже записаны в начале)
  for (const { word, chars } of outcomes) {
    for (const { hanzi } of chars) {
      const character = getCharacterWord(hanzi, word);
      if (character && before[character.vocabularyId] === undefined) {
        before[character.vocabularyId] = readWordLevel(
          character.vocabularyId,
          "writing",
        );
      }
    }
  }

  // 1. Точки. Тренировка учебная: точки только прибавляются, за подсказки не снимаются.
  //    Каждое слово получает за урок не больше одной точки.
  const credited = new Set<string>();
  const credit = (wordId: string) => {
    if (credited.has(wordId)) return;
    credited.add(wordId);
    answerWord(wordId, "writing", true);
  };

  // Слова, написанные без подсказок
  for (const { word, success } of outcomes) {
    if (success) credit(word.vocabularyId);
  }

  // Иероглифы внутри слов, написанные без подсказок
  for (const { word, chars } of outcomes) {
    for (const { hanzi, success } of chars) {
      if (!success) continue;
      const character = getCharacterWord(hanzi, word);
      if (character) credit(character.vocabularyId);
    }
  }

  // Написано с подсказками — для «Изученного» это ошибка: изученное слово
  // возвращается в «Повторение» (точки не снимаются). После начисления точек:
  // успех в работе над ошибками не отменяет провал в основном задании
  for (const { word, success, deep } of outcomes) {
    if (!deep && !success) applyAnswerStatus(word.vocabularyId, false);
  }

  /** Точки слова «было → стало». */
  const levelChange = (wordId: string) => {
    const levelAfter = readWordLevel(wordId, "writing");
    const levelBefore = (before[wordId] ?? levelAfter) as WordLevel;
    return { levelBefore, levelAfter };
  };

  // 2. В счёт урока идут основные задания, без работы над ошибками
  const scored = outcomes.filter((outcome) => !outcome.deep);

  // Для экрана итогов: все написанные слова с линиями пользователя и точками,
  // у слов из нескольких иероглифов — ещё и точки каждого иероглифа
  const writingResults: WritingWordResult[] = scored.map(
    ({ word, success, raws, chars }) => ({
      vocabularyId: word.vocabularyId,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      translation: word.translation,
      isCorrect: success,
      raws,
      ...levelChange(word.vocabularyId),
      characters: chars.flatMap(({ hanzi }): WritingCharResult[] => {
        const character = getCharacterWord(hanzi, word);
        if (!character) return [];
        return [
          {
            vocabularyId: character.vocabularyId,
            hanzi: character.hanzi,
            pinyin: character.pinyin,
            ...levelChange(character.vocabularyId),
          },
        ];
      }),
    }),
  );
  game.setWritingResults(writingResults);

  const results: FlashcardQuestionResult[] = [];
  const wordChanges: WordChange[] = [];

  for (const { word, success } of scored) {
    const result: FlashcardQuestionResult = {
      vocabularyId: word.vocabularyId,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      translation: word.translation,
      isCorrect: success,
    };

    game.answerQuestion(result);
    results.push(result);
    wordChanges.push({ ...result, ...levelChange(word.vocabularyId) });
  }

  const { score } = useGameStore.getState();
  const total = scored.length;

  finishTraining({
    gameId: "writing",
    answers: total,
    rewards: {
      xp: score,
      coins: calculateCoinsEarned(getAccuracy(score, total)),
    },
    pandaResult: {
      type: "writing_completed",
      score,
      total,
      results,
      wordChanges,
    },
  });
}
