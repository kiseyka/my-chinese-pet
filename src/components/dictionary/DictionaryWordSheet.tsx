// src/components/dictionary/DictionaryWordSheet.tsx
//
// Панель слова в «Словаре» (тап по слову в сетке или в поиске):
//   - иероглиф и пиньинь (тап — озвучка), перевод;
//   - навыки: перевод и письмо, у каждого свои 3 точки (письма нет у слов,
//     которые нельзя писать — длиннее 2 иероглифов или без данных о чертах);
//   - «Повторение» — рабочий список: слова, которые хочется отработать;
//   - «Избранное» — личная коллекция слов, без цели повторять;
//   - где слово на пути («HSK 1 · Семья») и «Показать» — экран этого этапа;
//   - свои наборы переключателями.
//   - «Повторение» — один рабочий список на все навыки.

import BookIcon from "@/assets/images/icons/book-open.svg";
import ReviewIcon from "@/assets/images/icons/bookmark-plus.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import StarIcon from "@/assets/images/icons/star.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SetToggleList } from "@/components/word/SetToggleList";
import { ToggleCard } from "@/components/word/ToggleCard";
import { WordHeader } from "@/components/word/WordHeader";
import { WordLocationRow } from "@/components/word/WordLocationRow";
import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { findWordStage } from "@/utils/dictionary";
import { getTrackDots, type TrackId } from "@/utils/path/stages";
import { getWritableWords } from "@/utils/writing/words";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface DictionaryWordSheetProps {
  /** Слово; null — панель закрыта. */
  word: Word | null;
  /** «Показать» — открыть этап пути, где лежит слово. */
  onShowStage: (stageId: string) => void;
  onClose: () => void;
}

export function DictionaryWordSheet({
  word,
  onShowStage,
  onClose,
}: DictionaryWordSheetProps) {
  const { t } = useTranslation();
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );
  const toggleFavorite = useWordProgressStore((state) => state.toggleFavorite);
  const review = useWordProgressStore((state) => state.review);
  const toggleReview = useWordProgressStore((state) => state.toggleReview);

  return (
    <BottomSheet item={word} onClose={onClose}>
      {(shown) => {
        const stage = findWordStage(shown.vocabularyId);
        const writable = getWritableWords([shown]).length > 0;
        const isFavorite = !!vocabularyWords[shown.vocabularyId]?.isFavorite;
        const inReview = !!review[shown.vocabularyId];

        return (
          <>
            <WordHeader
              hanzi={shown.hanzi}
              pinyin={shown.pinyin}
              translation={t(shown.translation)}
            />

            <View className="mt-4 flex-row justify-center gap-6">
              <SkillDots
                Icon={BookIcon}
                label="перевод"
                level={getTrackDots(shown, "reading", flashcardWords)}
                track="reading"
              />
              {writable && (
                <SkillDots
                  Icon={PencilIcon}
                  label="письмо"
                  level={getTrackDots(shown, "writing", flashcardWords)}
                  track="writing"
                />
              )}
            </View>

            {stage && (
              <WordLocationRow
                className="mt-5"
                location={`HSK ${stage.level} · ${stage.title}`}
                onShow={() => onShowStage(stage.id)}
              />
            )}

            <ToggleCard
              className="mt-4"
              icon={
                <ReviewIcon
                  width={26}
                  height={26}
                  color={inReview ? colors.primary : colors.textSecondary}
                />
              }
              label={inReview ? "В повторении" : "Добавить в повторение"}
              checked={inReview}
              onPress={() => toggleReview(shown.vocabularyId)}
            />

            <ToggleCard
              className="mt-2"
              icon={
                <StarIcon
                  width={26}
                  height={26}
                  color={isFavorite ? colors.primary : colors.textSecondary}
                />
              }
              label={isFavorite ? "В избранном" : "Добавить в избранное"}
              checked={isFavorite}
              onPress={() => toggleFavorite(shown.vocabularyId)}
            />

            <SetToggleList word={shown} className="mt-6" />
          </>
        );
      }}
    </BottomSheet>
  );
}

/** Навык слова: иконка, подпись и 3 точки (перевод — зелёные, письмо — тёмные). */
function SkillDots({
  Icon,
  label,
  level,
  track,
}: {
  Icon: ComponentType<{ width: number; height: number; color: string }>;
  label: string;
  level: number;
  track: TrackId;
}) {
  const filled = track === "reading" ? "bg-primary" : "bg-text";
  const empty = track === "reading" ? "bg-primary/20" : "bg-text/20";

  return (
    <View className="flex-row items-center gap-2">
      <Icon width={16} height={16} color={colors.textSecondary} />
      <Text className="font-nunito text-small text-textSecondary">{label}</Text>
      <View className="flex-row gap-1">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className={`h-2 w-2 rounded-full ${i < level ? filled : empty}`}
          />
        ))}
      </View>
    </View>
  );
}
