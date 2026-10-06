// components/VocabularyWordItem.tsx

import type { WordLevel } from "@/components/ui/LevelDots";
import { allWords } from "@/content/flashcards/data";
import { memo } from "react";
import { WordCard } from "./ui/WordCard";

export const VocabularyWordItem = memo(function VocabularyWordItem({
  word,
  isFavorite,
  level,
  onToggleFavorite,
}: {
  word: (typeof allWords)[number];
  isFavorite: boolean;
  level: WordLevel;
  onToggleFavorite: (wordId: string) => void;
}) {
  return (
    <WordCard
      hanzi={word.hanzi}
      pinyin={word.pinyin}
      translation={word.translation}
      isFavorite={isFavorite}
      onToggleFavorite={() => onToggleFavorite(word.vocabularyId)}
    />
  );
});
