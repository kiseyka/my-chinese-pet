import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

function getLevelFromXp(xp: number): number {
  // простая формула для старта, потом легко заменить
  return Math.floor(xp / 100) + 1;
}

interface UserProgressState {
  xp: number;
  coins: number;
  level: number;

  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
}

export const useProgressStore = create<UserProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      coins: 0,
      level: 1,

      addXp: (amount) =>
        set((state) => {
          const xp = state.xp + amount;
          return { xp, level: getLevelFromXp(xp) };
        }),

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      // Списывает монеты, если хватает. Возвращает true при успехе,
      // false — если монет недостаточно (ничего не списывает).
      // Проверка внутри store, а не снаружи через coins < price —
      // так нет гонки между чтением coins в UI и вызовом set().
      spendCoins: (amount) => {
        const currentCoins = get().coins;
        if (currentCoins < amount) {
          return false;
        }
        set({ coins: currentCoins - amount });
        return true;
      },
    }),
    {
      name: "user_progress",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
const XP_PER_TRAINING = 10;

const LEVEL_BRACKETS = [
  { maxLevel: 30, trainingsPerLevel: 5 },
  { maxLevel: 60, trainingsPerLevel: 8 },
  { maxLevel: 100, trainingsPerLevel: 10 },
  { maxLevel: 150, trainingsPerLevel: 15 },
];

// Возвращает { level, xpIntoLevel, xpForNextLevel }
export function getLevelInfo(xp: number) {
  let remainingXp = xp;
  let level = 1;

  for (const bracket of LEVEL_BRACKETS) {
    const xpPerLevelInBracket = bracket.trainingsPerLevel * XP_PER_TRAINING;

    while (level < bracket.maxLevel) {
      if (remainingXp < xpPerLevelInBracket) {
        return {
          level,
          xpIntoLevel: remainingXp,
          xpForNextLevel: xpPerLevelInBracket,
        };
      }
      remainingXp -= xpPerLevelInBracket;
      level += 1;
    }
  }

  // после Lv150 — потолок, просто копим дальше на последнем шаге
  const lastStep =
    LEVEL_BRACKETS[LEVEL_BRACKETS.length - 1].trainingsPerLevel *
    XP_PER_TRAINING;
  return {
    level,
    xpIntoLevel: remainingXp % lastStep,
    xpForNextLevel: lastStep,
  };
}
