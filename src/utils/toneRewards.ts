export function calculateToneXp(accuracy: number): number {
  if (accuracy > 90) return 10;
  if (accuracy >= 70) return 8;
  if (accuracy >= 50) return 7;
  return 5;
}

export function calculateToneCoinsEarned(accuracy: number): number {
  if (accuracy >= 100) return 7;
  if (accuracy >= 80) return 6; // ← между 80 и 99% ты явно не указала, поставила 6 по прогрессии 3-4-5-6-7. Поправь, если не так.
  if (accuracy >= 70) return 5;
  if (accuracy >= 50) return 4;
  return 3;
}
