// src/components/writing/modals/SetsModal.tsx
//
// «Мои наборы» в «Написании». Наборы те же, что в карточках (customSetsStore):
// набор — просто список слов, а тренировать его можно и карточками, и письмом.
//
// Вход — карточка SetsEntryCard на экране «Написание» (как «Повторение»).
// Панель в два шага:
//   1) список наборов: название, сколько слов можно писать и сколько изучено;
//   2) набор: сетка слов для письма (рисует экран через renderGrid — с теми же
//      точками, рамками и печатями) и «Тренировать».
// Писать можно не все слова: только до 2 иероглифов и с данными о чертах.

import SetsIcon from "@/assets/images/icons/book-open.svg";
import ArrowLeft from "@/assets/images/icons/arrow-left.svg";
import ArrowRight from "@/assets/images/icons/chevron-right.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Word } from "@/content/flashcards/types";
import { interopIconColor } from "@/lib/interopIcon";
import type { CustomSet } from "@/store/customSetsStore";
import { colors } from "@/theme/colors";
import { pluralWords } from "@/utils/writing/labels";
import { SET_LESSON_SIZE } from "@/utils/writing/plans";
import { findPracticeWords } from "@/utils/writing/words";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interopIconColor(ArrowRight);

/** Сколько точек — «изучено». */
const LEARNED_DOTS = 3;

// ── Карточка-вход ────────────────────────────────────────────────────────────

export function SetsEntryCard({
  count,
  onPress,
}: {
  /** Сколько наборов. */
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl bg-surface px-4 py-4 active:opacity-70"
      accessibilityRole="button"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
        <SetsIcon width={22} height={22} color={colors.primary} />
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="font-nunitoBold text-lead text-text">Мои наборы</Text>
        <Text className="font-nunito text-small text-text opacity-70">
          {count} {pluralSets(count)}
        </Text>
      </View>

      <ArrowRight width={20} height={20} className="text-text" />
    </Pressable>
  );
}

function pluralSets(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "набор";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "набора";
  return "наборов";
}

// ── Панель ───────────────────────────────────────────────────────────────────

interface SetsModalProps {
  open: boolean;
  sets: CustomSet[];
  /** Точки письма слова (0–3). */
  getLevel: (word: Word) => number;
  /** Сетка слов набора (та же, что на экране). */
  renderGrid: (words: Word[]) => ReactNode;
  onStart: (setId: string) => void;
  onClose: () => void;
}

export function SetsModal({
  open,
  sets,
  getLevel,
  renderGrid,
  onStart,
  onClose,
}: SetsModalProps) {
  // Открытый набор (шаг 2); null — список наборов
  const [openedId, setOpenedId] = useState<string | null>(null);

  const item = useMemo(() => (open ? { sets } : null), [open, sets]);

  return (
    <BottomSheet item={item} onClose={onClose} onOpen={() => setOpenedId(null)}>
      {({ sets: shown }) => {
        const opened = shown.find((set) => set.id === openedId);

        if (opened) {
          const words = findPracticeWords(opened.wordIds);
          const skipped = opened.wordIds.length - words.length;
          const inLesson = Math.min(SET_LESSON_SIZE, words.length);

          return (
            <>
              {/* Шапка: назад к списку и название */}
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setOpenedId(null)}
                  hitSlop={8}
                  className="h-10 w-10 items-center justify-center rounded-full active:bg-text/10"
                  accessibilityRole="button"
                  accessibilityLabel="К списку наборов"
                >
                  <ArrowLeft width={24} height={24} color={colors.text} />
                </Pressable>
                <Text
                  numberOfLines={1}
                  className="flex-1 font-nunitoBold text-title text-text"
                >
                  {opened.title}
                </Text>
              </View>

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
                      onPress={() => onStart(opened.id)}
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
        }

        return (
          <>
            {/* Шапка */}
            <View className="items-center gap-2">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <SetsIcon width={26} height={26} color={colors.primary} />
              </View>
              <Text className="font-nunitoBold text-title text-text">
                Мои наборы
              </Text>
              <Text className="text-center font-nunito text-small text-text opacity-70">
                Те же наборы, что в карточках. Собирать и менять их можно во
                вкладке «Мои наборы» в карточках.
              </Text>
            </View>

            {/* Список наборов */}
            <View className="mt-5 gap-3">
              {shown.map((set) => {
                const words = findPracticeWords(set.wordIds);
                const learned = words.filter(
                  (word) => getLevel(word) >= LEARNED_DOTS,
                ).length;

                return (
                  <Pressable
                    key={set.id}
                    onPress={() => setOpenedId(set.id)}
                    className="gap-3 rounded-2xl bg-surface px-4 py-4 active:opacity-70"
                    accessibilityRole="button"
                  >
                    <View className="flex-row items-center gap-3">
                      <Text
                        numberOfLines={1}
                        className="flex-1 font-nunitoBold text-body text-text"
                      >
                        {set.title}
                      </Text>
                      <Text className="font-nunito text-small text-textSecondary">
                        {words.length === 0
                          ? "нет слов для письма"
                          : `${learned} из ${words.length}`}
                      </Text>
                      <ArrowRight
                        width={18}
                        height={18}
                        className="text-textSecondary"
                      />
                    </View>
                    {words.length > 0 && (
                      <ProgressBar progress={(learned / words.length) * 100} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}
