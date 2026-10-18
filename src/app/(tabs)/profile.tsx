// app/(tabs)/profile.tsx
//
// Профиль — сводка из реальных данных, без выдуманных цифр:
//   - шапка: сколько дней с пандой (дни входа, никогда не сбрасываются),
//     ниже мелко — дней подряд сейчас и лучшая серия (просто факт, без давления);
//   - «Слова»: полностью изучено (сданы все экзамены слова) — крупно, золотом;
//     по переводу и по письму: начато / освоено (3 точки) / экзамен сдан;
//   - «Путь»: текущий уровень HSK, этапы пройдены и освоены, полоска по каждому HSK;
//   - «Активность»: сетка за 12 недель (дни входа и тренировки), итог за этот срок.
// Данные: wordProgressStore (точки, экзамены) и activityStore (журнал занятий).

import BookIcon from "@/assets/images/icons/book-open.svg";
import PandaIcon from "@/assets/images/icons/panda.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Title } from "@/components/ui/Title";
import { useActivityStore } from "@/store/activityStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import {
  getActivityWeeks,
  getBestSeries,
  getCurrentSeries,
  type ActivityCell,
} from "@/utils/activity";
import { getProfileStats, type SkillStats } from "@/utils/profile/stats";
import { pluralDays, pluralWords } from "@/utils/writing/labels";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";

/** Сколько недель в сетке активности. */
const ACTIVITY_WEEKS = 12;
const CELL_GAP = 4;

export default function ProfileScreen() {
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const readingExams = useWordProgressStore((s) => s.readingExams);
  const writingExams = useWordProgressStore((s) => s.writingExams);
  const days = useActivityStore((s) => s.days);

  const stats = useMemo(
    () => getProfileStats(flashcardWords, readingExams, writingExams),
    [flashcardWords, readingExams, writingExams],
  );

  const totalDays = Object.keys(days).length;
  const series = getCurrentSeries(days);
  const bestSeries = getBestSeries(days);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/pet" />
        <Title>Профиль</Title>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
      >
        <DaysCard total={totalDays} series={series} best={bestSeries} />

        <Card title="Слова">
          <View className="flex-row items-baseline gap-2">
            <Text className="font-nunitoBold text-heading text-gold">
              {stats.fullyLearned}
            </Text>
            <Text className="font-nunitoMedium text-body text-text">
              {pluralWords(stats.fullyLearned)} изучено полностью
            </Text>
          </View>
          <Text className="font-nunito text-small text-textSecondary">
            Сданы экзамены и по переводу, и по письму
          </Text>

          <View className="mt-4 gap-3">
            <SkillRow title="Перевод" Icon={BookIcon} stats={stats.reading} />
            <SkillRow title="Письмо" Icon={PencilIcon} stats={stats.writing} />
          </View>
        </Card>

        <Card title="Путь">
          <Text className="font-nunitoMedium text-body text-text">
            {stats.currentLevel !== null
              ? `Сейчас: HSK ${stats.currentLevel}`
              : "Весь путь пройден"}
          </Text>
          <Text className="font-nunito text-small text-textSecondary">
            Этапов пройдено {stats.stagesPassed} из {stats.stagesTotal} ·
            освоено {stats.stagesMastered}
          </Text>

          <View className="mt-4 gap-3">
            {stats.levels.map((level) => (
              <View key={level.level} className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-nunitoBold text-body text-text">
                      HSK {level.level}
                    </Text>
                    {level.level === stats.currentLevel && (
                      <View className="rounded-full bg-primary px-2 py-0.5">
                        <Text className="font-nunitoBold text-caption text-white">
                          сейчас
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-nunito text-small text-textSecondary">
                    {level.stagesPassed} из {level.stagesTotal}
                    {level.stagesMastered > 0
                      ? ` · 印 ${level.stagesMastered}`
                      : ""}
                  </Text>
                </View>
                <ProgressBar
                  progress={(level.stagesPassed / level.stagesTotal) * 100}
                  className="h-2"
                />
              </View>
            ))}
          </View>
        </Card>

        <ActivityCard days={days} />
      </ScrollView>
    </Screen>
  );
}

// ── Карточка ─────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-2xl bg-surface p-4">
      <Text className="mb-2 font-nunitoBold text-title text-text">{title}</Text>
      {children}
    </View>
  );
}

// ── Дни ──────────────────────────────────────────────────────────────────────

function DaysCard({
  total,
  series,
  best,
}: {
  total: number;
  series: number;
  best: number;
}) {
  return (
    <View className="flex-row items-center gap-4 rounded-2xl bg-surface p-4">
      <View
        className="items-center justify-center rounded-full bg-primary"
        style={{ width: 64, height: 64 }}
      >
        <PandaIcon width={34} height={34} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text className="font-nunitoBold text-heading text-text">{total}</Text>
          <Text className="font-nunitoMedium text-body text-text">
            {pluralDays(total)} с пандой
          </Text>
        </View>
        <Text className="font-nunito text-small text-textSecondary">
          Подряд: {series} {pluralDays(series)} · лучшая серия: {best}
        </Text>
      </View>
    </View>
  );
}

// ── Навык ────────────────────────────────────────────────────────────────────

function SkillRow({
  title,
  Icon,
  stats,
}: {
  title: string;
  Icon: ComponentType<SvgProps>;
  stats: SkillStats;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
        <Icon width={20} height={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="font-nunitoBold text-body text-text">{title}</Text>
        <View className="flex-row gap-4">
          <Figure value={stats.started} label="начато" />
          <Figure value={stats.learned} label="освоено" />
          <Figure value={stats.examsPassed} label="экзамен" gold />
        </View>
      </View>
    </View>
  );
}

function Figure({
  value,
  label,
  gold = false,
}: {
  value: number;
  label: string;
  gold?: boolean;
}) {
  return (
    <Text className="font-nunito text-small text-textSecondary">
      <Text
        className={`font-nunitoBold ${gold && value > 0 ? "text-gold" : "text-text"}`}
      >
        {value}
      </Text>{" "}
      {label}
    </Text>
  );
}

// ── Активность ───────────────────────────────────────────────────────────────

/** Цвет дня: пусто → только вход → 1 тренировка → 2–3 → 4 и больше. */
function cellClass(cell: ActivityCell): string {
  if (cell.future) return "bg-transparent";
  const trainings = cell.activity?.trainings;
  if (trainings === undefined) return "bg-progress-inactive";
  if (trainings === 0) return "bg-primary/20";
  if (trainings === 1) return "bg-primary/45";
  if (trainings <= 3) return "bg-primary/70";
  return "bg-primary";
}

function ActivityCard({
  days,
}: {
  days: ReturnType<typeof useActivityStore.getState>["days"];
}) {
  const [width, setWidth] = useState(0);
  const weeks = useMemo(
    () => getActivityWeeks(days, ACTIVITY_WEEKS),
    [days],
  );

  const cell =
    width > 0
      ? Math.floor((width - CELL_GAP * (ACTIVITY_WEEKS - 1)) / ACTIVITY_WEEKS)
      : 0;

  let trainings = 0;
  let answers = 0;
  let activeDays = 0;
  for (const week of weeks) {
    for (const day of week) {
      if (!day.activity) continue;
      trainings += day.activity.trainings;
      answers += day.activity.answers;
      if (day.activity.trainings > 0) activeDays += 1;
    }
  }

  return (
    <Card title="Активность">
      <Text className="mb-3 font-nunito text-small text-textSecondary">
        За {ACTIVITY_WEEKS} недель: {activeDays} {pluralDays(activeDays)} с
        тренировками · тренировок {trainings} · ответов {answers}
      </Text>

      <View
        className="flex-row"
        style={{ gap: CELL_GAP }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {cell > 0 &&
          weeks.map((week) => (
            <View key={week[0].key} style={{ gap: CELL_GAP }}>
              {week.map((day) => (
                <View
                  key={day.key}
                  className={`rounded-md ${cellClass(day)}`}
                  style={{ width: cell, height: cell }}
                />
              ))}
            </View>
          ))}
      </View>

      <View className="mt-3 flex-row items-center justify-end gap-1.5">
        <Text className="mr-1 font-nunito text-caption text-textSecondary">
          меньше
        </Text>
        {[
          "bg-progress-inactive",
          "bg-primary/20",
          "bg-primary/45",
          "bg-primary/70",
          "bg-primary",
        ].map((tone) => (
          <View key={tone} className={`h-3 w-3 rounded-sm ${tone}`} />
        ))}
        <Text className="ml-1 font-nunito text-caption text-textSecondary">
          больше
        </Text>
      </View>
    </Card>
  );
}
