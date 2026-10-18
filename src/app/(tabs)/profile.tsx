// app/(tabs)/profile.tsx
//
// Профиль — сводка из реальных данных, без выдуманных цифр:
//   - шапка: панда-аватар, имя (тап — «Как тебя зовут?»), уровень по опыту;
//   - блок из четырёх чисел: дней с пандой (дни входа, не сбрасываются),
//     опыт, полностью изученные слова (сданы все экзамены), текущий этап пути
//     (тап — экран этапа);
//   - «Слова»: по переводу и по письму — начато / освоено (3 точки) / экзамен сдан;
//   - «Путь»: этапы пройдены и освоены, полоска по каждому HSK.
// Данные: wordProgressStore, activityStore (журнал), userProgressStore (опыт),
// profileStore (имя).

import BookIcon from "@/assets/images/icons/book-open.svg";
import CalendarIcon from "@/assets/images/icons/calendar-check.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import FlagIcon from "@/assets/images/icons/flag.svg";
import PandaIcon from "@/assets/images/icons/panda.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import ZapIcon from "@/assets/images/icons/zap.svg";
import { Screen } from "@/components/layout/Screen";
import { NameModal } from "@/components/profile/NameModal";
import { BackButton } from "@/components/ui/BackButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useActivityStore } from "@/store/activityStore";
import { useProfileStore } from "@/store/profileStore";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { getProfileStats, type SkillStats } from "@/utils/profile/stats";
import { pluralDays, pluralWords } from "@/utils/writing/labels";
import { useRouter } from "expo-router";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";

export default function ProfileScreen() {
  const router = useRouter();
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const readingExams = useWordProgressStore((s) => s.readingExams);
  const writingExams = useWordProgressStore((s) => s.writingExams);
  const totalDays = useActivityStore((s) => Object.keys(s.days).length);
  const xp = useProgressStore((s) => s.xp);
  const { level } = getLevelInfo(xp);
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);
  const [editingName, setEditingName] = useState(false);

  const stats = useMemo(
    () => getProfileStats(flashcardWords, readingExams, writingExams),
    [flashcardWords, readingExams, writingExams],
  );

  const openStage = () => {
    if (!stats.currentStage) return;
    router.push({
      pathname: "/games/path/stage" as any,
      params: { id: stats.currentStage.id },
    });
  };

  return (
    <Screen>
      <NameModal
        visible={editingName}
        initialName={name}
        onConfirm={(value) => {
          setName(value);
          setEditingName(false);
        }}
        onClose={() => setEditingName(false)}
      />

      <View className="flex-row items-center">
        <BackButton href="/pet" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
      >
        {/* Шапка: аватар и имя */}
        <View className="mb-2 flex-row items-center gap-4">
          <View
            className="items-center justify-center rounded-full bg-primary"
            style={{ width: 88, height: 88 }}
          >
            <PandaIcon width={48} height={48} />
          </View>
          <Pressable
            onPress={() => setEditingName(true)}
            className="flex-1 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Изменить имя"
          >
            <View className="flex-row items-center gap-2">
              <Text
                className={`font-nunitoBold text-heading ${
                  name ? "text-text" : "text-textSecondary"
                }`}
                numberOfLines={1}
              >
                {name || "Как тебя зовут?"}
              </Text>
              <PencilIcon width={18} height={18} color={colors.primary} />
            </View>
            <Text className="font-nunito text-small text-textSecondary">
              Уровень {level}
            </Text>
          </Pressable>
        </View>

        {/* Четыре главных числа */}
        <View className="flex-row rounded-2xl bg-surface py-4">
          <StatCell
            Icon={CalendarIcon}
            value={String(totalDays)}
            label={`${pluralDays(totalDays)} с пандой`}
          />
          <Divider />
          <StatCell Icon={ZapIcon} value={String(xp)} label="опыта" />
          <Divider />
          <StatCell
            Icon={CheckIcon}
            value={String(stats.fullyLearned)}
            label={`${pluralWords(stats.fullyLearned)} изучено`}
            gold={stats.fullyLearned > 0}
          />
          <Divider />
          <StatCell
            Icon={FlagIcon}
            value={
              stats.currentStage ? `HSK ${stats.currentStage.level}` : "✓"
            }
            label={stats.currentStage?.title ?? "путь пройден"}
            onPress={stats.currentStage ? openStage : undefined}
          />
        </View>

        <Card title="Слова">
          <Text className="font-nunito text-small text-textSecondary">
            «Изучено» — сданы экзамены и по переводу, и по письму
          </Text>
          <View className="mt-3 gap-3">
            <SkillRow title="Перевод" Icon={BookIcon} stats={stats.reading} />
            <SkillRow title="Письмо" Icon={PencilIcon} stats={stats.writing} />
          </View>
        </Card>

        <Card title="Путь">
          <Text className="font-nunito text-small text-textSecondary">
            Этапов пройдено {stats.stagesPassed} из {stats.stagesTotal} ·
            освоено {stats.stagesMastered}
          </Text>

          <View className="mt-3 gap-3">
            {stats.levels.map((item) => (
              <View key={item.level} className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-nunitoBold text-body text-text">
                      HSK {item.level}
                    </Text>
                    {item.level === stats.currentLevel && (
                      <View className="rounded-full bg-primary px-2 py-0.5">
                        <Text className="font-nunitoBold text-caption text-white">
                          сейчас
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-nunito text-small text-textSecondary">
                    {item.stagesPassed} из {item.stagesTotal}
                    {item.stagesMastered > 0
                      ? ` · 印 ${item.stagesMastered}`
                      : ""}
                  </Text>
                </View>
                <ProgressBar
                  progress={(item.stagesPassed / item.stagesTotal) * 100}
                  className="h-2"
                />
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

// ── Блок чисел ───────────────────────────────────────────────────────────────

function StatCell({
  Icon,
  value,
  label,
  gold = false,
  onPress,
}: {
  Icon: ComponentType<SvgProps>;
  value: string;
  label: string;
  gold?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-1 items-center gap-1 px-1 active:opacity-70"
      accessibilityRole={onPress ? "button" : undefined}
    >
      <Icon
        width={22}
        height={22}
        color={gold ? colors.gold : colors.primary}
      />
      <Text
        className={`font-nunitoBold text-lead ${gold ? "text-gold" : "text-text"}`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        className="text-center font-nunito text-caption text-textSecondary"
        numberOfLines={2}
      >
        {label}
        {onPress ? " ›" : ""}
      </Text>
    </Pressable>
  );
}

function Divider() {
  return <View className="w-px self-stretch bg-border" />;
}

// ── Карточка ─────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-2xl bg-surface p-4">
      <Text className="mb-1 font-nunitoBold text-title text-text">{title}</Text>
      {children}
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
