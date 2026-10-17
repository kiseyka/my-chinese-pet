// src/components/flashcards/WordSheet.tsx
//
// Панель слова снизу (по тапу на слово в сетке, в результатах, в наборе) — в том же
// виде, что окно слова в «Написании»: иероглиф и пиньинь (тап — озвучка), перевод,
// точки, «Добавить в повторение» и свои наборы карточками-переключателями.
// Где лежит слово («HSK 2 · Ступень 7» и «Показать») — только если передано
// (на экране карточек — только для слова из поиска).

import ReviewIcon from "@/assets/images/icons/bookmark-plus.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SetToggleList } from "@/components/word/SetToggleList";
import { ToggleCard } from "@/components/word/ToggleCard";
import { WordHeader } from "@/components/word/WordHeader";
import { WordLocationRow } from "@/components/word/WordLocationRow";
import { WritingDots } from "@/components/writing/home/WritingDots";
import type { Word } from "@/content/flashcards/types";
import { interopIconColor } from "@/lib/interopIcon";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interopIconColor(ReviewIcon);

interface WordSheetProps {
  /** Слово; null — панель закрыта. */
  word: Word | null;
  /** Где лежит слово: «HSK 2 · Ступень 7». */
  location?: string;
  /** Если передан — у строки с местом есть кнопка «Показать». */
  onShowInStep?: () => void;
  /**
   * Чей навык показывают точки: чтения (карточки) или письма.
   * «Повторение» одно на оба навыка.
   */
  skill?: "reading" | "writing";
  onClose: () => void;
}

export function WordSheet({
  word,
  location,
  onShowInStep,
  skill = "reading",
  onClose,
}: WordSheetProps) {
  const { t } = useTranslation();

  // «Повторение» одно на все навыки
  const review = useWordProgressStore((state) => state.review);
  const toggleReview = useWordProgressStore((state) => state.toggleReview);
  const isWriting = skill === "writing";
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  return (
    <BottomSheet item={word} onClose={onClose}>
      {(shown) => {
        // Для письма отметка «знаю» из словаря не учитывается
        const level = getWordLevel(
          flashcardWords[shown.vocabularyId],
          isWriting
            ? false
            : (vocabularyWords[shown.vocabularyId]?.isKnown ?? false),
          [skill],
        );
        const inReview = !!review[shown.vocabularyId];

        return (
          <>
            <WordHeader
              hanzi={shown.hanzi}
              pinyin={shown.pinyin}
              translation={t(shown.translation)}
            />

            <View className="mt-3 items-center">
              <WritingDots level={level} />
            </View>

            {location && (
              <WordLocationRow
                className="mt-5"
                location={location}
                onShow={onShowInStep}
              />
            )}

            <ToggleCard
              className="mt-4"
              icon={<ReviewIcon width={26} height={26} className="text-primary" />}
              label={inReview ? "В повторении" : "Добавить в повторение"}
              checked={inReview}
              onPress={() => toggleReview(shown.vocabularyId)}
            />

            <SetToggleList word={shown} className="mt-6" />
          </>
        );
      }}
    </BottomSheet>
  );
}
