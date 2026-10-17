// src/utils/dictionary.ts
//
// «Словарь» — все слова приложения в одном месте.
// Деление то же, что у пути: раздел HSK → темы (этапы пути). Так «Словарь» и путь
// говорят на одном языке: тема «Семья» в словаре — тот же этап «Семья» на пути.
// Слова без уровня HSK (и выше HSK 4) лежат в разделе «Другие слова» одной группой.

import type { Word } from "@/content/flashcards/types";
import { allWords } from "@/content/words/vocabulary";
import { getPathStages, type PathStage } from "@/utils/path/stages";
import { getWordHskLevel, NO_HSK_LEVEL } from "@/utils/writing/words";

/** Раздел словаря: уровень HSK или NO_HSK_LEVEL («Другие слова»). */
export type DictionaryLevel = number;

export interface DictionaryGroup {
  key: string;
  title: string;
  words: Word[];
  /** Этап пути, если группа — этап. */
  stage?: PathStage;
}

let levelsCache: DictionaryLevel[] | null = null;

/** Разделы: HSK по возрастанию, «Другие слова» в конце (если такие слова есть). */
export function getDictionaryLevels(): DictionaryLevel[] {
  if (levelsCache) return levelsCache;

  const levels = new Set(allWords.map(getWordHskLevel));
  levelsCache = Array.from(levels).sort(
    (a, b) =>
      (a === NO_HSK_LEVEL ? Infinity : a) - (b === NO_HSK_LEVEL ? Infinity : b),
  );
  return levelsCache;
}

export function describeDictionaryLevel(level: DictionaryLevel): string {
  return level === NO_HSK_LEVEL ? "Другие слова" : `HSK ${level}`;
}

const groupsCache = new Map<DictionaryLevel, DictionaryGroup[]>();

/** Группы раздела: этапы пути по порядку или одна группа «Другие слова». */
export function getDictionaryGroups(level: DictionaryLevel): DictionaryGroup[] {
  const cached = groupsCache.get(level);
  if (cached) return cached;

  const groups: DictionaryGroup[] =
    level === NO_HSK_LEVEL
      ? [
          {
            key: "other",
            title: "Другие слова",
            words: allWords.filter(
              (word) => getWordHskLevel(word) === NO_HSK_LEVEL,
            ),
          },
        ]
      : getPathStages()
          .filter((stage) => stage.level === level)
          .map((stage) => ({
            key: stage.id,
            title: stage.title,
            words: stage.words,
            stage,
          }));

  groupsCache.set(level, groups);
  return groups;
}

let stageByWord: Map<string, PathStage> | null = null;

/** Этап пути, в котором лежит слово. undefined — слова нет на пути. */
export function findWordStage(wordId: string): PathStage | undefined {
  if (!stageByWord) {
    stageByWord = new Map();
    for (const stage of getPathStages()) {
      for (const word of stage.words) stageByWord.set(word.vocabularyId, stage);
    }
  }
  return stageByWord.get(wordId);
}
