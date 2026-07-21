import { levels } from "@/content/flashcards/levels";
import { GameState } from "@/types/progress";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CompleteFlashcardLevelParams {
  levelId: string;

  score: number;
  totalQuestions: number;

  duration: number;
}

const STORAGE_KEY = "game_progress";

const createDefaultProgress = (): GameState => ({
  user: {
    level: 1,
    xp: 0,
    learnedWords: [],
  },

  flashcards: {
    levels: {},
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

export async function completeFlashcardLevel({
  levelId,
  score,
  totalQuestions,
  duration,
}: CompleteFlashcardLevelParams) {
  const progress = await loadProgress();
  const level = levels.find((l) => l.id === levelId);
  // 🛡️ защита структуры
  if (!progress.flashcards) {
    progress.flashcards = { levels: {} };
  }

  if (!progress.flashcards.levels) {
    progress.flashcards.levels = {};
  }

  const accuracy = Math.round((score / totalQuestions) * 100);

  const previous = progress.flashcards.levels[levelId];

  if (!previous) {
    if (level) {
      progress.user.xp += level.xpReward;
    }

    progress.flashcards.levels[levelId] = {
      bestScore: score,
      totalQuestions,
      accuracy,
      bestTime: duration,
      completedAt: Date.now(),
    };
  } else {
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
