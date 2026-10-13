// src/components/flashcards/StepsTab.tsx
//
// Вкладка «Ступени» на экране карточек.
// Все разделы HSK открыты сразу (узнавать слова проще, чем писать, блокировка
// тут скорее мешает). Сначала развёрнут текущий раздел — первый, где есть
// неосвоенные слова, — и в нём текущая ступень.
// В развёрнутой ступени — слова с точками чтения и кнопка «Тренировать ступень».

import { SectionHeader } from "@/components/ui/SectionHeader";
import { StepCard } from "@/components/writing/home/StepCard";
import type { Word } from "@/content/flashcards/types";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  describeReadingLevel,
  getReadingDots,
  getReadingLevels,
  getReadingSteps,
  type ReadingLevel,
} from "@/utils/flashcards/steps";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StepWordRow } from "./StepWordRow";

interface StepsTabProps {
  onStartStep: (level: ReadingLevel, index: number) => void;
}

interface StepInfo {
  words: Word[];
  dots: Array<0 | 1 | 2 | 3>;
  learned: number;
}

interface LevelInfo {
  level: ReadingLevel;
  steps: StepInfo[];
  learned: number;
  total: number;
}

const levelKey = (level: ReadingLevel) => `level-${level}`;
const stepKey = (level: ReadingLevel, index: number) =>
  `step-${level}-${index}`;

export function StepsTab({ onStartStep }: StepsTabProps) {
  const flashcardWords = useWordProgressStore((state) => state.flashcardWords);
  const vocabularyWords = useWordProgressStore(
    (state) => state.vocabularyWords,
  );

  const levels = useMemo<LevelInfo[]>(() => {
    const knownIds = new Set(
      Object.entries(vocabularyWords)
        .filter(([, value]) => value.isKnown)
        .map(([id]) => id),
    );

    return getReadingLevels().map((level) => {
      const steps = getReadingSteps(level).map((words) => {
        const dots = words.map((word) =>
          getReadingDots(word, flashcardWords, knownIds),
        );
        return {
          words,
          dots,
          learned: dots.filter((dot) => dot === 3).length,
        };
      });

      return {
        level,
        steps,
        learned: steps.reduce((sum, step) => sum + step.learned, 0),
        total: steps.reduce((sum, step) => sum + step.words.length, 0),
      };
    });
  }, [flashcardWords, vocabularyWords]);

  // Развёрнутые блоки. Сначала — текущий раздел и его текущая ступень
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const current =
      levels.find((info) => info.learned < info.total) ?? levels[0];
    if (!current) return new Set();

    const stepIndex = Math.max(
      current.steps.findIndex((step) => step.learned < step.words.length),
      0,
    );
    return new Set([levelKey(current.level), stepKey(current.level, stepIndex)]);
  });

  const toggle = (key: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <View className="gap-3">
      {levels.map(({ level, steps, learned, total }) => {
        const isOpen = expanded.has(levelKey(level));

        return (
          <View key={level} className="gap-3">
            <SectionHeader
              title={describeReadingLevel(level)}
              subtitle={`${learned}/${total}`}
              expanded={isOpen}
              onPress={() => toggle(levelKey(level))}
            />

            {isOpen &&
              steps.map((step, index) => {
                const key = stepKey(level, index);

                return (
                  <StepCard
                    key={key}
                    title={`Ступень ${index + 1}`}
                    learned={step.learned}
                    total={step.words.length}
                    expanded={expanded.has(key)}
                    onToggle={() => toggle(key)}
                  >
                    <View className="gap-1">
                      {step.words.map((word, wordIndex) => (
                        <StepWordRow
                          key={word.id}
                          word={word}
                          level={step.dots[wordIndex]}
                        />
                      ))}
                    </View>

                    <Pressable
                      onPress={() => onStartStep(level, index)}
                      className="mt-3 min-h-12 items-center justify-center rounded-2xl bg-primary px-5 py-3 active:opacity-80"
                      accessibilityRole="button"
                    >
                      <Text className="font-nunitoBold text-body text-white">
                        Тренировать ступень
                      </Text>
                    </Pressable>
                  </StepCard>
                );
              })}
          </View>
        );
      })}
    </View>
  );
}
