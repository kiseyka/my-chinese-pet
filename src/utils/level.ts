// utils/level.ts

const BASE_XP = 100;
const GROWTH = 1.35; // насколько каждый следующий уровень "дороже" предыдущего

export function xpForLevel(level: number) {
  return Math.round(BASE_XP * Math.pow(GROWTH, level - 1));
}

export function getLevelProgress(totalXp: number) {
  let level = 1;
  let remaining = totalXp;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: xpForLevel(level),
    progress: remaining / xpForLevel(level),
  };
}
