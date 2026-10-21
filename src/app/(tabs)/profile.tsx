// app/(tabs)/profile.tsx
//
// Профиль, сверху вниз:
//   - шапка в одну строку со стрелкой «назад»: по центру аватар, под ним имя
//     (тап — «Как тебя зовут?») и уровень по опыту;
//   - блок из четырёх чисел:
//       дней занятий (дни с тренировками, не сбрасываются) — тап: календарь;
//       опыт;
//       изучено слов (сданы все экзамены слова) — тап: список этих слов;
//       текущий этап пути — тап: экран этапа;
//   - галерея лучших написаний (ProfileGallery);
//   - фразы, которые рассказала панда (ProfilePandaPhrases);
//   - внизу: политика конфиденциальности и лицензии.
// Данные: wordProgressStore, activityStore (журнал), userProgressStore (опыт),
// profileStore (имя), galleryStore.

import CalendarIcon from "@/assets/images/icons/calendar-check.svg";
import ChevronRightIcon from "@/assets/images/icons/chevron-right.svg";
import CheckIcon from "@/assets/images/icons/circle-check.svg";
import FlagIcon from "@/assets/images/icons/flag.svg";
import PandaIcon from "@/assets/images/icons/panda.svg";
import PencilIcon from "@/assets/images/icons/pencil.svg";
import ZapIcon from "@/assets/images/icons/zap.svg";
import { SetWordRow } from "@/components/flashcards/SetWordRow";
import { WordSheet } from "@/components/flashcards/WordSheet";
import { Screen } from "@/components/layout/Screen";
import { NameModal } from "@/components/profile/NameModal";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { ProfilePandaPhrases } from "@/components/profile/ProfilePandaPhrases";
import { StudyCalendar } from "@/components/profile/StudyCalendar";
import { BackButton } from "@/components/ui/BackButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Dialog, DialogButton } from "@/components/ui/Dialog";
import type { Word } from "@/content/flashcards/types";
import { PRIVACY_POLICY_URL } from "@/constants/legal";
import { useActivityStore } from "@/store/activityStore";
import { useProfileStore } from "@/store/profileStore";
import { getLevelInfo, useProgressStore } from "@/store/userProgressStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import {
  getFullyLearnedWords,
  getProfileStats,
} from "@/utils/profile/stats";
import { pluralDays, pluralWords } from "@/utils/writing/labels";
import { useRouter } from "expo-router";
import type { ComponentType } from "react";
import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";

const AVATAR_SIZE = 96;

export default function ProfileScreen() {
  const router = useRouter();
  const flashcardWords = useWordProgressStore((s) => s.flashcardWords);
  const readingExams = useWordProgressStore((s) => s.readingExams);
  const writingExams = useWordProgressStore((s) => s.writingExams);
  const days = useActivityStore((s) => s.days);
  const studyDays = Object.keys(days).length;
  const xp = useProgressStore((s) => s.xp);
  const { level } = getLevelInfo(xp);
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);

  const [editingName, setEditingName] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [opened, setOpened] = useState<Word | null>(null);
  const [privacyStub, setPrivacyStub] = useState(false);

  const stats = useMemo(
    () => getProfileStats(flashcardWords, readingExams, writingExams),
    [flashcardWords, readingExams, writingExams],
  );
  const learnedWords = useMemo(
    () => (wordsOpen ? getFullyLearnedWords(readingExams, writingExams) : []),
    [wordsOpen, readingExams, writingExams],
  );

  const openStage = () => {
    if (!stats.currentStage) return;
    router.push({
      pathname: "/games/path/stage" as any,
      params: { id: stats.currentStage.id },
    });
  };

  const openWord = useCallback((word: Word) => {
    setWordsOpen(false);
    setOpened(word);
  }, []);

  const openPrivacy = () => {
    if (PRIVACY_POLICY_URL) Linking.openURL(PRIVACY_POLICY_URL);
    else setPrivacyStub(true);
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

      <Dialog
        visible={privacyStub}
        onClose={() => setPrivacyStub(false)}
        title="Политика конфиденциальности"
        message="Скоро здесь будет ссылка на страницу политики. Приложение хранит все данные только на этом телефоне."
        actions={
          <DialogButton
            label="Понятно"
            variant="primary"
            onPress={() => setPrivacyStub(false)}
          />
        }
      />

      <BottomSheet
        item={calendarOpen ? true : null}
        onClose={() => setCalendarOpen(false)}
      >
        {() => (
          <>
            <Text className="text-center font-nunitoBold text-lead text-text">
              Дни занятий
            </Text>
            <Text className="mb-4 mt-1 text-center font-nunito text-small text-textSecondary">
              Всего {studyDays} {pluralDays(studyDays)} · день засчитывается,
              если в нём была тренировка
            </Text>
            <StudyCalendar days={days} />
          </>
        )}
      </BottomSheet>

      <BottomSheet
        item={wordsOpen ? true : null}
        onClose={() => setWordsOpen(false)}
      >
        {() => (
          <>
            <Text className="text-center font-nunitoBold text-lead text-text">
              Изученные слова
            </Text>
            <Text className="mb-4 mt-1 text-center font-nunito text-small text-textSecondary">
              Сданы экзамены и по переводу, и по письму
            </Text>
            {learnedWords.length === 0 ? (
              <Text className="text-center font-nunito text-body text-text">
                Пока пусто. Слово попадёт сюда, когда ты сдашь по нему все
                экзамены.
              </Text>
            ) : (
              <View className="gap-2">
                {learnedWords.map((word) => (
                  <SetWordRow
                    key={word.vocabularyId}
                    word={word}
                    action="open"
                    onPress={() => openWord(word)}
                    onOpenWord={openWord}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </BottomSheet>

      <WordSheet word={opened} onClose={() => setOpened(null)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
      >
        {/* Шапка: стрелка слева, аватар по центру в той же строке */}
        <View className="items-center">
          <View className="absolute left-0 top-0">
            <BackButton href="/pet" />
          </View>
          <View
            className="items-center justify-center rounded-full bg-primary"
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          >
            <PandaIcon width={52} height={52} />
          </View>

          <Pressable
            onPress={() => setEditingName(true)}
            className="mt-3 items-center active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Изменить имя"
            hitSlop={8}
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
            value={String(studyDays)}
            label={`${pluralDays(studyDays)} занятий`}
            onPress={() => setCalendarOpen(true)}
          />
          <Divider />
          <StatCell Icon={ZapIcon} value={String(xp)} label="опыта" />
          <Divider />
          <StatCell
            Icon={CheckIcon}
            value={String(stats.fullyLearned)}
            label={`${pluralWords(stats.fullyLearned)} изучено`}
            gold={stats.fullyLearned > 0}
            onPress={() => setWordsOpen(true)}
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

        <ProfileGallery />

        <ProfilePandaPhrases />

        {/* Документы */}
        <View className="overflow-hidden rounded-2xl bg-surface">
          <LinkRow title="Политика конфиденциальности" onPress={openPrivacy} />
          <View className="mx-4 h-px bg-border" />
          <LinkRow title="Лицензии" onPress={() => router.push("/licenses")} />
        </View>
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

// ── Строка-ссылка ────────────────────────────────────────────────────────────

function LinkRow({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-12 flex-row items-center justify-between px-4 py-3 active:bg-primary/10"
      accessibilityRole="button"
    >
      <Text className="font-nunito text-body text-text">{title}</Text>
      <ChevronRightIcon width={20} height={20} color={colors.textSecondary} />
    </Pressable>
  );
}
