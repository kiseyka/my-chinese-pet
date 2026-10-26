// src/components/learning/StatusChanges.tsx
//
// Экран итогов: «Перешли в изученные» — слова, которые за тренировку набрали все
// точки (6, у слова без письма — 3) или, уже со всеми точками, ушли из «Повторения»
// после верного ответа или «знаю» в самопроверке. Под заголовком — откуда пришли
// («Из повторения → В изученное · 4»). Отменить — закладка (слово уходит
// в повторение). Справа те же кнопки, что у остальных слов итогов.
//
// «Вернулись в повторение» (ошибка на изученном слове) показывает не этот блок,
// а сами списки итогов — вместо «Ошибок» / «С подсказками», без повторов.
// Изменения — снимок конца тренировки (gameStore.statusChanges): после отмены слово
// остаётся в своём разделе, меняется только закладка (ничего не прыгает).

import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { TransitionLine } from "@/components/learning/TransitionLine";
import { ResultActions } from "@/components/results/ResultActions";
import type { Word } from "@/content/flashcards/types";
import type { StatusChange } from "@/utils/learning";
import { findAnyWords } from "@/utils/wordSource";
import { useMemo } from "react";
import { Text, View } from "react-native";

interface StatusChangesProps {
  changes: StatusChange[];
  onOpenWord: (word: Word) => void;
}

export function StatusChanges({ changes, onOpenWord }: StatusChangesProps) {
  const { words, fromReview, fromLearning } = useMemo(() => {
    const learned = changes.filter((c) => c.after === "learned");
    return {
      words: findAnyWords(learned.map((c) => c.wordId)),
      fromReview: learned.filter((c) => c.before === "review").length,
      fromLearning: learned.filter((c) => c.before === "learning").length,
    };
  }, [changes]);

  if (words.length === 0) return null;

  return (
    <View className="gap-2">
      <View className="gap-1">
        <Text className="font-nunitoBold text-lead text-text">
          Перешли в изученные · {words.length}
        </Text>
        {fromReview > 0 && (
          <TransitionLine
            from="Из повторения"
            to="В изученное"
            count={fromReview}
          />
        )}
        {fromLearning > 0 && (
          <TransitionLine
            from="Набрали все точки"
            to="В изученное"
            count={fromLearning}
          />
        )}
      </View>
      {words.map((word) => (
        <SetWordRow
          key={word.vocabularyId}
          word={word}
          action="open"
          compact
          onPress={() => {}}
          onOpenWord={onOpenWord}
          trailing={<ResultActions word={word} onOpenWord={onOpenWord} />}
        />
      ))}
    </View>
  );
}
