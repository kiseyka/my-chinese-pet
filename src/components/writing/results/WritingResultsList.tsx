// src/components/writing/results/WritingResultsList.tsx
//
// Итоги тренировки письма — в том же виде, что у карточек: два раздела.
//   «С подсказками» — слова, написанные с подсказками (как «Ошибки»);
//   в шапке — «Все в повторение». Если таких нет — похвала.
//   «Без подсказок» — остальные.
// В строке: твоё написание, слово, перевод, точки «было → стало» (у слова
// и у его иероглифов) и две кнопки справа (ResultActions): закладка —
// «Повторение», значок наборов — панель слова (наборы, новый набор, озвучка).
// Разделы свёрнуты (CollapsibleSection): выше них на экране итогов —
// «Перешли в изученные» и «Вернулись в повторение»; слово может быть и там, и здесь.
// Тап по написанию иероглифа — сохранить его в галерею (значок в углу превью).

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { LevelDots, type WordLevel } from "@/components/ui/LevelDots";
import { Pinyin } from "@/components/ui/Pinyin";
import { CollapsibleSection } from "@/components/results/CollapsibleSection";
import { ResultActions } from "@/components/results/ResultActions";
import type { Word } from "@/content/flashcards/types";
import type { WritingWordResult } from "@/store/gameStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import {
  GallerySaveDialog,
  type GalleryCandidate,
} from "../gallery/GallerySaveDialog";
import { SavableHanzi } from "../gallery/SavableHanzi";

/** Размер превью твоего написания одного иероглифа. */
const PREVIEW_SIZE = 44;

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
  const [toSave, setToSave] = useState<GalleryCandidate | null>(null);
  const askSave = (hanzi: string, strokes: GalleryCandidate["strokes"]) =>
    setToSave({ hanzi, strokes });

  const review = useWordProgressStore((s) => s.review);
  const toggleReview = useWordProgressStore((s) => s.toggleReview);

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
    .filter((id) => !review[id]);

  const addAll = () => {
    for (const id of toAdd) toggleReview(id);
  };

  const renderRow = (item: WritingWordResult) => {
    return (
      <View
        key={item.vocabularyId}
        className="gap-1.5 rounded-xl bg-surface py-2 pl-2 pr-1"
      >
        <View className="flex-row items-center gap-3">
          {/* Твоё написание: тап по иероглифу — в галерею */}
          <View className="flex-row gap-1">
            {item.raws.map((raw, index) => (
              <SavableHanzi
                key={index}
                hanzi={Array.from(item.hanzi)[index] ?? item.hanzi}
                strokes={raw}
                size={PREVIEW_SIZE}
                onSave={askSave}
              />
            ))}
          </View>

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
          <ResultActions word={toWord(item)} onOpenWord={onOpenWord} />
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
    <View className="gap-4">
      <GallerySaveDialog candidate={toSave} onClose={() => setToSave(null)} />

      {/* С подсказками или похвала */}
      {withHints.length > 0 ? (
        <CollapsibleSection
          title="С подсказками"
          count={withHints.length}
          action={
            // Ширина фиксирована: смена текста не сдвигает ничего вокруг
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
          }
        >
          {withHints.map(renderRow)}
        </CollapsibleSection>
      ) : (
        <View className="items-center gap-1 rounded-2xl bg-surface px-5 py-5">
          <Text className="font-nunitoBold text-lead text-primary">
            Без подсказок!
          </Text>
          <Text className="text-center font-nunito text-body text-text">
            Все слова написаны сами.
          </Text>
        </View>
      )}

      {clean.length > 0 && (
        <CollapsibleSection title="Без подсказок" count={clean.length}>
          {clean.map(renderRow)}
        </CollapsibleSection>
      )}

      <Text className="text-center font-nunito text-small text-textSecondary">
        Закладка — в повторение, значок наборов — в любой набор.{"\n"}Тап по
        своему написанию — сохранить его в галерею.
      </Text>
    </View>
  );
}
