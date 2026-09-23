import { allWords } from "@/content/flashcards/data";
import { memo } from "react";
import { WordCard } from "./ui/WordCard";

export const VocabularyWordItem = memo(function VocabularyWordItem({
  word,
  isFavorite,
  onToggleFavorite,
}: {
  word: (typeof allWords)[number];
  isFavorite: boolean;
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
