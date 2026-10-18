// app/(tabs)/profile.tsx
//
// Профиль, сверху вниз:
//   - шапка: панда-аватар, имя (тап — «Как тебя зовут?»), уровень по опыту;
//   - блок из четырёх чисел: дней с пандой (дни входа, не сбрасываются),
//     опыт, полностью изученные слова (сданы все экзамены), текущий этап пути
//     (тап — экран этапа);
//   - календарь входов (VisitCalendar);
//   - галерея лучших написаний (ProfileGallery).
// Данные: wordProgressStore, activityStore (журнал), userProgressStore (опыт),
// profileStore (имя), galleryStore.

import CalendarIcon from "@/assets/images/icons/calendar-check.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import FlagIcon from "@/assets/images/icons/flag.svg";
import PandaIcon from "@/assets/images/icons/panda.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import ZapIcon from "@/assets/images/icons/zap.svg";
import { Screen } from "@/components/layout/Screen";
import { NameModal } from "@/components/profile/NameModal";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { VisitCalendar } from "@/components/profile/VisitCalendar";
import { BackButton } from "@/components/ui/BackButton";
import { useActivityStore } from "@/store/activityStore";
import { useProfileStore } from "@/store/profileStore";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { getProfileStats } from "@/utils/profile/stats";
import { pluralDays, pluralWords } from "@/utils/writing/labels";
import { useRouter } from "expo-router";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";

export default function ProfileScreen() {
  const router = useRouter();
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const readingExams = useWordProgressStore((s) => s.readingExams);
  const writingExams = useWordProgressStore((s) => s.writingExams);
  const days = useActivityStore((s) => s.days);
  const totalDays = Object.keys(days).length;
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

        <VisitCalendar days={days} />

        <ProfileGallery />
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
