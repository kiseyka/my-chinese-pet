// app/(tabs)/games/path/index.tsx
//
// Путь — одна карта изучения на всё приложение.
//   - Тропинка из этапов (тем) всех разделов HSK подряд.
//   - Раздел = уровень HSK. Перед первым этапом каждого раздела — шапка раздела
//     прямо на тропинке: «HSK 2» и «пройдено 8 из 24»; раздел пройден — ✓,
//     освоен целиком — печать 印. Других делений нет (темы — это сами этапы).
//   - В шапке экрана справа — «HSK 1 ▾»: показывает раздел, который сейчас на экране;
//     тап открывает шторку с разделами и их прогрессом, выбор прокручивает карту
//     к шапке раздела.
//   - У каждой точки одно кольцо общего прогресса, рядом — название и навыки иконками
//     (文A — перевод, карандаш — письмо). Пройденные этапы залиты и с галочкой,
//     текущий крупнее, с обводкой и значком панды, освоенный целиком — с печатью 印.
//   - Ничего не закрыто: тап по любой точке открывает экран этапа (stage.tsx).
//   - Внизу «Продолжить» (или «Начать») — сразу запускает нужную тренировку
//     текущего этапа: сначала перевод, когда он пройден — письмо.
//   - При открытии карта прокручена к текущему этапу.
//   - Фон — повторяющийся пейзаж (ScrollingBackground): едет за прокруткой медленнее
//     тропинки. Рисунок по краям, середина пустая — там идёт тропинка.
//   - Под шапкой — мягкое затухание фона (HeaderFade), чтобы «Путь» и стрелка
//     не сливались с рисунком.

import ChevronIcon from "@/assets/images/icons/chevron-right.svg";
import {
  PathNode,
  PATH_ROW_HEIGHT,
  pathOffset,
} from "@/components/path/PathNode";
import { ScrollingBackground } from "@/components/path/ScrollingBackground";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Title } from "@/components/ui/Title";
import { SealMark } from "@/components/writing/SealMark";
import { usePath } from "@/hooks/usePath";
import { colors } from "@/theme/colors";
import {
  getContinueTarget,
  getPathSections,
  TRACKS,
  type PathSection,
  type StageProgress,
} from "@/utils/path/stages";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

/** Отступы Screen по бокам. */
const SCREEN_INSET = 32;
/** Высота шапки раздела на тропинке. */
const SECTION_HEIGHT = 84;
/** Ширина карточки шапки раздела. */
const SECTION_CARD_WIDTH = 148;
/** Высота шапки экрана (стрелка + «Путь») — под ней затухание фона. */
const HEADER_HEIGHT = 56;
/** Насколько затухание заходит ниже шапки. */
const HEADER_FADE = 28;
/** Ширина боковых мест в шапке: слева стрелка, справа «HSK 1 ▾» — «Путь» ровно по центру. */
const HEADER_SIDE = 84;
/** Место под кнопкой внизу, чтобы последняя точка не пряталась за ней. */
const BOTTOM_SPACE = 104;

type Row =
  | { type: "section"; key: string; section: PathSection }
  | { type: "stage"; key: string; item: StageProgress };

/** Раздел строки: для шапки — свой, для этапа — уровень этапа. */
function rowLevel(row: Row): number {
  return row.type === "section" ? row.section.level : row.item.stage.level;
}

export default function PathScreen() {
  const router = useRouter();
  const { progress, startTraining } = usePath();
  const { width } = useWindowDimensions();
  // Кнопка внизу — над системной панелью навигации
  const insets = useSafeAreaInsets();
  const rowWidth = width - SCREEN_INSET;

  const { stages, currentIndex } = progress;
  const sections = useMemo(() => getPathSections(progress), [progress]);

  // Строки карты: перед первым этапом каждого раздела — шапка раздела
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    const byFirst = new Map(sections.map((s) => [s.firstIndex, s]));
    stages.forEach((item, i) => {
      const section = byFirst.get(i);
      if (section) {
        result.push({ type: "section", key: `hsk-${section.level}`, section });
      }
      result.push({ type: "stage", key: item.stage.id, item });
    });
    return result;
  }, [stages, sections]);

  // Строки разной высоты: считаем положение каждой, чтобы сразу открыть карту на текущем этапе
  const layout = useMemo(() => {
    let offset = 0;
    return rows.map((row) => {
      const length = row.type === "section" ? SECTION_HEIGHT : PATH_ROW_HEIGHT;
      const item = { length, offset };
      offset += length;
      return item;
    });
  }, [rows]);

  const currentRow = rows.findIndex(
    (row) => row.type === "stage" && row.item.stage.index === currentIndex,
  );
  const initialIndex = Math.max(currentRow - 1, 0);

  // Прокрутка для фона. Начинаем с того места, куда список откроется,
  // иначе фон дёрнется при первой прокрутке
  const scrollY = useRef(
    new Animated.Value(layout[initialIndex]?.offset ?? 0),
  ).current;
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  // Какой раздел сейчас на экране — для «HSK 1 ▾» в шапке
  const [visibleLevel, setVisibleLevel] = useState<number | undefined>(() =>
    rows[initialIndex] ? rowLevel(rows[initialIndex]) : undefined,
  );
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
      const first = viewableItems.find((v) => v.isViewable && v.item);
      if (first?.item) setVisibleLevel(rowLevel(first.item));
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const listRef = useRef<FlatList<Row>>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const jumpTo = useCallback(
    (level: number) => {
      setSheetOpen(false);
      const index = rows.findIndex(
        (row) => row.type === "section" && row.section.level === level,
      );
      if (index < 0) return;
      setVisibleLevel(level);
      listRef.current?.scrollToIndex({ index, animated: true });
    },
    [rows],
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
  const currentLevel =
    currentIndex !== undefined ? stages[currentIndex]?.stage.level : undefined;

  const renderItem = ({ item: row }: { item: Row }) => {
    if (row.type === "section") {
      const { section } = row;
      const first = section.firstIndex;
      return (
        <SectionHeader
          section={section}
          // Тропинка проходит между прошлой точкой и первой точкой раздела
          x={
            rowWidth / 2 +
            (first === 0
              ? pathOffset(0)
              : (pathOffset(first - 1) + pathOffset(first)) / 2)
          }
          width={rowWidth}
          // У самого первого раздела тропинки сверху нет
          hasPathAbove={first > 0}
          reached={currentIndex === undefined || first <= currentIndex}
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
    // Общий прогресс: начатые слова по всем дорожкам вместе
    const done = item.tracks.reduce((sum, t) => sum + t.started, 0);
    const all = item.tracks.reduce((sum, t) => sum + t.total, 0);
    const share = all > 0 ? done / all : 0;

    return (
      <PathNode
        index={index}
        count={stages.length}
        width={rowWidth}
        glyph={item.stage.glyph}
        title={item.stage.title}
        state={state}
        mastered={item.mastered}
        nextReached={nextReached}
        share={share}
        // Навыки показываем, когда этап начат (или он текущий)
        skills={
          share > 0 || state === "current"
            ? item.tracks.map((t) => ({
                id: t.id,
                started: t.started,
                learned: t.learned,
                total: t.total,
              }))
            : []
        }
        onPress={open}
      />
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollingBackground scrollY={scrollY} />
      <HeaderFade height={insets.top + HEADER_HEIGHT + HEADER_FADE} />
      <Screen>
        <View className="flex-row items-center justify-between">
          <View style={{ width: HEADER_SIDE }} className="items-start">
            <BackButton href="/games" />
          </View>
          <Title>Путь</Title>
          <View style={{ width: HEADER_SIDE }} className="items-end">
            {sections.length > 1 && visibleLevel !== undefined && (
              <Pressable
                onPress={() => setSheetOpen(true)}
                className="flex-row items-center gap-0.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1.5 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={`Раздел HSK ${visibleLevel}. Выбрать раздел`}
              >
                <Text className="font-nunitoBold text-small text-text">
                  HSK {visibleLevel}
                </Text>
                <View style={{ transform: [{ rotate: "90deg" }] }}>
                  <ChevronIcon width={16} height={16} color={colors.text} />
                </View>
              </Pressable>
            )}
          </View>
        </View>

        <Animated.FlatList
          ref={listRef}
          data={rows}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(row) => row.key}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({ ...layout[index], index })}
          initialScrollIndex={initialIndex}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: BOTTOM_SPACE }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={9}
        />

        {target && targetTrack && (
          <View
            className="absolute left-4 right-4"
            style={{ bottom: insets.bottom + 12 }}
          >
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

      <SectionSheet
        open={sheetOpen}
        sections={sections}
        currentLevel={currentLevel}
        onSelect={jumpTo}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

// ── Затухание фона под шапкой ────────────────────────────────────────────────

function HeaderFade({ height }: { height: number }) {
  return (
    <Svg
      width="100%"
      height={height}
      style={{ position: "absolute", left: 0, right: 0, top: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="pathHeaderFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.background} stopOpacity={0.92} />
          <Stop offset="0.65" stopColor={colors.background} stopOpacity={0.8} />
          <Stop offset="1" stopColor={colors.background} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height={height} fill="url(#pathHeaderFade)" />
    </Svg>
  );
}

// ── Прогресс раздела одной строкой ───────────────────────────────────────────

/** «освоен» / «пройден» / «пройдено 8 из 24». */
function sectionStatus(section: PathSection): string {
  if (section.mastered === section.total) return "освоен";
  if (section.passed === section.total) return "пройден";
  return `пройдено ${section.passed} из ${section.total}`;
}

/** Значок в углу раздела: печать — освоен, ✓ — пройден. */
function SectionMark({ section }: { section: PathSection }) {
  if (section.mastered === section.total) return <SealMark size={20} />;
  if (section.passed === section.total) {
    return (
      <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
        <Text className="font-nunitoBold text-caption text-white">✓</Text>
      </View>
    );
  }
  return null;
}

// ── Шапка раздела на тропинке ────────────────────────────────────────────────

function SectionHeader({
  section,
  x,
  width,
  hasPathAbove,
  reached,
}: {
  section: PathSection;
  /** Где проходит тропинка: шапка стоит прямо на ней. */
  x: number;
  width: number;
  hasPathAbove: boolean;
  reached: boolean;
}) {
  const left = Math.min(
    Math.max(x - SECTION_CARD_WIDTH / 2, 0),
    width - SECTION_CARD_WIDTH,
  );

  return (
    <View style={{ height: SECTION_HEIGHT, width }}>
      {hasPathAbove && (
        <Svg
          width={width}
          height={SECTION_HEIGHT}
          style={{ position: "absolute" }}
          pointerEvents="none"
        >
          <Path
            d={`M ${x} 0 L ${x} ${SECTION_HEIGHT}`}
            stroke={reached ? colors.progress.active : colors.progress.inactive}
            strokeWidth={6}
            strokeDasharray={reached ? undefined : "2 12"}
            strokeLinecap="round"
          />
        </Svg>
      )}
      <View
        className="absolute items-center rounded-2xl border-2 border-primary bg-surface px-3 py-1.5"
        style={{
          top: (SECTION_HEIGHT - 58) / 2,
          height: 58,
          left,
          width: SECTION_CARD_WIDTH,
        }}
        accessible
        accessibilityRole="header"
        accessibilityLabel={`Раздел HSK ${section.level}, ${sectionStatus(section)}`}
      >
        <View className="flex-row items-center gap-1.5">
          <Text className="font-nunitoBold text-lead text-primary">
            HSK {section.level}
          </Text>
          <SectionMark section={section} />
        </View>
        <Text className="font-nunitoMedium text-caption text-textSecondary">
          {sectionStatus(section)}
        </Text>
      </View>
    </View>
  );
}

// ── Шторка выбора раздела ────────────────────────────────────────────────────

function SectionSheet({
  open,
  sections,
  currentLevel,
  onSelect,
  onClose,
}: {
  open: boolean;
  sections: PathSection[];
  /** Раздел текущего этапа: помечается «сейчас». */
  currentLevel?: number;
  onSelect: (level: number) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet item={open ? true : null} onClose={onClose}>
      {() => (
        <>
          <Text className="text-center font-nunitoBold text-lead text-text">
            Разделы
          </Text>
          <View className="mt-4 gap-2">
            {sections.map((section) => {
              const share = section.total > 0 ? section.passed / section.total : 0;
              const isCurrent = section.level === currentLevel;
              return (
                <Pressable
                  key={section.level}
                  onPress={() => onSelect(section.level)}
                  className={`rounded-2xl bg-surface px-4 py-3 active:opacity-70 ${
                    isCurrent
                      ? "border-2 border-primary"
                      : "border-2 border-transparent"
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`HSK ${section.level}, ${sectionStatus(section)}${isCurrent ? ", сейчас" : ""}`}
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="font-nunitoBold text-body text-text">
                      HSK {section.level}
                    </Text>
                    <SectionMark section={section} />
                    {isCurrent && (
                      <View className="rounded-full bg-primary/15 px-2 py-0.5">
                        <Text className="font-nunitoBold text-caption text-primary">
                          сейчас
                        </Text>
                      </View>
                    )}
                    <Text className="ml-auto font-nunitoMedium text-small text-textSecondary">
                      {section.passed} из {section.total}
                    </Text>
                  </View>
                  <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/15">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round(share * 100)}%` }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </BottomSheet>
  );
}
