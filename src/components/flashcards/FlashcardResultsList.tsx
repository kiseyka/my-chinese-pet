// src/components/flashcards/FlashcardResultsList.tsx
//
// Итоги тренировки карточками: два раздела.
//   «Ошибки» — слова, на которые хоть раз ответили неверно. Если ошибок нет —
//   вместо раздела похвала.
//   «Верно» — остальные слова.
// У каждого слова: иероглиф, точки, пиньинь, перевод и две кнопки справа
// (ResultActions): закладка — «Повторение», значок наборов — панель слова.
// Разделы свёрнуты (CollapsibleSection): выше них на экране итогов —
// «Перешли в изученные» и «Вернулись в повторение»; слово может быть и там, и здесь.
// Тап по самому слову открывает ту же панель.
//
// Самопроверка (selfCheck): разделы «Не знаю», «Сомневаюсь» и «Знаю».

import type { WordLevel } from "@/components/ui/LevelDots";
import type { Word } from "@/content/flashcards/types";
import type { FlashcardQuestionResult } from "@/store/gameStore";
import { getWordLevel, useWordProgressStore } from "@/store/wordProgressStore";
import { Text, View } from "react-native";
import { CollapsibleSection } from "@/components/results/CollapsibleSection";
import { ResultActions } from "@/components/results/ResultActions";
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

  const plainSection = (title: string, items: FlashcardQuestionResult[]) =>
    items.length > 0 && (
      <CollapsibleSection title={title} count={items.length}>
        {items.map(renderRow)}
      </CollapsibleSection>
    );

  const praise = (title: string, text: string) => (
    <View className="items-center gap-1 rounded-2xl bg-surface px-5 py-5">
      <Text className="font-nunitoBold text-lead text-primary">{title}</Text>
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
    const dont = unique.filter((item) => item.selfCheck === "dont");
    const unsure = unique.filter((item) => item.selfCheck === "unsure");
    const know = unique.filter((item) => item.selfCheck === "know");

    return (
      <View className="gap-4">
        {dont.length === 0 && unsure.length === 0
          ? praise("Всё знакомо!", "Ни одного сомнения.")
          : null}
        {dont.length > 0 && plainSection("Не знаю", dont)}
        {unsure.length > 0 && plainSection("Сомневаюсь", unsure)}
        {plainSection("Знаю", know)}
        {footer}
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Ошибки или похвала */}
      {mistakes.length > 0
        ? plainSection("Ошибки", mistakes)
        : praise("Без ошибок!", "Все слова узнаны верно.")}

      {/* Верно */}
      {plainSection("Верно", correct)}

      {footer}
    </View>
  );
}
