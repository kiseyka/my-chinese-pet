// src/utils/panda/phraseTime.ts
//
// Подходит ли фраза панды к текущему моменту (поле when в content/panda/thoughtPhrases):
// «доброе утро» — только утром, «пошёл снег» — только зимой. Время — по часам телефона.

import type {
  PandaPhrase,
  Season,
  TimeOfDay,
} from "@/content/panda/thoughtPhrases";

/** morning 5–11, day 11–17, evening 17–22, night 22–5. */
export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** Северное полушарие: зима — декабрь–февраль. */
export function season(date: Date): Season {
  const month = date.getMonth(); // 0 — январь
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

export function fitsNow(phrase: PandaPhrase, now = Date.now()): boolean {
  const { when } = phrase;
  if (!when) return true;
  const date = new Date(now);
  if (when.time && !when.time.includes(timeOfDay(date))) return false;
  if (when.season && !when.season.includes(season(date))) return false;
  return true;
}
