// src/components/writing/modals/SetsModal.tsx
//
// «Мои наборы» в «Написании». Наборы те же, что в карточках (customSetsStore):
// набор — просто список слов, тренировать его можно и карточками, и письмом.
// Писать можно не все слова: только до 2 иероглифов и с данными о чертах.
//
//   WritingSetsTab — вкладка: карточки наборов («Открыть» и «Тренировать»);
//   SetSheet — панель набора: сетка слов для письма (рисует экран через renderGrid —
//   с теми же точками, рамками и печатями) и «Тренировать письмо».

import { BottomSheet } from "@/components/ui/BottomSheet";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Word } from "@/content/flashcards/types";
import type { CustomSet } from "@/store/customSetsStore";
import { pluralWords } from "@/utils/writing/labels";
import { SET_LESSON_SIZE } from "@/utils/writing/plans";
import { LEARNED_DOTS, findPracticeWords } from "@/utils/writing/words";
import { useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

// ── Вкладка ──────────────────────────────────────────────────────────────────

interface WritingSetsTabProps {
  sets: CustomSet[];
  /** Точки письма слова (0–3). */
  getLevel: (word: Word) => number;
  onOpen: (setId: string) => void;
  onStart: (setId: string) => void;
  /** Перейти к наборам в карточках (там их создают и меняют). */
  onManage: () => void;
}

export function WritingSetsTab({
  sets,
  getLevel,
  onOpen,
  onStart,
  onManage,
}: WritingSetsTabProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
    >
      {sets.length === 0 && (
        <View className="gap-2 rounded-2xl bg-surface p-5">
          <Text className="font-nunitoBold text-lead text-text">
            Здесь будут твои наборы
          </Text>
          <Text className="font-nunito text-body text-text">
            Наборы общие с карточками: собери набор там — и его можно будет
            тренировать и карточками, и письмом.
          </Text>
        </View>
      )}

      {sets.map((set) => {
        const words = findPracticeWords(set.wordIds);
        const learned = words.filter(
          (word) => getLevel(word) >= LEARNED_DOTS,
        ).length;
        const canTrain = words.length > 0;

        return (
          <View key={set.id} className="gap-3 rounded-2xl bg-surface p-5">
            <Pressable
              onPress={() => onOpen(set.id)}
              className="gap-3 active:opacity-70"
              accessibilityRole="button"
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text
                  numberOfLines={1}
                  className="flex-1 font-nunitoBold text-lead text-text"
                >
                  {set.title}
                </Text>
                <Text className="font-nunito text-small text-textSecondary">
                  {canTrain
                    ? `${learned} из ${words.length} ${pluralWords(words.length)}`
                    : "нет слов для письма"}
                </Text>
              </View>
              <ProgressBar
                progress={canTrain ? (learned / words.length) * 100 : 0}
              />
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => onOpen(set.id)}
                className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-primary px-4 active:bg-primary/10"
                accessibilityRole="button"
              >
                <Text className="font-nunitoBold text-body text-primary">
                  Открыть
                </Text>
              </Pressable>
              {canTrain ? (
                <Pressable
                  onPress={() => onStart(set.id)}
                  className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-primary px-4 active:opacity-80"
                  accessibilityRole="button"
                >
                  <Text className="font-nunitoBold text-body text-white">
                    Тренировать
                  </Text>
                </Pressable>
              ) : (
                <View className="min-h-12 flex-1 items-center justify-center px-2">
                  <Text className="text-center font-nunito text-small text-textSecondary">
                    слова длиннее 2 иероглифов
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <Pressable
        onPress={onManage}
        className="min-h-14 items-center justify-center rounded-2xl border border-dashed border-primary px-5 py-4 active:opacity-70"
        accessibilityRole="button"
      >
        <Text className="font-nunitoBold text-body text-primary">
          Собрать или изменить набор
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Панель набора ────────────────────────────────────────────────────────────

interface SetSheetProps {
  /** Открытый набор; null — панель закрыта. */
  set: CustomSet | null;
  /** Сетка слов набора (та же, что на экране). */
  renderGrid: (words: Word[]) => ReactNode;
  onStart: (setId: string) => void;
  onClose: () => void;
}

export function SetSheet({ set, renderGrid, onStart, onClose }: SetSheetProps) {
  const item = useMemo(() => set, [set]);

  return (
    <BottomSheet item={item} onClose={onClose}>
      {(shown) => {
        const words = findPracticeWords(shown.wordIds);
        const skipped = shown.wordIds.length - words.length;
        const inLesson = Math.min(SET_LESSON_SIZE, words.length);

        return (
          <>
            <Text className="font-nunitoBold text-title text-text">
              {shown.title}
            </Text>

            {skipped > 0 && (
              <Text className="mt-2 font-nunito text-small text-text opacity-70">
                {skipped} {pluralWords(skipped)} из набора пока нельзя писать:
                только слова до двух иероглифов.
              </Text>
            )}

            {words.length > 0 ? (
              <>
                <View className="mt-5">{renderGrid(words)}</View>

                <View className="mt-6 gap-2">
                  <Text className="text-center font-nunito text-small text-textSecondary">
                    {words.length > SET_LESSON_SIZE
                      ? `В тренировку попадут ${inLesson} ${pluralWords(inLesson)} из ${words.length}: те, что давно не писались`
                      : `В тренировку попадут все ${words.length} ${pluralWords(words.length)}`}
                  </Text>
                  <Pressable
                    onPress={() => onStart(shown.id)}
                    className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 py-4 active:opacity-80"
                    accessibilityRole="button"
                  >
                    <Text className="font-nunitoBold text-body text-white">
                      Тренировать письмо
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text className="mt-6 text-center font-nunito text-body text-text">
                В этом наборе нет слов, которые можно писать.
              </Text>
            )}
          </>
        );
      }}
    </BottomSheet>
  );
}
