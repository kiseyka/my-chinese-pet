// app/(tabs)/games/path/stage.tsx
//
// Экран этапа пути (id = «1:0»):
//   - шапка: назад, иероглиф этапа, «HSK 1 · этап 3», название;
//   - дорожки по порядку (перевод, письмо): «начато / пройден / освоен» и своя
//     кнопка «Тренировать» — можно сразу писать, минуя перевод;
//   - «Продолжить» — в первую непройденную дорожку (её строка выделена рамкой);
//     освоенная дорожка (все слова на 3 точках) получает зелёную плашку «Освоено»,
//     а её кнопка зовётся «Повторить»;
//   - этап освоен целиком — печать 印 на кружке, а вместо «Продолжить» — «Повторить этап»:
//     он запускает навык, который тренировали меньше (по числу ответов);
//   - сетка слов этапа: под иероглифом две строки точек — перевод и письмо;
//     тап по слову открывает панель слова (перевод, звук, «Повторение», наборы).

import BookIcon from "@/assets/images/icons/book-open.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import { PathWordGrid } from "@/components/path/PathWordGrid";
import { colors } from "@/theme/colors";
import { WordSheet } from "@/components/flashcards/WordSheet";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Hanzi } from "@/components/ui/Hanzi";
import type { Word } from "@/content/flashcards/types";
import { usePath } from "@/hooks/usePath";
import { useWordProgressStore } from "@/store/wordProgressStore";
import {
  findPathStage,
  getTrackDots,
  type TrackId,
  type TrackProgress,
} from "@/utils/path/stages";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Отступы экрана (32) и карточки с сеткой (2 × 12). */
const GRID_INSET = 32 + 24;

export default function PathStageScreen() {
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  // «Назад» — туда, откуда открыли этап: «Словарь» («Показать»), панда или профиль
  // (тап по слову во фразе панды), иначе на путь
  const backHref =
    from === "dictionary"
      ? "/vocabulary"
      : from === "pet"
        ? "/pet"
        : from === "profile"
          ? "/profile"
          : "/games/path";
  const stage = findPathStage(id ?? "");
  const { progress, flashcardWords, startTraining } = usePath();
  const [opened, setOpened] = useState<Word | null>(null);

  const item = stage ? progress.stages[stage.index] : undefined;

  const writableIds = useMemo(
    () => new Set(stage?.writable.map((w) => w.vocabularyId)),
    [stage],
  );
  const readingExams = useWordProgressStore((s) => s.readingExams);
  const writingExams = useWordProgressStore((s) => s.writingExams);
  const getExams = useCallback(
    (word: Word) => ({
      reading: !!readingExams[word.vocabularyId]?.passedAt,
      writing: !!writingExams[word.vocabularyId]?.passedAt,
    }),
    [readingExams, writingExams],
  );
  const getDots = useCallback(
    (word: Word, track: TrackId) =>
      track === "writing" && !writableIds.has(word.vocabularyId)
        ? undefined
        : getTrackDots(word, track, flashcardWords),
    [writableIds, flashcardWords],
  );

  if (!stage || !item) {
    return (
      <Screen>
        <BackButton href={backHref} />
        <Text className="mt-6 font-nunito text-body text-text">
          Этап не найден.
        </Text>
      </Screen>
    );
  }

  const returnTo = {
    pathname: "/games/path/stage",
    params: from ? { id: stage.id, from } : { id: stage.id },
  };
  const nextTrack = item.next ?? item.tracks.find((t) => !t.mastered)?.id;

  // Этап освоен целиком: «Повторить» — навык, на который отвечали реже
  const answersOf = (track: TrackId) =>
    (track === "writing" ? stage.writable : stage.words).reduce((sum, word) => {
      const skill = flashcardWords[word.vocabularyId]?.[track];
      return sum + (skill ? skill.correctAnswers + skill.incorrectAnswers : 0);
    }, 0);
  const repeatTrack = nextTrack
    ? undefined
    : [...item.tracks].sort((a, b) => answersOf(a.id) - answersOf(b.id))[0]?.id;
  const stageNumber =
    progress.stages.filter(
      (s) => s.stage.level === stage.level && s.stage.index <= stage.index,
    ).length;

  return (
    <Screen>
      <WordSheet word={opened} onClose={() => setOpened(null)} />

      <View className="flex-row items-center">
        <BackButton href={backHref} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
      >
        <View className="mb-2 flex-row items-center gap-4">
          <View
            className={`items-center justify-center rounded-full border-4 border-primary ${
              item.passed ? "bg-primary" : "bg-surface"
            }`}
            style={{ width: 72, height: 72 }}
          >
            <Hanzi
              size={34}
              className={item.passed ? "text-white" : "text-text"}
              maxFontSizeMultiplier={1.2}
            >
              {stage.glyph}
            </Hanzi>
            {item.mastered && (
              <View
                className="absolute items-center justify-center rounded-md border-2 border-seal bg-surface"
                style={{ right: -6, top: -6, width: 26, height: 26 }}
              >
                <Text className="font-nunitoBold text-small text-seal">印</Text>
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="font-nunito text-caption text-textSecondary">
              HSK {stage.level} · этап {stageNumber}
              {item.mastered ? " · освоен" : item.passed ? " · пройден" : ""}
            </Text>
            <Text className="font-nunitoBold text-title text-text">
              {stage.title}
            </Text>
            {item.mastered && (
              <Text className="font-nunitoMedium text-small text-primary">
                Все слова освоены и в переводе, и в письме
              </Text>
            )}
          </View>
        </View>

        {item.tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            highlighted={track.id === nextTrack}
            onStart={() => startTraining(stage, track.id, returnTo as any)}
          />
        ))}

        {nextTrack && (
          <Pressable
            onPress={() => startTraining(stage, nextTrack, returnTo as any)}
            className="items-center rounded-2xl bg-primary py-3.5 active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-white">
              Продолжить ·{" "}
              {item.tracks.find((t) => t.id === nextTrack)?.title.toLowerCase()}
            </Text>
          </Pressable>
        )}

        {repeatTrack && (
          <Pressable
            onPress={() => startTraining(stage, repeatTrack, returnTo as any)}
            className="items-center rounded-2xl bg-primary py-3.5 active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="font-nunitoBold text-body text-white">
              Повторить этап ·{" "}
              {item.tracks
                .find((t) => t.id === repeatTrack)
                ?.title.toLowerCase()}
            </Text>
          </Pressable>
        )}

        <View className="mt-2 rounded-2xl bg-surface p-3">
          <PathWordGrid
            words={stage.words}
            getDots={getDots}
            getExams={getExams}
            onSelect={setOpened}
            horizontalInset={GRID_INSET}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Дорожка ──────────────────────────────────────────────────────────────────

function TrackRow({
  track,
  highlighted,
  onStart,
}: {
  track: TrackProgress;
  highlighted: boolean;
  onStart: () => void;
}) {
  const Icon = track.id === "reading" ? BookIcon : PencilIcon;
  const status = track.mastered
    ? `все ${track.total} на 3 точках`
    : track.passed
      ? `пройден · освоено ${track.learned} из ${track.total}`
      : `начато ${track.started} из ${track.total}`;

  return (
    <View
      className={`flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3 ${
        highlighted ? "border-2 border-primary" : "border-2 border-transparent"
      }`}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          track.mastered ? "bg-primary" : "bg-primary/15"
        }`}
      >
        <Icon
          width={20}
          height={20}
          color={track.mastered ? "#FFFFFF" : colors.primary}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-nunitoBold text-body text-text">
            {track.title}
          </Text>
          {track.mastered && (
            <View className="rounded-full bg-primary px-2 py-0.5">
              <Text className="font-nunitoBold text-caption text-white">
                Освоено ✓
              </Text>
            </View>
          )}
        </View>
        <Text
          className={`font-nunito text-small ${
            track.mastered ? "text-primary" : "text-textSecondary"
          }`}
        >
          {status}
        </Text>
      </View>
      <Pressable
        onPress={onStart}
        className="min-h-10 justify-center rounded-full border border-primary px-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`${track.mastered ? "Повторить" : "Тренировать"}: ${track.title}`}
      >
        <Text className="font-nunitoBold text-small text-primary">
          {track.mastered ? "Повторить" : "Тренировать"}
        </Text>
      </Pressable>
    </View>
  );
}
