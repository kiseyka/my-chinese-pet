// src/hooks/useLearnedBackfill.ts
//
// Один раз заполняет «Изученное» словами, у которых уже были все 3 точки
// (до того, как появилось «Изученное»). Слова из «Повторения» остаются там.
// Ждёт, пока стор загрузится с диска: иначе загрузка затёрла бы запись.

import { useWordProgressStore } from "@/store/wordProgressStore";
import { whenHydrated } from "@/utils/hydration";
import { findWordsWithAllDots } from "@/utils/learning";
import { useEffect } from "react";

export function useLearnedBackfill() {
  useEffect(
    () =>
      whenHydrated(useWordProgressStore.persist, () => {
        const store = useWordProgressStore.getState();
        if (store.learnedBackfilled) return;
        store.backfillLearned(findWordsWithAllDots(store.flashcardWords));
      }),
    [],
  );
}
