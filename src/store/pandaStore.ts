// src/store/pandaStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PandaNews } from "@/utils/panda/news";
import type { MilestoneSnapshot } from "@/utils/panda/milestones";
import type { PandaThought } from "@/utils/panda/thoughts";
import type { FlashcardQuestionResult } from "./gameStore";
import type { WordLevel } from "./wordProgressStore";

/** Что случилось со словом за тренировку (первый уровень «до», последний «после»). */
export interface WordChange {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  levelBefore: WordLevel;
  levelAfter: WordLevel;
  /** Правильность последнего ответа на это слово. */
  isCorrect: boolean;
}

export interface PandaTrainingResult {
  type: "flashcards_completed" | "writing_completed";

  score: number;
  total: number;

  results: FlashcardQuestionResult[];
  wordChanges: WordChange[];
}

const RECENT_WORDS_LIMIT = 6;
/** Сколько последних слов загадок помнить, чтобы не загадывать одно и то же. */
const RECENT_RIDDLES_LIMIT = 8;

/** Фраза в коллекции профиля («Фразы дня»). */
export interface CollectedPhrase {
  phraseId: string;
  at: number;
}

interface PandaState {
  /**
   * Привязанность: только растёт, никогда не уменьшается и не упирается в потолок
   * (позже — уровни дружбы, как уровни опыта). Сохраняется.
   */
  bond: number;

  /** Последние слова, которые панда уже упоминала (защита от повторов). Сохраняется. */
  recentWordIds: string[];

  /**
   * Сколько тренировок прошло с последнего диалога с кнопками выбора.
   * Выбор разрешён, когда значение >= 1 (то есть не чаще раза в две тренировки).
   * Сохраняется. Начальное значение 1: первый диалог может быть с выбором.
   */
  trainingsSinceChoice: number;

  /**
   * Вехи, которые панда уже отметила (этапы, разделы HSK, изученные слова).
   * null — снимок ещё не сделан. Сохраняется. См. utils/panda/milestones.
   */
  milestones: MilestoneSnapshot | null;

  /**
   * Новости, которые панда расскажет по тапу (вехи пути, экзамены).
   * Копятся, пока пользователь их не прочитал. Сохраняется. См. utils/panda/news.
   */
  news: PandaNews[];

  /**
   * Фраза дня — облачко «…» над головой. Одна в день; висит, пока пользователь
   * не тапнет и не дочитает. Сохраняется. См. utils/panda/thoughts.
   */
  thought: PandaThought | null;
  /** Когда появилась последняя фраза дня. */
  lastThoughtAt: number;
  /** Какие облачка были сегодня (фраза дня — есть "phrase"). */
  thoughtsToday: { day: string; kinds: PandaThought["kind"][] };
  /**
   * Комната, какой панда её видела в прошлый раз (строка из предметов). Поменялась —
   * фраза о комнате. null — ещё не видела. См. utils/panda/thoughts.
   */
  roomSeen: string | null;
  /** Фразы, которые панда уже рассказала (новых нет — фраз не предлагает). */
  seenPhraseIds: string[];
  /** Коллекция «Фразы дня» в профиле, новые в конце. */
  collectedPhrases: CollectedPhrase[];
  /** Последние слова загадок. */
  recentRiddleWordIds: string[];
  /** Последние показанные фразы (даже если их не дочитали) — не повторять подряд. */
  recentPhraseIds: string[];
  /**
   * Ответы на вопросы панды: id фразы → id ответа («what-color» → «green»).
   * По ним открываются фразы с requires — панда помнит, что ей сказали.
   */
  answers: Record<string, string>;
  /**
   * Когда были игры по тапу на панду (без облачка) — для лимита игр.
   * Хранятся только за последние сутки. См. utils/panda/play.
   */
  playTimes: number[];

  /** Результат последней тренировки, который панда ещё не прокомментировала. Не сохраняется. */
  pendingTrainingResult: PandaTrainingResult | null;
}

interface PandaActions {
  increaseBond: (amount: number) => void;
  rememberWord: (wordId: string) => void;
  /** Вызывается после каждой тренировки: hadChoices — был ли диалог с кнопками. */
  registerTraining: (hadChoices: boolean) => void;
  setPendingTrainingResult: (result: PandaTrainingResult) => void;
  setMilestones: (snapshot: MilestoneSnapshot) => void;
  addNews: (items: PandaNews[]) => void;
  clearNews: () => void;
  clearPendingTrainingResult: () => void;
  /** Появилась фраза дня: облачко над головой. day — сегодняшний день. */
  showThought: (thought: PandaThought, day: string) => void;
  /** Фраза дня прочитана: облачко убрать, привязанность +1. */
  resolveThought: () => void;
  /**
   * Фраза рассказана: больше не предлагать и положить в коллекцию профиля.
   * replyId — что пользователь ответил, если это был вопрос.
   */
  collectPhrase: (phraseId: string, replyId?: string) => void;
  /** Сыграли по тапу: запомнить время, слово, привязанность +1. */
  recordPlay: (wordId: string, now: number) => void;
}

type PandaStore = PandaState & PandaActions;

/** Сколько последних фраз не предлагать снова. */
export const RECENT_PHRASES_LIMIT = 5;

export function rememberPhrase(recent: string[], phraseId: string): string[] {
  return [phraseId, ...recent.filter((id) => id !== phraseId)].slice(
    0,
    RECENT_PHRASES_LIMIT,
  );
}

export const usePandaStore = create<PandaStore>()(
  persist(
    (set) => ({
      bond: 0,
      recentWordIds: [],
      trainingsSinceChoice: 1,
      milestones: null,
      news: [],
      pendingTrainingResult: null,
      thought: null,
      lastThoughtAt: 0,
      thoughtsToday: { day: "", kinds: [] },
      roomSeen: null,
      seenPhraseIds: [],
      collectedPhrases: [],
      recentRiddleWordIds: [],
      recentPhraseIds: [],
      answers: {},
      playTimes: [],

      increaseBond: (amount) =>
        set((state) => ({
          bond: state.bond + Math.max(0, amount),
        })),

      rememberWord: (wordId) =>
        set((state) => ({
          recentWordIds: [
            wordId,
            ...state.recentWordIds.filter((id) => id !== wordId),
          ].slice(0, RECENT_WORDS_LIMIT),
        })),

      registerTraining: (hadChoices) =>
        set((state) => ({
          trainingsSinceChoice: hadChoices ? 0 : state.trainingsSinceChoice + 1,
        })),

      setPendingTrainingResult: (result) =>
        set({ pendingTrainingResult: result }),

      clearPendingTrainingResult: () => set({ pendingTrainingResult: null }),

      setMilestones: (snapshot) => set({ milestones: snapshot }),

      addNews: (items) =>
        set((state) =>
          items.length === 0 ? state : { news: [...state.news, ...items] },
        ),

      clearNews: () => set({ news: [] }),

      showThought: (thought, day) =>
        set((state) => {
          const kinds =
            state.thoughtsToday.day === day ? state.thoughtsToday.kinds : [];
          return {
            thought,
            lastThoughtAt: thought.createdAt,
            thoughtsToday: { day, kinds: [...kinds, thought.kind] },
            recentPhraseIds: rememberPhrase(
              state.recentPhraseIds,
              thought.phraseId,
            ),
          };
        }),

      resolveThought: () =>
        set((state) =>
          state.thought ? { thought: null, bond: state.bond + 1 } : state,
        ),

      recordPlay: (wordId, now) =>
        set((state) => ({
          playTimes: [
            ...state.playTimes.filter((time) => now - time < 24 * 60 * 60 * 1000),
            now,
          ],
          recentRiddleWordIds: [
            wordId,
            ...state.recentRiddleWordIds.filter((id) => id !== wordId),
          ].slice(0, RECENT_RIDDLES_LIMIT),
          bond: state.bond + 1,
        })),

      collectPhrase: (phraseId, replyId) =>
        set((state) => ({
          answers: replyId
            ? { ...state.answers, [phraseId]: replyId }
            : state.answers,
          seenPhraseIds: state.seenPhraseIds.includes(phraseId)
            ? state.seenPhraseIds
            : [...state.seenPhraseIds, phraseId],
          collectedPhrases: state.collectedPhrases.some(
            (item) => item.phraseId === phraseId,
          )
            ? state.collectedPhrases
            : [...state.collectedPhrases, { phraseId, at: Date.now() }],
        })),
    }),
    {
      name: "panda-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bond: state.bond,
        recentWordIds: state.recentWordIds,
        trainingsSinceChoice: state.trainingsSinceChoice,
        milestones: state.milestones,
        news: state.news,
        thought: state.thought,
        lastThoughtAt: state.lastThoughtAt,
        thoughtsToday: state.thoughtsToday,
        roomSeen: state.roomSeen,
        seenPhraseIds: state.seenPhraseIds,
        collectedPhrases: state.collectedPhrases,
        recentRiddleWordIds: state.recentRiddleWordIds,
        recentPhraseIds: state.recentPhraseIds,
        answers: state.answers,
        playTimes: state.playTimes,
      }),
    },
  ),
);
