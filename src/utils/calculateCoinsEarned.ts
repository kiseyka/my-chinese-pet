// src/utils/calculateCoinsEarned.ts

export function calculateCoinsEarned(accuracyPercent: number): number {
  if (accuracyPercent >= 100) return 5;
  if (accuracyPercent >= 75) return 4;
  if (accuracyPercent >= 50) return 3;
  return 2;
}
