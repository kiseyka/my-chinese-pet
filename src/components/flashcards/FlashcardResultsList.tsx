// src/components/flashcards/FlashcardResultsList.tsx
//
// Итоги тренировки карточками: два раздела.
//   «Ошибки» — слова, на которые хоть раз ответили неверно. Если ошибок нет —
//   вместо раздела похвала. В шапке раздела — «Все в повторение» (кнопка
//   не меняет размер и не сдвигает экран: только текст и вид).
//   «Верно» — остальные слова.
// У каждого слова: иероглиф, точки, пиньинь, перевод и две кнопки справа
// (ResultActions): закладка — «Повторение», значок наборов — панель слова.
//
// Изученные слова (все точки), на которых была ошибка, идут не в «Ошибки», а в
// «Вернулись в повторение» (returnedIds): тренировка сама положила их в повторение,
// закладка уже стоит — снять её, если слово знакомо.
// Тап по самому слову открывает ту же панель.
//
// Самопроверка (selfCheck): разделы «Не знаю», «Сомневаюсь» (у обоих —
// «Все в повторение») и «Знаю».

import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import type { WordLevel } from "@/components/ui/LevelDots";
import type { Word } from "@/content/flashcards/types";
import type { FlashcardQuestionResult } from "@/store/gameStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { Pressable, Text, View } from "react-native";
import { ResultActions } from "@/components/results/ResultActions";
import { SetWordRow } from "./SetWordRow";

interface FlashcardResultsListProps {
  results: FlashcardQuestionResult[];
  /** Итоги самопроверки: разделы по ответам. */
  selfCheck?: boolean;
  /** Изученные слова, которые тренировка вернула в повторение (вместо «Ошибок»). */
  returnedIds?: Set<string>;
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
  returnedIds,
  onOpenWord,
}: FlashcardResultsListProps) {
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const vocabularyWords = useWordProgressStore((s) => s.vocabularyWords);
  const review = useWordProgressStore((s) => s.review);
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
  const isReturned = (item: FlashcardQuestionResult) =>
    !!returnedIds?.has(item.vocabularyId);
  // Вернувшиеся в повторение — своим разделом, в ошибках не повторяем
  const returned = unique.filter(isReturned);
  const mistakes = unique.filter((item) => !item.isCorrect && !isReturned(item));
  const correct = unique.filter((item) => item.isCorrect);

  /** Слова раздела, которых ещё нет в «Повторении». */
  const notInReview = (items: FlashcardQuestionResult[]) =>
    items.map((item) => item.vocabularyId).filter((id) => !review[id]);

  const renderRow = (item: FlashcardQuestionResult) => {
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
        compact
        trailing={<ResultActions word={toWord(item)} onOpenWord={onOpenWord} />}
      />
    );
  };

  /** Заголовок раздела с «Все в повторение». */
  const reviewSection = (title: string, items: FlashcardQuestionResult[]) => {
    const toAdd = notInReview(items);

    return (
      <View className="gap-2">
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
      <View className="gap-2">
        <Text className="font-nunitoBold text-title text-text">
          {title} · {items.length}
        </Text>
        {items.map(renderRow)}
      </View>
    );

  const returnedSection = returned.length > 0 && (
    <View className="gap-2">
      <View className="gap-1">
        <Text className="font-nunitoBold text-title text-text">
          Вернулись в повторение · {returned.length}
        </Text>
        <Text className="font-nunito text-small text-textSecondary">
          Изученные слова с ошибкой. Если слово знакомо, сними закладку — оно
          останется изученным.
        </Text>
      </View>
      {returned.map(renderRow)}
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
      Закладка — в повторение, значок наборов — в любой набор.
    </Text>
  );

  if (selfCheck) {
    const dont = unique.filter(
      (item) => item.selfCheck === "dont" && !isReturned(item),
    );
    const unsure = unique.filter(
      (item) => item.selfCheck === "unsure" && !isReturned(item),
    );
    const know = unique.filter((item) => item.selfCheck === "know");

    return (
      <View className="gap-6">
        {returnedSection}
        {dont.length === 0 && unsure.length === 0 && returned.length === 0
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
    <View className="gap-6">
      {returnedSection}

      {/* Ошибки или похвала */}
      {mistakes.length > 0
        ? reviewSection("Ошибки", mistakes)
        : returned.length === 0 &&
          praise("Без ошибок!", "Все слова узнаны верно.")}

      {/* Верно */}
      {plainSection("Верно", correct)}

      {footer}
    </View>
  );
}
