import { practiceSets } from "@/content/flashcards/sets";
import { useProgressStore } from "@/store/userProgressStore";
import {
  GameState,
  MasteryBucket,
  SkillProgress,
  WordProgress,
} from "@/types/progress";
import { calculateCoinsEarned } from "@/utils/calculateCoinsEarned";
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
    xp: 0,
  },

  flashcards: {
    sets: {},
    words: {},
  },
  vocabulary: {
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

  const progress = JSON.parse(saved) as GameState;

  return {
    ...createDefaultProgress(),
    ...progress,

    flashcards: {
      ...createDefaultProgress().flashcards,
      ...progress.flashcards,
    },

    vocabulary: {
      ...createDefaultProgress().vocabulary,
      ...progress.vocabulary,
      words: {
        ...createDefaultProgress().vocabulary.words,
        ...progress.vocabulary?.words,
      },
    },
  };
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
    progress.flashcards.sets[setId] = {
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

  // xp начисляется за каждое прохождение, независимо от рекордов
  useProgressStore.getState().addXp(score);
  useProgressStore.getState().addCoins(calculateCoinsEarned(accuracy));

  await saveProgress(progress);

  return progress;
}

function applySkillAnswer(
  skill: SkillProgress,
  isCorrect: boolean,
): SkillProgress {
  if (isCorrect) {
    return {
      ...skill,
      correctAnswers: skill.correctAnswers + 1,
      streak: Math.min(skill.streak + 1, 3),
    };
  }

  // Ошибка. Если навык уже освоен (streak === 3) — не откатываем.
  const nextStreak = skill.streak === 3 ? 3 : Math.max(skill.streak - 1, 0);

  return {
    ...skill,
    incorrectAnswers: skill.incorrectAnswers + 1,
    streak: nextStreak,
  };
}

export async function updateWordProgress({
  wordId,
  skill, // 'reading' | 'writing'
  isCorrect,
}: {
  wordId: string;
  skill: "reading" | "writing";
  isCorrect: boolean;
}) {
  const progress = await loadProgress();
  const previous = progress.flashcards.words[wordId] ?? {
    wordId,
    reading: { streak: 0, correctAnswers: 0, incorrectAnswers: 0 },
    writing: { streak: 0, correctAnswers: 0, incorrectAnswers: 0 },
    lastAnsweredAt: Date.now(),
  };

  const updated: WordProgress = {
    ...previous,
    [skill]: applySkillAnswer(previous[skill], isCorrect),
    lastAnsweredAt: Date.now(),
  };

  progress.flashcards.words[wordId] = updated;
  await saveProgress(progress);

  return updated;
}

export function getMasteryBucket(
  progress: WordProgress | undefined,
  isKnown: boolean,
  requiredSkills: Array<"reading" | "writing"> = ["reading"],
): MasteryBucket {
  if (isKnown) return "learned";
  if (!progress) return "seen";

  const relevantSkills = requiredSkills.map((skill) => progress[skill]);

  if (relevantSkills.every((s) => s.streak === 3)) return "learned";
  if (relevantSkills.some((s) => s.streak > 0)) return "recognizing";
  return "seen";
}

export async function updateVocabularyWordProgress({
  wordId,
  isFavorite,
  isKnown,
}: {
  wordId: string;
  isFavorite?: boolean;
  isKnown?: boolean;
}) {
  const progress = await loadProgress();

  const previous = progress.vocabulary.words[wordId];

  if (!previous) {
    progress.vocabulary.words[wordId] = {
      isFavorite: isFavorite ?? false,
      isKnown: isKnown ?? false,
    };
  } else {
    if (isFavorite !== undefined) {
      previous.isFavorite = isFavorite;
    }

    if (isKnown !== undefined) {
      previous.isKnown = isKnown;
    }
  }

  await saveProgress(progress);

  return progress.vocabulary.words[wordId];
}

export async function toggleFavorite(wordId: string) {
  const progress = await loadProgress();

  const previous = progress.vocabulary.words[wordId];

  const updated = {
    isFavorite: !(previous?.isFavorite ?? false),
    isKnown: previous?.isKnown ?? false,
  };

  progress.vocabulary.words[wordId] = updated;

  await saveProgress(progress);

  return updated;
}
