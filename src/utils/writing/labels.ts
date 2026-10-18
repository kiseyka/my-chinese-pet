// src/utils/writing/labels.ts
//
// Тексты, которые собираются из чисел: «5 слов», «через 9 ч».

/** 1 слово, 2 слова, 5 слов, 11 слов, 21 слово. */
export function pluralWords(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "слово";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "слова";
  return "слов";
}

/** 1 день, 2 дня, 5 дней, 11 дней, 21 день. */
export function pluralDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

/** «через 9 ч», «через 40 мин» — сколько ждать до экзамена. */
export function formatExamWait(availableAt: number, now: number): string {
  const ms = Math.max(0, availableAt - now);
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `через ${Math.max(1, minutes)} мин`;
  return `через ${Math.ceil(minutes / 60)} ч`;
}
