// app/(tabs)/games/path/stage.tsx
//
// Экран этапа пути (id = «1:0»):
//   - шапка: назад, иероглиф этапа, «HSK 1 · этап 3», название;
//   - дорожки по порядку (перевод, письмо): «начато / пройден / освоен» и своя
//     кнопка «Тренировать» — можно сразу писать, минуя перевод;
//   - «Продолжить» — в первую непройденную дорожку (её строка выделена рамкой);
//   - сетка слов этапа: под иероглифом две строки точек — перевод и письмо;
//     тап по слову открывает панель слова (перевод, звук, «Повторение», наборы).

import { PathWordGrid, TRACK_DOT_CLASSES } from "@/components/path/PathWordGrid";
import { WordSheet } from "@/components/flashcards/WordSheet";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Hanzi } from "@/components/ui/Hanzi";
import type { Word } from "@/content/flashcards/types";
import { usePath } from "@/hooks/usePath";
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const stage = findPathStage(id ?? "");
  const { progress, flashcardWords, startTraining } = usePath();
  const [opened, setOpened] = useState<Word | null>(null);

  const item = stage ? progress.stages[stage.index] : undefined;

  const writableIds = useMemo(
    () => new Set(stage?.writable.map((w) => w.vocabularyId)),
    [stage],
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
        <BackButton />
        <Text className="mt-6 font-nunito text-body text-text">
          Этап не найден.
        </Text>
      </Screen>
    );
  }

  const returnTo = { pathname: "/games/path/stage", params: { id: stage.id } };
  const nextTrack = item.next ?? item.tracks.find((t) => !t.mastered)?.id;
  const stageNumber =
    progress.stages.filter(
      (s) => s.stage.level === stage.level && s.stage.index <= stage.index,
    ).length;

  return (
    <Screen>
      <WordSheet word={opened} onClose={() => setOpened(null)} />

      <View className="flex-row items-center">
        <BackButton />
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
          </View>
          <View className="flex-1">
            <Text className="font-nunito text-caption text-textSecondary">
              HSK {stage.level} · этап {stageNumber}
              {item.mastered ? " · освоен" : item.passed ? " · пройден" : ""}
            </Text>
            <Text className="font-nunitoBold text-title text-text">
              {stage.title}
            </Text>
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

        <View className="mt-2 rounded-2xl bg-surface p-3">
          <PathWordGrid
            words={stage.words}
            getDots={getDots}
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
  const status = track.mastered
    ? `освоено ${track.learned} из ${track.total}`
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
        className={`h-3 w-3 rounded-full ${TRACK_DOT_CLASSES[track.id][0]}`}
      />
      <View className="flex-1">
        <Text className="font-nunitoBold text-body text-text">
          {track.title}
        </Text>
        <Text className="font-nunito text-small text-textSecondary">
          {status}
        </Text>
      </View>
      <Pressable
        onPress={onStart}
        className="min-h-10 justify-center rounded-full border border-primary px-4 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Тренировать: ${track.title}`}
      >
        <Text className="font-nunitoBold text-small text-primary">
          Тренировать
        </Text>
      </Pressable>
    </View>
  );
}
