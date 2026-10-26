// src/utils/wordChanges.ts
//
// Запоминает, как менялись точки слов за одну тренировку:
// «до» — уровень перед первым ответом на слово, «после» — после последнего.
// Нужен панде (word_mastered / word_mistake) и экрану итогов.

import type { WordChange } from "@/store/pandaStore";
import { answerWord } from "@/utils/learning";
import { readWordLevel } from "@/utils/wordLevel";
import type { QuizQuestionBase } from "@/hooks/game/useQuizSession";

type Skill = "reading" | "writing";

export function createWordChangeTracker(skill: Skill) {
  let changes: Record<string, WordChange> = {};

  return {
    reset() {
      changes = {};
    },

    /** Засчитывает ответ в прогресс слова и запоминает изменение точек. */
    answer(word: QuizQuestionBase, isCorrect: boolean) {
      const wordId = word.vocabularyId;
      const levelBefore = readWordLevel(wordId, skill);

      // Точка и переход между «Повторением» и «Изученным»
      answerWord(wordId, skill, isCorrect);

      const existing = changes[wordId];
      changes[wordId] = {
        vocabularyId: wordId,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        translation: word.translation,
        levelBefore: existing ? existing.levelBefore : levelBefore,
        levelAfter: readWordLevel(wordId, skill),
        isCorrect,
      };
    },

    list(): WordChange[] {
      return Object.values(changes);
    },
  };
}
