// src/components/writing/results/WritingResultsList.tsx
//
// Итоги тренировки письма — в том же виде, что у карточек: два раздела.
//   «С подсказками» — слова, написанные с подсказками (как «Ошибки»);
//   в шапке — «Все в повторение». Если таких нет — похвала.
//   «Без подсказок» — остальные.
// В строке: твоё написание, слово, перевод, точки «было → стало» (у слова
// и у его иероглифов) и две кнопки справа:
//   закладка — «Повторение» письма сразу, без панели (на экзамен слово попадает
//   только с 3 точками, закладка на это не влияет);
//   плюс — панель слова (onOpenWord): наборы, новый набор, озвучка.

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import type { WritingWordResult } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { HanziView } from "../canvas/HanziView";

/** Размер превью твоего написания одного иероглифа. */
const PREVIEW_SIZE = 52;

const toLevel = (value: number) =>
  Math.min(3, Math.max(0, Math.round(value))) as WordLevel;

/** Точки «было → стало». Если ничего не изменилось — просто текущие точки. */
function LevelChange({ before, after }: { before: number; after: number }) {
  const from = toLevel(before);
  const to = toLevel(after);

  if (from === to) return <LevelDots level={to} />;

  return (
    <View className="flex-row items-center gap-2">
      <LevelDots level={from} />
      <Text className="font-nunito text-caption text-text">→</Text>
      <LevelDots level={to} />
    </View>
  );
}

function toWord(item: WritingWordResult): Word {
  return {
    id: item.vocabularyId,
    vocabularyId: item.vocabularyId,
    hanzi: item.hanzi,
    pinyin: item.pinyin,
    translation: item.translation,
  };
}

interface WritingResultsListProps {
  results: WritingWordResult[];
  /** Панель слова (наборы, новый набор). */
  onOpenWord: (word: Word) => void;
}

export function WritingResultsList({
  results,
  onOpenWord,
}: WritingResultsListProps) {
  const { t } = useTranslation(["sets"]);

  const writingReview = useWordProgressStore((s) => s.writingReview);
  const toggleWritingReview = useWordProgressStore(
    (s) => s.toggleWritingReview,
  );
  const removeFromWritingReview = useWordProgressStore(
    (s) => s.removeFromWritingReview,
  );

  // Одно слово может встретиться дважды (например, 画画 в уроке) — показываем один раз;
  // «с подсказками», если хоть раз писалось с подсказками
  const byId = new Map<string, WritingWordResult>();
  for (const item of results) {
    const previous = byId.get(item.vocabularyId);
    if (!previous || (previous.isCorrect && !item.isCorrect)) {
      byId.set(item.vocabularyId, item);
    }
  }
  const unique = Array.from(byId.values());
  const withHints = unique.filter((item) => !item.isCorrect);
  const clean = unique.filter((item) => item.isCorrect);

  const toAdd = withHints
    .map((item) => item.vocabularyId)
    .filter((id) => !writingReview[id]);

  const addAll = () => {
    for (const id of toAdd) toggleWritingReview(id);
  };

  const renderRow = (item: WritingWordResult) => {
    const inReview = !!writingReview[item.vocabularyId];

    return (
      <View
        key={item.vocabularyId}
        className="gap-2 rounded-2xl bg-surface py-3 pl-3 pr-2"
      >
        <View className="flex-row items-center gap-3">
          {/* Твоё написание */}
          <Pressable
            onPress={() => onOpenWord(toWord(item))}
            className="flex-row gap-1 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={`${item.hanzi}: твоё написание`}
          >
            {item.raws.map((raw, index) => (
              <HanziView key={index} size={PREVIEW_SIZE} rawStrokes={raw} />
            ))}
          </Pressable>

          {/* Слово, перевод, точки */}
          <Pressable
            onPress={() => onOpenWord(toWord(item))}
            className="min-w-0 flex-1 gap-0.5 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={`${item.hanzi}, ${item.pinyin}, ${t(item.translation)}`}
          >
            <View className="flex-row flex-wrap items-baseline gap-x-2">
              <Hanzi size={24}>{item.hanzi}</Hanzi>
              <Pinyin size="sm">{item.pinyin}</Pinyin>
            </View>
            <Text
              className="font-nunito text-small text-text"
              numberOfLines={2}
            >
              {t(item.translation)}
            </Text>
            <View className="mt-1">
              <LevelChange before={item.levelBefore} after={item.levelAfter} />
            </View>
          </Pressable>

          {/* Повторение и наборы */}
          <View className="flex-row items-center">
            <Pressable
              onPress={() =>
                inReview
                  ? removeFromWritingReview(item.vocabularyId)
                  : toggleWritingReview(item.vocabularyId)
              }
              hitSlop={4}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                inReview ? "bg-primary/15" : "active:bg-text/10"
              }`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: inReview }}
              accessibilityLabel={`${item.hanzi}: ${
                inReview ? "убрать из повторения" : "добавить в повторение"
              }`}
            >
              <ReviewIcon
                width={22}
                height={22}
                color={inReview ? colors.primary : colors.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => onOpenWord(toWord(item))}
              hitSlop={4}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-primary/10"
              accessibilityRole="button"
              accessibilityLabel={`${item.hanzi}: добавить в набор`}
            >
              <PlusIcon width={24} height={24} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Иероглифы слова: каждый засчитывается как отдельное слово */}
        {item.characters.length > 0 && (
          <View className="gap-1 pl-2 pr-3">
            {item.characters.map((char) => (
              <View
                key={char.vocabularyId}
                className="flex-row items-center gap-2"
              >
                <Hanzi size={18}>{char.hanzi}</Hanzi>
                <Pinyin size="sm">{char.pinyin}</Pinyin>
                <View className="flex-1" />
                <LevelChange
                  before={char.levelBefore}
                  after={char.levelAfter}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="gap-8">
      {/* С подсказками или похвала */}
      {withHints.length > 0 ? (
        <View className="gap-3">
          <View className="min-h-10 flex-row items-center justify-between gap-3">
            <Text className="font-nunitoBold text-title text-text">
              С подсказками · {withHints.length}
            </Text>
            {/* Ширина фиксирована: смена текста не сдвигает ничего вокруг */}
            <Pressable
              onPress={addAll}
              disabled={toAdd.length === 0}
              className={`min-h-10 w-44 flex-row items-center justify-center gap-1.5 rounded-full px-3 ${
                toAdd.length > 0
                  ? "border border-primary active:bg-primary/10"
                  : "border border-transparent bg-primary/15"
              }`}
              accessibilityRole="button"
              accessibilityState={{ disabled: toAdd.length === 0 }}
            >
              <ReviewIcon width={16} height={16} color={colors.primary} />
              <Text className="font-nunitoBold text-small text-primary">
                {toAdd.length > 0 ? "Все в повторение" : "Все в повторении"}
              </Text>
            </Pressable>
          </View>
          {withHints.map(renderRow)}
        </View>
      ) : (
        <View className="items-center gap-1 rounded-2xl bg-surface px-5 py-5">
          <Text className="font-nunitoBold text-title text-primary">
            Без подсказок!
          </Text>
          <Text className="text-center font-nunito text-body text-text">
            Все слова написаны сами.
          </Text>
        </View>
      )}

      {clean.length > 0 && (
        <View className="gap-3">
          <Text className="font-nunitoBold text-title text-text">
            Без подсказок · {clean.length}
          </Text>
          {clean.map(renderRow)}
        </View>
      )}

      <Text className="text-center font-nunito text-small text-textSecondary">
        Закладка — в повторение, плюс — в любой набор.
      </Text>
    </View>
  );
}
