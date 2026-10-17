// src/components/dictionary/DictionaryWordSheet.tsx
//
// Панель слова в «Словаре». Зачем её открывают — по убыванию важности:
//   1. посмотреть слово: иероглиф, пиньинь и перевод (тап по иероглифу — озвучка);
//   2. отложить: «Повторение», «Избранное», «В набор» — одна строка компактных кнопок;
//   3. потренировать письмо: «Написать» быстро или полностью.
// Остальное — мелко внизу: точки перевода и письма, где слово на пути («Показать»).
//
// «В набор» открывает вторую страницу этой же панели (наборы переключателями и
// «Новый набор»), а не ещё одну панель поверх: так нет вложенных окон.
//
// «Написать» есть только у слов, которые можно писать: из 1–2 иероглифов, у каждого
// из которых есть данные о чертах. У слова из двух иероглифов сначала выбирается,
// что писать: всё слово или один из знаков (например, 你好, 你 или 好).

import ArrowLeft from "@/assets/images/icons/arrow-left.svg";
import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import LayersIcon from "@/assets/images/icons/layers.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import StarIcon from "@/assets/images/icons/star.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { SetToggleList } from "@/components/word/SetToggleList";
import { WordHeader } from "@/components/word/WordHeader";
import type { Word } from "@/content/flashcards/types";
import { useCustomSetsStore } from "@/store/customSetsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { findWordStage } from "@/utils/dictionary";
import { getTrackDots, type TrackId } from "@/utils/path/stages";
import type { FreeFormat } from "@/utils/writing/plans";
import { getWordCharacters, getWritableWords } from "@/utils/writing/words";
import { useState, type ComponentType, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type IconProps = { width: number; height: number; color: string };

interface DictionaryWordSheetProps {
  /** Слово; null — панель закрыта. */
  word: Word | null;
  /** «Показать» — открыть этап пути, где лежит слово. */
  onShowStage: (stageId: string) => void;
  /** «Написать» — урок письма по слову (или одному его иероглифу). */
  onWrite: (word: Word, format: FreeFormat) => void;
  onClose: () => void;
}

export function DictionaryWordSheet({
  word,
  onShowStage,
  onWrite,
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
  const sets = useCustomSetsStore((state) => state.sets);

  // Страница панели и что писать — сбрасываются при каждом открытии
  const [page, setPage] = useState<"main" | "sets">("main");
  const [part, setPart] = useState<Word | null>(null);

  return (
    <BottomSheet
      item={word}
      onClose={onClose}
      onOpen={() => {
        setPage("main");
        setPart(null);
      }}
    >
      {(shown) => {
        if (page === "sets") {
          return (
            <>
              <Pressable
                onPress={() => setPage("main")}
                hitSlop={8}
                className="mb-3 flex-row items-center gap-2 self-start active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel="Назад к слову"
              >
                <ArrowLeft width={22} height={22} color={colors.text} />
                <Hanzi size="sm">{shown.hanzi}</Hanzi>
              </Pressable>
              <SetToggleList word={shown} />
            </>
          );
        }

        const stage = findWordStage(shown.vocabularyId);
        const writable = getWritableWords([shown]).length > 0;
        const characters = writable ? getWordCharacters(shown) : [];
        const target = part ?? shown;
        const isFavorite = !!vocabularyWords[shown.vocabularyId]?.isFavorite;
        const inReview = !!review[shown.vocabularyId];
        const setCount = sets.filter((set) =>
          set.wordIds.includes(shown.vocabularyId),
        ).length;

        return (
          <>
            <WordHeader
              hanzi={shown.hanzi}
              pinyin={shown.pinyin}
              translation={t(shown.translation)}
            />

            {/* Отложить: одна строка компактных кнопок */}
            <View className="mt-5 flex-row gap-2">
              <ActionChip
                Icon={ReviewIcon}
                label="Повторение"
                active={inReview}
                onPress={() => toggleReview(shown.vocabularyId)}
              />
              <ActionChip
                Icon={StarIcon}
                label="Избранное"
                active={isFavorite}
                onPress={() => toggleFavorite(shown.vocabularyId)}
              />
              <ActionChip
                Icon={LayersIcon}
                label={setCount > 0 ? `Наборы · ${setCount}` : "В набор"}
                active={setCount > 0}
                onPress={() => setPage("sets")}
              />
            </View>

            {/* Потренировать письмо */}
            {writable && (
              <View className="mt-5 gap-3 rounded-2xl bg-background/60 p-3">
                <View className="flex-row items-center gap-2">
                  <PencilIcon width={18} height={18} color={colors.primary} />
                  <Text className="flex-1 font-nunitoBold text-body text-text">
                    Написать
                  </Text>
                </View>

                {characters.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    {[shown, ...characters].map((option) => {
                      const selected =
                        option.vocabularyId === target.vocabularyId;
                      return (
                        <Pressable
                          key={option.vocabularyId}
                          onPress={() =>
                            setPart(option === shown ? null : option)
                          }
                          className={`min-h-11 min-w-11 items-center justify-center rounded-xl px-3 ${
                            selected
                              ? "bg-primary"
                              : "border border-primary/30 bg-surface active:opacity-70"
                          }`}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={`Писать ${option.hanzi}`}
                        >
                          <Hanzi
                            size={22}
                            className={selected ? "text-white" : "text-text"}
                          >
                            {option.hanzi}
                          </Hanzi>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <View className="flex-row gap-2">
                  <WriteButton
                    label="Быстро"
                    onPress={() => onWrite(target, "quick")}
                  />
                  <WriteButton
                    label="Полностью"
                    primary
                    onPress={() => onWrite(target, "full")}
                  />
                </View>
              </View>
            )}

            {/* Мелко: точки навыков и место на пути */}
            <View className="mt-5 flex-row flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <SkillDots
                label="перевод"
                level={getTrackDots(shown, "reading", flashcardWords)}
                track="reading"
              />
              {writable && (
                <SkillDots
                  label="письмо"
                  level={getTrackDots(shown, "writing", flashcardWords)}
                  track="writing"
                />
              )}
            </View>

            {stage && (
              <Pressable
                onPress={() => onShowStage(stage.id)}
                hitSlop={8}
                className="mt-3 flex-row items-center justify-center gap-1 self-center active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel={`Показать на пути: HSK ${stage.level}, ${stage.title}`}
              >
                <Text className="font-nunito text-small text-textSecondary">
                  HSK {stage.level} · {stage.title} ·
                </Text>
                <Text className="font-nunitoBold text-small text-primary">
                  Показать на пути
                </Text>
              </Pressable>
            )}
          </>
        );
      }}
    </BottomSheet>
  );
}

/** Компактная кнопка «отложить»: иконка и подпись, включённая — залита. */
function ActionChip({
  Icon,
  label,
  active,
  onPress,
}: {
  Icon: ComponentType<IconProps>;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-16 flex-1 items-center justify-center gap-1 rounded-2xl px-1 py-2 active:opacity-70 ${
        active ? "bg-primary" : "border border-primary/30 bg-surface"
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon
        width={20}
        height={20}
        color={active ? "#FFFFFF" : colors.primary}
      />
      <Text
        numberOfLines={1}
        className={`font-nunitoBold text-caption ${
          active ? "text-white" : "text-text"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function WriteButton({
  label,
  primary = false,
  onPress,
}: {
  label: string;
  primary?: boolean;
  onPress: () => void;
}): ReactNode {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-11 flex-1 items-center justify-center rounded-full px-4 active:opacity-80 ${
        primary ? "bg-primary" : "border border-primary bg-surface"
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Написать: ${label.toLowerCase()}`}
    >
      <Text
        className={`font-nunitoBold text-small ${
          primary ? "text-white" : "text-primary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Навык слова мелко: подпись и 3 точки (перевод — зелёные, письмо — тёмные). */
function SkillDots({
  label,
  level,
  track,
}: {
  label: string;
  level: number;
  track: TrackId;
}) {
  const filled = track === "reading" ? "bg-primary" : "bg-text";
  const empty = track === "reading" ? "bg-primary/20" : "bg-text/20";

  return (
    <View className="flex-row items-center gap-1.5">
      <Text className="font-nunito text-caption text-textSecondary">
        {label}
      </Text>
      <View className="flex-row gap-1">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < level ? filled : empty}`}
          />
        ))}
      </View>
    </View>
  );
}
