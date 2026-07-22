import { practiceSets } from "@/content/flashcards/sets";
import { GameState, WordProgress } from "@/types/progress";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CompleteFlashcardSetParams {
  setId: string;

  score: number;
  totalQuestions: number;

  duration: number;
}

const STORAGE_KEY = "game_progress";

const createDefaultProgress = (): GameState => ({
  user: {
    level: 1,
    xp: 0,
  },

  flashcards: {
    sets: {},
    words: {},
  },
});

export async function saveProgress(progress: GameState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function loadProgress(): Promise<GameState> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return createDefaultProgress();
  }

  return JSON.parse(saved);
}

export async function resetProgress() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function completeFlashcardSet({
  setId,
  score,
  totalQuestions,
  duration,
}: CompleteFlashcardSetParams) {
  const progress = await loadProgress();

  const practiceSet = practiceSets.find((set) => set.id === setId);

  if (!practiceSet) {
    throw new Error(`Practice Set not found: ${setId}`);
  }

  const accuracy =
    totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100);

  const previous = progress.flashcards.sets[setId];

  if (!previous) {
    // Первый раз прошёл сет
    progress.flashcards.sets[setId] = {
      bestScore: score,
      totalQuestions,
      accuracy,
      bestTime: duration,
      completedAt: Date.now(),
    };

    // XP начисляем только за первое прохождение
    progress.user.xp += practiceSet.xpReward;
  } else {
    // Повторное прохождение
    previous.bestScore = Math.max(previous.bestScore, score);
    previous.accuracy = Math.max(previous.accuracy, accuracy);

    if (duration < previous.bestTime) {
      previous.bestTime = duration;
    }

    previous.completedAt = Date.now();
  }

  await saveProgress(progress);

  return progress;
}

export async function updateWordProgress({
  wordId,
  isCorrect,
}: {
  wordId: string;
  isCorrect: boolean;
}) {
  const progress = await loadProgress();

  const previous = progress.flashcards.words[wordId];

  if (!previous) {
    progress.flashcards.words[wordId] = {
      wordId,
      correctAnswers: isCorrect ? 1 : 0,
      incorrectAnswers: isCorrect ? 0 : 1,
      mastery: isCorrect ? 1 : 0,
      lastAnsweredAt: Date.now(),
    };
  } else {
    if (isCorrect) {
      previous.correctAnswers += 1;
      previous.mastery = Math.min(
        previous.mastery + 1,
        5,
      ) as WordProgress["mastery"];
    } else {
      previous.incorrectAnswers += 1;
      previous.mastery = Math.max(
        previous.mastery - 1,
        0,
      ) as WordProgress["mastery"];
    }

    previous.lastAnsweredAt = Date.now();
  }

  await saveProgress(progress);

  return progress.flashcards.words[wordId];
}
