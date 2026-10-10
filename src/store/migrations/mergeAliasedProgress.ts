// src/store/migrations/mergeAliasedProgress.ts
//
// Переносит сохранённый прогресс со старых id склеенных слов на оставшиеся
// (список — в src/content/words/aliases.ts). Безопасно запускать повторно.

import { wordAliases } from "@/content/words/aliases";

interface SkillLike {
  streak: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

interface ProgressLike {
  wordId: string;
  reading: SkillLike;
  writing: SkillLike;
  lastAnsweredAt: number;
}

interface VocabularyLike {
  isFavorite: boolean;
  isKnown: boolean;
}

interface StateLike {
  flashcardWords?: Record<string, ProgressLike>;
  vocabularyWords?: Record<string, VocabularyLike>;
}

function mergeSkill(a: SkillLike, b: SkillLike): SkillLike {
  return {
    streak: Math.max(a.streak, b.streak),
    correctAnswers: a.correctAnswers + b.correctAnswers,
    incorrectAnswers: a.incorrectAnswers + b.incorrectAnswers,
  };
}

export function mergeAliasedProgress<T extends StateLike>(state: T): T {
  const flashcardWords = { ...(state.flashcardWords ?? {}) };
  const vocabularyWords = { ...(state.vocabularyWords ?? {}) };

  for (const [alias, canonical] of Object.entries(wordAliases)) {
    const aliasProgress = flashcardWords[alias];

    if (aliasProgress) {
      const existing = flashcardWords[canonical];

      flashcardWords[canonical] = existing
        ? {
            wordId: canonical,
            reading: mergeSkill(existing.reading, aliasProgress.reading),
            writing: mergeSkill(existing.writing, aliasProgress.writing),
            lastAnsweredAt: Math.max(
              existing.lastAnsweredAt,
              aliasProgress.lastAnsweredAt,
            ),
          }
        : { ...aliasProgress, wordId: canonical };

      delete flashcardWords[alias];
    }

    const aliasVocabulary = vocabularyWords[alias];

    if (aliasVocabulary) {
      const existing = vocabularyWords[canonical];

      vocabularyWords[canonical] = {
        isFavorite:
          (existing?.isFavorite ?? false) || aliasVocabulary.isFavorite,
        isKnown: (existing?.isKnown ?? false) || aliasVocabulary.isKnown,
      };

      delete vocabularyWords[alias];
    }
  }

  return { ...state, flashcardWords, vocabularyWords };
}
