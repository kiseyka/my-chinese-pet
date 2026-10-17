// src/components/flashcards/FlashcardResultsList.tsx
//
// Итоги тренировки карточками: два раздела.
//   «Ошибки» — слова, на которые хоть раз ответили неверно. Если ошибок нет —
//   вместо раздела похвала. В шапке раздела — «Все в повторение» (кнопка
//   не меняет размер и не сдвигает экран: только текст и вид).
//   «Верно» — остальные слова.
// У каждого слова: иероглиф, точки, пиньинь, перевод и две кнопки справа:
//   закладка — «Повторение» сразу, без панели;
//   плюс — панель слова (onOpenWord): наборы, новый набор, озвучка.
// Тап по самому слову открывает ту же панель.
//
// Самопроверка (selfCheck): разделы «Не знаю», «Сомневаюсь» (у обоих —
// «Все в повторение») и «Знаю».

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import PlusIcon from "@/assets/images/icons/circle-plus.svg";
import type { WordLevel } from "@/components/ui/LevelDots";
import type { Word } from "@/content/flashcards/types";
import type { FlashcardQuestionResult } from "@/store/gameStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { Pressable, Text, View } from "react-native";
import { SetWordRow } from "./SetWordRow";

interface FlashcardResultsListProps {
  results: FlashcardQuestionResult[];
  /** Итоги самопроверки: разделы по ответам. */
  selfCheck?: boolean;
  onOpenWord: (word: Word) => void;
}

/** Результат в формате Word (для строки и панели слова). */
function toWord(item: FlashcardQuestionResult): Word {
  return {
    id: item.vocabularyId,
    vocabularyId: item.vocabularyId,
    hanzi: item.hanzi,
    pinyin: item.pinyin,
    translation: item.translation,
  };
}

export function FlashcardResultsList({
  results,
  selfCheck = false,
  onOpenWord,
}: FlashcardResultsListProps) {
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const vocabularyWords = useWordProgressStore((s) => s.vocabularyWords);
  const review = useWordProgressStore((s) => s.review);
  const toggleReview = useWordProgressStore(
    (s) => s.toggleReview,
  );
  const addToReview = useWordProgressStore((s) => s.addToReview);

  // Одно слово — одна строка; ошибка, если хоть раз ответили неверно
  const byId = new Map<string, FlashcardQuestionResult>();
  for (const item of results) {
    const previous = byId.get(item.vocabularyId);
    if (!previous || (previous.isCorrect && !item.isCorrect)) {
      byId.set(item.vocabularyId, item);
    }
  }
  const unique = Array.from(byId.values());
  const mistakes = unique.filter((item) => !item.isCorrect);
  const correct = unique.filter((item) => item.isCorrect);

  /** Слова раздела, которых ещё нет в «Повторении». */
  const notInReview = (items: FlashcardQuestionResult[]) =>
    items.map((item) => item.vocabularyId).filter((id) => !review[id]);

  const renderRow = (item: FlashcardQuestionResult) => {
    const inReview = !!review[item.vocabularyId];
    const level = getWordLevel(
      flashcardWords[item.vocabularyId],
      vocabularyWords[item.vocabularyId]?.isKnown ?? false,
      ["reading"],
    ) as WordLevel;

    return (
      <SetWordRow
        key={item.vocabularyId}
        word={toWord(item)}
        action="open"
        level={level}
        onPress={() => {}}
        onOpenWord={onOpenWord}
        trailing={
          <View className="flex-row items-center">
            {/* Повторение — сразу, без панели */}
            <Pressable
              onPress={() => toggleReview(item.vocabularyId)}
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

            {/* Плюс — панель слова: наборы, новый набор */}
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
        }
      />
    );
  };

  /** Заголовок раздела с «Все в повторение». */
  const reviewSection = (title: string, items: FlashcardQuestionResult[]) => {
    const toAdd = notInReview(items);

    return (
      <View className="gap-3">
        <View className="min-h-10 flex-row items-center justify-between gap-3">
          <Text className="font-nunitoBold text-title text-text">
            {title} · {items.length}
          </Text>
          {/* Ширина фиксирована: смена текста не сдвигает ничего вокруг */}
          <Pressable
            onPress={() => addToReview(toAdd)}
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
        {items.map(renderRow)}
      </View>
    );
  };

  const plainSection = (title: string, items: FlashcardQuestionResult[]) =>
    items.length > 0 && (
      <View className="gap-3">
        <Text className="font-nunitoBold text-title text-text">
          {title} · {items.length}
        </Text>
        {items.map(renderRow)}
      </View>
    );

  const praise = (title: string, text: string) => (
    <View className="items-center gap-1 rounded-2xl bg-surface px-5 py-5">
      <Text className="font-nunitoBold text-title text-primary">{title}</Text>
      <Text className="text-center font-nunito text-body text-text">
        {text}
      </Text>
    </View>
  );

  const footer = (
    <Text className="text-center font-nunito text-small text-textSecondary">
      Закладка — в повторение, плюс — в любой набор.
    </Text>
  );

  if (selfCheck) {
    const dont = unique.filter((item) => item.selfCheck === "dont");
    const unsure = unique.filter((item) => item.selfCheck === "unsure");
    const know = unique.filter((item) => item.selfCheck === "know");

    return (
      <View className="gap-8">
        {dont.length === 0 && unsure.length === 0
          ? praise("Всё знакомо!", "Ни одного сомнения.")
          : null}
        {dont.length > 0 && reviewSection("Не знаю", dont)}
        {unsure.length > 0 && reviewSection("Сомневаюсь", unsure)}
        {plainSection("Знаю", know)}
        {footer}
      </View>
    );
  }

  return (
    <View className="gap-8">
      {/* Ошибки или похвала */}
      {mistakes.length > 0
        ? reviewSection("Ошибки", mistakes)
        : praise("Без ошибок!", "Все слова узнаны верно.")}

      {/* Верно */}
      {plainSection("Верно", correct)}

      {footer}
    </View>
  );
}
