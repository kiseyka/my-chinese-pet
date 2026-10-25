// src/components/panda/PandaPlayContent.tsx
//
// Игры с пандой (utils/panda/play). Правило: где будут анимации панды — целая страница,
// где нет — модальная шторка.
//   меню    — «Чем займёмся?» в шторке разговора (PandaTalkSheet, поверх комнаты).
//             Открывается любым тапом по панде (с облачком — после фразы дня).
//             Сверху «Фраза дня» (если её сегодня уже читали — послушать ещё раз),
//             затем «Угадай слово», «Послушай и угадай» (до +3 опыта за раунд) и
//             «Допиши черту» (+1). Выбор игры закрывает шторку и открывает её страницу;
//   pick, listen — страница /panda-talk?game=… с пандой крупным планом
//             (PandaTalkStage, поза «думает»): раунд из ROUND_SIZE загадок («Загадка
//             1 из 3», «Дальше»), за каждый верный ответ +1 опыт, в конце итог раунда
//             (0–3 опыта), «Ещё» (снова меню в шторке) и «Готово»;
//   stroke  — сразу экран письма /panda-riddle (mode=stroke);
//   устала  — игры кончились (15 за 3 часа): «Давай отдохнём, приходи через …»;
//   пусто   — слов ещё нет: «Сначала выучи пару слов на пути» и кнопка «К пути».
// Позже сюда же: погладить, покормить (когда будут анимации).

import { usePandaStore } from "@/store/pandaStore";
import {
  PICK_REWARD,
  ROUND_SIZE,
  STROKE_REWARD,
  canPlay,
  finishPlay,
  getMinutesUntilPlay,
  getPlaysLeft,
  pickGuessRound,
  pickStrokeWord,
  type GuessRiddle,
  type PlayKind,
} from "@/utils/panda/play";
import { getTodayPhraseId } from "@/utils/panda/thoughts";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import ZapIcon from "@/assets/images/icons/zap.svg";
import { colors } from "@/theme/colors";
import { MainButton, PickRiddle } from "./PandaRiddles";

/** Игры, у которых своя страница с пандой (/panda-talk?game=…). */
export type PageGame = "pick" | "listen";

type Step =
  | { kind: "menu" }
  /** Страница игры, а загадать нечего. */
  | { kind: "none" }
  | {
      kind: PageGame;
      /** Загадки раунда: слово и уже подобранные варианты. */
      riddles: GuessRiddle[];
      /** Какая загадка раунда сейчас. */
      index: number;
      /** Сколько верных ответов уже. */
      correct: number;
      variant: number;
    };

/** Первый шаг игры: загадки раунда; null — загадать нечего. */
function buildGameStep(kind: PageGame): Step | null {
  const riddles = pickGuessRound(kind, ROUND_SIZE);
  if (riddles.length === 0) return null;
  return { kind, riddles, index: 0, correct: 0, variant: Date.now() };
}

interface PlayContentProps {
  /** Назад к панде (и перед переходом на другой экран). */
  onClose: () => void;
  /** Меню: открыть ещё раз фразу дня, прочитанную сегодня. */
  onOpenPhrase?: (phraseId: string) => void;
  /** Меню: выбрана игра со своей страницей (закрыть шторку и открыть страницу). */
  onStartGame?: (game: PageGame) => void;
  /** Страница игры: какая игра. Без него — меню. */
  game?: PageGame;
  /** Страница игры: «Ещё» — снова меню (в шторке). */
  onMore?: () => void;
}

export function PlayContent({
  onClose,
  onOpenPhrase,
  onStartGame,
  game,
  onMore,
}: PlayContentProps) {
  const { t } = useTranslation("pandaThoughts");
  const router = useRouter();
  const playTimes = usePandaStore((s) => s.playTimes);
  // Подписка на коллекцию: только что дочитанная фраза сразу появляется в меню
  usePandaStore((s) => s.collectedPhrases.length);
  const [step, setStep] = useState<Step>(() =>
    game ? (buildGameStep(game) ?? { kind: "none" }) : { kind: "menu" },
  );
  const todayPhraseId = getTodayPhraseId();
  const phraseCard = todayPhraseId && onOpenPhrase ? (
    <PlayCard
      title={t("play.phraseOfDay")}
      subtitle={t("play.phraseOfDayHint")}
      onPress={() => onOpenPhrase(todayPhraseId)}
    />
  ) : null;

  const playsLeft = getPlaysLeft(playTimes);

  const start = (kind: PlayKind) => {
    if (kind !== "stroke") {
      // Своя страница с пандой — туда; иначе (нет страницы) прямо здесь
      if (onStartGame) {
        onStartGame(kind);
        return;
      }
      const next = buildGameStep(kind);
      if (next) setStep(next);
      return;
    }
    const word = pickStrokeWord();
    if (!word) return;
    // «Допиши черту» — на экране письма; run — каждый заход начинается заново
    onClose();
    router.push({
      pathname: "/panda-riddle",
      params: { wordId: word.vocabularyId, run: String(Date.now()) },
    });
  };

  if (step.kind === "pick" || step.kind === "listen") {
    const { riddles, index, correct } = step;
    const { word, options } = riddles[index];
    const total = riddles.length;
    const isLast = index === total - 1;
    return (
      <View className="gap-4">
        {total > 1 && (
          <Text className="font-nunito text-small text-textSecondary">
            {t("play.round", { n: index + 1, total })}
          </Text>
        )}
        <PickRiddle
          key={`${step.variant}-${index}`}
          word={word}
          options={options}
          variant={step.variant + index}
          listen={step.kind === "listen"}
          reward={PICK_REWARD}
          onAnswer={(right) => {
            // Опыт сразу за каждый верный ответ: ушёл посреди раунда — заработанное остаётся
            finishPlay(word.vocabularyId, right ? PICK_REWARD : 0);
            const nextCorrect = correct + (right ? 1 : 0);
            setStep({ ...step, correct: nextCorrect });
          }}
          actions={(answered) =>
            !isLast ? (
              <View className="flex-row">
                <MainButton
                  label={t("play.next")}
                  disabled={!answered}
                  onPress={() =>
                    setStep({ ...step, index: index + 1 })
                  }
                />
              </View>
            ) : (
              <View className="gap-4">
                {answered && (
                  <RoundResult
                    xp={correct * PICK_REWARD}
                    text={
                      correct === total
                        ? t("play.roundPerfect")
                        : correct > 0
                          ? t("play.roundGood")
                          : t("play.roundNone")
                    }
                  />
                )}
                <View className="flex-row gap-3">
                  {answered && playsLeft > 0 && (
                    <MainButton
                      label={t("play.more")}
                      variant="secondary"
                      onPress={() => (onMore ? onMore() : setStep({ kind: "menu" }))}
                    />
                  )}
                  <MainButton
                    label={t("play.done")}
                    onPress={onClose}
                    disabled={!answered}
                  />
                </View>
              </View>
            )
          }
        />
      </View>
    );
  }

  // Страница игры, а загадать нечего (слова успели кончиться) — как пустое меню
  const canPick = canPlay("pick");
  const canStroke = canPlay("stroke");

  if (!canPick || step.kind === "none") {
    return (
      <View className="gap-5">
        <Text className="font-nunito text-lead text-text">{t("play.empty")}</Text>
        <View className="flex-row">
          <MainButton
            label={t("play.toPath")}
            onPress={() => {
              onClose();
              router.push("/games/path" as any);
            }}
          />
        </View>
      </View>
    );
  }

  if (playsLeft === 0) {
    return (
      <View className="gap-5">
        {phraseCard}
        <Text className="font-nunito text-lead text-text">
          {t("play.tired", {
            time: formatWait(getMinutesUntilPlay(playTimes), (key, o) =>
              t(key, o),
            ),
          })}
        </Text>
        <View className="flex-row">
          <MainButton label={t("play.ok")} onPress={onClose} />
        </View>
      </View>
    );
  }

  return (
    <View className="gap-5">
      <Text className="font-nunito text-lead text-text">{t("play.question")}</Text>

      <View className="gap-3">
        {phraseCard}
        <PlayCard
          title={t("play.pick")}
          subtitle={t("play.pickHint")}
          reward={t("play.upTo", { n: ROUND_SIZE * PICK_REWARD })}
          onPress={() => start("pick")}
        />
        <PlayCard
          title={t("play.listen")}
          subtitle={t("play.listenHint")}
          reward={t("play.upTo", { n: ROUND_SIZE * PICK_REWARD })}
          onPress={() => start("listen")}
        />
        <PlayCard
          title={t("play.stroke")}
          subtitle={canStroke ? t("play.strokeHint") : t("play.writeLocked")}
          reward={`+${STROKE_REWARD}`}
          disabled={!canStroke}
          onPress={() => start("stroke")}
        />
      </View>

      <Text className="text-center font-nunito text-caption text-textSecondary">
        {t("play.left", { count: playsLeft })}
      </Text>
    </View>
  );
}

function PlayCard({
  title,
  subtitle,
  reward,
  disabled = false,
  onPress,
}: {
  title: string;
  subtitle: string;
  /** Опыт за игру; без награды (фраза дня) — справа ничего. */
  reward?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-16 flex-row items-center gap-3 rounded-2xl border border-primary/30 bg-surface px-4 py-3 active:bg-primary/10 ${
        disabled ? "opacity-50" : ""
      }`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <View className="flex-1">
        <Text className="font-nunitoBold text-body text-text">{title}</Text>
        <Text className="font-nunito text-small text-textSecondary">{subtitle}</Text>
      </View>
      {reward && (
        <View className="flex-row items-center gap-1">
          <Text className="font-nunitoBold text-body text-text">{reward}</Text>
          <ZapIcon width={18} height={18} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

/** Итог раунда: реплика панды и опыт за раунд (если заработан). */
function RoundResult({ xp, text }: { xp: number; text: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3">
      <Text className="flex-1 font-nunitoBold text-body text-text">{text}</Text>
      {xp > 0 && (
        <View className="flex-row items-center gap-1">
          <Text className="font-nunitoBold text-body text-text">+{xp}</Text>
          <ZapIcon width={20} height={20} color={colors.primary} />
        </View>
      )}
    </View>
  );
}

/** «40 мин», «2 ч 15 мин». */
function formatWait(
  minutes: number,
  t: (key: string, options: { count: number }) => string,
) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return t("play.minutes", { count: rest });
  if (rest === 0) return t("play.hours", { count: hours });
  return `${t("play.hours", { count: hours })} ${t("play.minutes", { count: rest })}`;
}

