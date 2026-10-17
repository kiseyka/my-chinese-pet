// app/(tabs)/games/path/index.tsx
//
// Путь — одна карта изучения на всё приложение.
//   - Тропинка из этапов (тем) всех разделов HSK подряд; между разделами — веха «HSK 2».
//   - У каждой точки два кольца: снаружи перевод, внутри письмо (заполняются по словам
//     с хотя бы 1 точкой). Пройденные этапы залиты, текущий крупнее и пульсирует,
//     освоенный целиком — с печатью 印.
//   - Ничего не закрыто: тап по любой точке открывает экран этапа (stage.tsx).
//   - Внизу «Продолжить» (или «Начать») — сразу запускает нужную тренировку
//     текущего этапа: сначала перевод, когда он пройден — письмо.
//   - При открытии карта прокручена к текущему этапу.

import { PathNode, PATH_ROW_HEIGHT, pathOffset } from "@/components/path/PathNode";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { usePath } from "@/hooks/usePath";
import { colors } from "@/theme/colors";
import {
  getContinueTarget,
  TRACKS,
  type StageProgress,
} from "@/utils/path/stages";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";

/** Отступы Screen по бокам. */
const SCREEN_INSET = 32;
/** Высота вехи «HSK 2» между разделами. */
const MILESTONE_HEIGHT = 64;
/** Место под кнопкой внизу, чтобы последняя точка не пряталась за ней. */
const BOTTOM_SPACE = 104;

/** Цвет кольца дорожки на карте. */
const RING_COLORS = {
  reading: colors.primary,
  writing: colors.seal,
} as const;

type Row =
  | { type: "milestone"; key: string; level: number; afterIndex: number }
  | { type: "stage"; key: string; item: StageProgress };

export default function PathScreen() {
  const router = useRouter();
  const { progress, startTraining } = usePath();
  const { width } = useWindowDimensions();
  const rowWidth = width - SCREEN_INSET;

  const { stages, currentIndex } = progress;

  // Строки карты: этапы и вехи разделов между ними
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    stages.forEach((item, i) => {
      const previous = stages[i - 1];
      if (previous && previous.stage.level !== item.stage.level) {
        result.push({
          type: "milestone",
          key: `level-${item.stage.level}`,
          level: item.stage.level,
          afterIndex: i - 1,
        });
      }
      result.push({ type: "stage", key: item.stage.id, item });
    });
    return result;
  }, [stages]);

  // Строки разной высоты: считаем положение каждой, чтобы сразу открыть карту на текущем этапе
  const layout = useMemo(() => {
    let offset = 0;
    return rows.map((row) => {
      const length =
        row.type === "milestone" ? MILESTONE_HEIGHT : PATH_ROW_HEIGHT;
      const item = { length, offset };
      offset += length;
      return item;
    });
  }, [rows]);

  const currentRow = rows.findIndex(
    (row) => row.type === "stage" && row.item.stage.index === currentIndex,
  );

  const open = useCallback(
    (index: number) =>
      router.push({
        pathname: "/games/path/stage" as any,
        params: { id: stages[index].stage.id },
      }),
    [router, stages],
  );

  const target = getContinueTarget(progress);
  const isFresh = stages.every((s) => s.tracks.every((t) => t.started === 0));
  const targetTrack = TRACKS.find((t) => t.id === target?.track);

  const renderItem = ({ item: row }: { item: Row }) => {
    if (row.type === "milestone") {
      return (
        <Milestone
          label={`HSK ${row.level}`}
          x={
            rowWidth / 2 +
            (pathOffset(row.afterIndex) + pathOffset(row.afterIndex + 1)) / 2
          }
          width={rowWidth}
          reached={
            currentIndex === undefined || row.afterIndex + 1 <= currentIndex
          }
        />
      );
    }

    const { item } = row;
    const index = item.stage.index;
    const state =
      index === currentIndex ? "current" : item.passed ? "passed" : "upcoming";
    const next = stages[index + 1];
    const nextReached =
      !!next && (next.passed || next.stage.index === currentIndex);

    return (
      <PathNode
        index={index}
        count={stages.length}
        width={rowWidth}
        glyph={item.stage.glyph}
        title={item.stage.title}
        caption={
          state === "upcoming"
            ? undefined
            : item.tracks
                .map((t) => `${t.title.toLowerCase()} ${t.started}/${t.total}`)
                .join(" · ")
        }
        state={state}
        mastered={item.mastered}
        nextReached={nextReached}
        // Внутреннее кольцо — письмо, внешнее — перевод
        rings={[...item.tracks].reverse().map((t) => ({
          share: t.total > 0 ? t.started / t.total : 0,
          color: RING_COLORS[t.id],
        }))}
        onPress={open}
      />
    );
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/games" />
        <Title>Путь</Title>
        <View style={{ width: 28 }} />
      </View>

      <View className="mt-2 flex-row justify-center gap-4">
        <Legend color={colors.primary} label="перевод" />
        <Legend color={colors.seal} label="письмо" />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ ...layout[index], index })}
        initialScrollIndex={Math.max(currentRow - 1, 0)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: BOTTOM_SPACE }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={9}
      />

      {target && targetTrack && (
        <View className="absolute bottom-0 left-4 right-4 pb-4">
          <Pressable
            onPress={() => startTraining(target.stage, target.track)}
            className="h-16 justify-center rounded-full bg-primary px-5 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`${isFresh ? "Начать" : "Продолжить"}: ${target.stage.title}, ${targetTrack.title}`}
          >
            <Text className="text-center font-nunitoBold text-lead text-white">
              {isFresh ? "Начать" : "Продолжить"}
            </Text>
            <Text
              numberOfLines={1}
              className="text-center font-nunito text-caption text-white/80"
            >
              {target.stage.title} · {targetTrack.title.toLowerCase()}
            </Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

// ── Веха раздела ─────────────────────────────────────────────────────────────

function Milestone({
  label,
  x,
  width,
  reached,
}: {
  label: string;
  /** Где проходит тропинка: веха стоит прямо на ней. */
  x: number;
  width: number;
  reached: boolean;
}) {
  return (
    <View style={{ height: MILESTONE_HEIGHT, width }}>
      <Svg
        width={width}
        height={MILESTONE_HEIGHT}
        style={{ position: "absolute" }}
        pointerEvents="none"
      >
        <Path
          d={`M ${x} 0 L ${x} ${MILESTONE_HEIGHT}`}
          stroke={reached ? colors.progress.active : colors.progress.inactive}
          strokeWidth={6}
          strokeDasharray={reached ? undefined : "2 12"}
          strokeLinecap="round"
        />
      </Svg>
      <View
        className="absolute rounded-full border-2 border-primary bg-surface px-4 py-1"
        style={{ top: MILESTONE_HEIGHT / 2 - 16, left: x - 44, width: 88 }}
      >
        <Text className="text-center font-nunitoBold text-body text-primary">
          {label}
        </Text>
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="font-nunito text-caption text-textSecondary">
        {label}
      </Text>
    </View>
  );
}
