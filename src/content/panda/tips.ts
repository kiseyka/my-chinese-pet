// src/content/panda/praise.ts
import { PandaPhrase } from "./types";

// Высокий результат (accuracy >= 90%)
export const TIPS: PandaPhrase[] = [
  {
    id: "praise_excellent_1",
    textKey: "praise.excellent1",
    tone: "warm",
  },
  {
    id: "praise_excellent_2",
    textKey: "praise.excellent2",
    tone: "playful",
  },
];

// Хороший результат (accuracy 70-89%)
export const PRAISE_GOOD: PandaPhrase[] = [
  { id: "praise_good_1", textKey: "panda.praise.good1", tone: "warm" },
];

// Есть над чем поработать (accuracy < 70%) — не ругаем, но и не изображаем восторг
export const PRAISE_ENCOURAGE: PandaPhrase[] = [
  {
    id: "praise_encourage_1",
    textKey: "panda.praise.encourage1",
    tone: "calm",
  },
];
