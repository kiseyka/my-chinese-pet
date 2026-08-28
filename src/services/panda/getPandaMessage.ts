// src/services/panda/getPandaMessage.ts
import {
  PRAISE_ENCOURAGE,
  PRAISE_EXCELLENT,
  PRAISE_GOOD,
} from "@/content/panda/praise";
import { TIPS } from "@/content/panda/tips";
import { PandaPhrase } from "@/content/panda/types";

type PandaEvent =
  | { type: "set_completed"; accuracy: number }
  | { type: "word_mastered"; word: { hanzi: string; pinyin: string } }
  | { type: "idle_tip" };

// простая защита от повтора — храним id последней показанной фразы в категории
let lastShownId: string | null = null;

function pickPhrase(pool: PandaPhrase[]): PandaPhrase {
  const options = pool.filter((p) => p.id !== lastShownId || pool.length === 1);
  const chosen = options[Math.floor(Math.random() * options.length)];
  lastShownId = chosen.id;
  return chosen;
}

export function getPandaMessage(event: PandaEvent): PandaPhrase {
  switch (event.type) {
    case "set_completed":
      if (event.accuracy >= 90) return pickPhrase(PRAISE_EXCELLENT);
      if (event.accuracy >= 70) return pickPhrase(PRAISE_GOOD);
      return pickPhrase(PRAISE_ENCOURAGE);

    case "word_mastered":
      // тут можно вернуть фразу с китайской вставкой, ссылаясь на само слово
      return {
        id: `mastered_${event.word.hanzi}`,
        textKey: "panda.praise.wordMastered",
        tone: "warm",
        chinese: event.word,
      };

    case "idle_tip":
      return pickPhrase(TIPS);
  }
}
