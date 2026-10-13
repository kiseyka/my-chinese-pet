// src/components/writing/ExamModal.tsx
//
// Окно перед экзаменом по письму: сетка слов, готовых к экзамену (по умолчанию выбраны все,
// тап убирает слово — оно остаётся в очереди), правила в тултипе, блок «Скоро»
// со словами, у которых ещё не прошли сутки, и кнопка «Начать».
//
// Панель, анимации и свайп — в BottomSheet.

import InfoIcon from "@/assets/images/icons/info.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Word } from "@/content/flashcards/types";
import { cssInterop } from "nativewind";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SealMark } from "./SealMark";

cssInterop(InfoIcon, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

const RULES_HINT =
  "Пишешь по памяти: видно только пиньинь и перевод, без контура и подсказок. На слово можно ошибиться один раз. Сдал — слово отмечается галочкой. Не сдал — пересдать можно через сутки; после второго провала подряд слово теряет одну точку.";

/** «через 9 ч», «через 40 мин» — сколько ждать до экзамена. */
export function formatExamWait(availableAt: number, now: number): string {
  const ms = Math.max(0, availableAt - now);
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `через ${Math.max(1, minutes)} мин`;
  return `через ${Math.ceil(minutes / 60)} ч`;
}

export interface UpcomingExamWord {
  word: Word;
  availableAt: number;
}

interface ExamModalProps {
  open: boolean;
  /** Слова, готовые к экзамену. */
  ready: Word[];
  /** Слова с тремя точками, у которых ещё не прошли сутки. */
  upcoming: UpcomingExamWord[];
  now: number;
  onStart: (words: Word[]) => void;
  onClose: () => void;
}

interface SheetItem {
  ready: Word[];
  upcoming: UpcomingExamWord[];
}

export function ExamModal({
  open,
  ready,
  upcoming,
  now,
  onStart,
  onClose,
}: ExamModalProps) {
  // Храним снятые слова: по умолчанию выбраны все
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [showRules, setShowRules] = useState(false);

  // ready/upcoming в родителе мемоизированы, так что item стабилен, пока окно открыто
  const item = useMemo<SheetItem | null>(
    () => (open ? { ready, upcoming } : null),
    [open, ready, upcoming],
  );

  const toggleWord = (id: string) =>
    setExcluded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <BottomSheet
      item={item}
      onClose={onClose}
      onOpen={() => {
        setExcluded(new Set());
        setShowRules(false);
      }}
      onBackgroundTap={() => setShowRules(false)}
    >
      {({ ready: words, upcoming: soon }) => {
        const chosen = words.filter((w) => !excluded.has(w.vocabularyId));
        const allChosen = chosen.length === words.length;

        return (
          <>
            {/* Шапка */}
            <View className="items-center gap-2">
              <SealMark size={44} />
              <Text className="font-nunitoBold text-title text-text">
                Экзамен
              </Text>
              <Text className="text-center font-nunito text-small text-text opacity-70">
                Нажми на слово, чтобы убрать его из экзамена — оно останется в
                очереди.
              </Text>
            </View>

            {/* Правила */}
            <View className="mt-3 self-center">
              <Tooltip
                visible={showRules}
                onClose={() => setShowRules(false)}
                text={RULES_HINT}
              >
                <Pressable
                  onPress={() => setShowRules((value) => !value)}
                  className="flex-row items-center gap-2 rounded-full bg-surface px-4 py-2 active:opacity-70"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showRules }}
                >
                  <Text className="font-nunito text-small text-text">
                    Правила
                  </Text>
                  <InfoIcon width={18} height={18} className="text-text" />
                </Pressable>
              </Tooltip>
            </View>

            {/* Готовые слова */}
            <View className="mt-5 flex-row items-baseline justify-between">
              <Text className="font-nunitoBold text-lead text-text">
                Готовы к экзамену
              </Text>
              {words.length > 1 && (
                <Pressable
                  onPress={() =>
                    setExcluded(
                      allChosen
                        ? new Set(words.map((w) => w.vocabularyId))
                        : new Set(),
                    )
                  }
                  hitSlop={8}
                  className="active:opacity-60"
                >
                  <Text className="font-nunito text-small text-primary">
                    {allChosen ? "Снять все" : "Выбрать все"}
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {words.map((word) => {
                const isChosen = !excluded.has(word.vocabularyId);

                return (
                  <Pressable
                    key={word.vocabularyId}
                    onPress={() => toggleWord(word.vocabularyId)}
                    style={{ minWidth: 64 }}
                    className={`items-center gap-0.5 rounded-2xl border-2 px-3 py-2 active:opacity-70 ${
                      isChosen
                        ? "border-primary bg-primary/20"
                        : "border-transparent bg-surface opacity-50"
                    }`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChosen }}
                  >
                    <Hanzi size={28}>{word.hanzi}</Hanzi>
                    <Pinyin size="sm">{word.pinyin || " "}</Pinyin>
                  </Pressable>
                );
              })}
            </View>

            {/* Скоро: ещё не прошли сутки */}
            {soon.length > 0 && (
              <View className="mt-5 gap-2 opacity-60">
                <Text className="font-nunitoBold text-small text-text">
                  Скоро
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {soon.map(({ word, availableAt }) => (
                    <View
                      key={word.vocabularyId}
                      className="flex-row items-center gap-2 rounded-full bg-surface px-3 py-1"
                    >
                      <Hanzi size={18}>{word.hanzi}</Hanzi>
                      <Text className="font-nunito text-caption text-text">
                        {formatExamWait(availableAt, now)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Старт */}
            <Pressable
              onPress={() => chosen.length > 0 && onStart(chosen)}
              disabled={chosen.length === 0}
              className={`mt-6 min-h-14 items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80 ${
                chosen.length === 0 ? "opacity-40" : ""
              }`}
              accessibilityRole="button"
              accessibilityState={{ disabled: chosen.length === 0 }}
            >
              <Text className="font-nunitoBold text-body text-white">
                {chosen.length === 0
                  ? "Выбери хотя бы одно слово"
                  : `Начать экзамен · ${chosen.length}`}
              </Text>
            </Pressable>
          </>
        );
      }}
    </BottomSheet>
  );
}
