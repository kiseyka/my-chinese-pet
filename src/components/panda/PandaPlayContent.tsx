// src/components/panda/PandaPlayContent.tsx
//
// Игры с пандой (utils/panda/play). Правило: где будут анимации панды — целая страница,
// где нет — модальная шторка.
//   меню    — «Чем займёмся?» в шторке разговора (PandaTalkSheet, поверх комнаты).
//             Открывается любым тапом по панде (с облачком — после фразы дня).
//             Сверху «Фраза дня» (если её сегодня уже читали — послушать ещё раз),
//             затем «Угадай слово», «Послушай и угадай», «Допиши черту» (+1 опыт),
//             «Напиши слово» (+1, без ошибок +2; только слова с 3 точками письма или
//             сданным экзаменом). Выбор игры закрывает шторку и открывает её страницу;
//   pick, listen, write — страница /panda-talk?game=… с пандой крупным планом
//             (PandaTalkStage, поза «думает»): раунд из ROUND_SIZE загадок («Загадка
//             1 из 3», «Дальше»), в конце монеты за раунд (все верно — 2, с ошибками —
//             1), «Ещё» (снова меню в шторке) и «Готово»; у write — вопрос и выбор «По
//             контуру» / «По памяти», дальше экран письма;
//   stroke  — сразу экран письма /panda-riddle (mode=stroke);
//   устала  — игры кончились (15 за 3 часа): «Давай отдохнём, приходи через …»;
//   пусто   — слов ещё нет: «Сначала выучи пару слов на пути» и кнопка «К пути».
// Позже сюда же: погладить, покормить (когда будут анимации).

import type { Word } from "@/content/flashcards/types";
import { usePandaStore } from "@/store/pandaStore";
import {
  PICK_REWARD,
  ROUND_PERFECT_COINS,
  ROUND_COINS,
  ROUND_SIZE,
  finishRound,
  pickPlayWords,
  roundCoins,
  STROKE_PERFECT_REWARD,
  STROKE_REWARD,
  WRITE_PERFECT_REWARD,
  WRITE_REWARD,
  canPlay,
  finishPlay,
  getMinutesUntilPlay,
  getPlaysLeft,
  pickPlayWord,
  type PlayKind,
} from "@/utils/panda/play";
import { getTodayPhraseId } from "@/utils/panda/thoughts";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image } from "react-native";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import ZapIcon from "@/assets/images/icons/zap.svg";
import { colors } from "@/theme/colors";
import { MainButton, PickRiddle, WriteRiddle } from "./PandaRiddles";

/** Игры, у которых своя страница с пандой (/panda-talk?game=…). */
export type PageGame = "pick" | "listen" | "write";

type Step =
  | { kind: "menu" }
  /** Страница игры, а загадать нечего. */
  | { kind: "none" }
  | {
      kind: "pick" | "listen";
      words: Word[];
      /** Какая загадка раунда сейчас. */
      index: number;
      /** Сколько верных ответов уже. */
      correct: number;
      variant: number;
    }
  | { kind: "write"; word: Word; variant: number };

/** Первый шаг игры: слова для раунда или слово для письма; null — загадать нечего. */
function buildGameStep(kind: PageGame): Step | null {
  if (kind === "pick" || kind === "listen") {
    const words = pickPlayWords(kind, ROUND_SIZE);
    if (words.length === 0) return null;
    return { kind, words, index: 0, correct: 0, variant: Date.now() };
  }
  const word = pickPlayWord(kind);
  return word ? { kind: "write", word, variant: Date.now() } : null;
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
    const word = pickPlayWord(kind);
    if (!word) return;
    // «Допиши черту» — на экране письма
    onClose();
    router.push({
      pathname: "/panda-riddle",
      params: { wordId: word.vocabularyId, source: "play", mode: "stroke" },
    });
  };

  if (step.kind === "pick" || step.kind === "listen") {
    const { words, index, correct } = step;
    const word = words[index];
    const isLast = index === words.length - 1;
    return (
      <View className="gap-4">
        {words.length > 1 && (
          <Text className="font-nunito text-small text-textSecondary">
            {t("play.round", { n: index + 1, total: words.length })}
          </Text>
        )}
        <PickRiddle
          key={`${step.variant}-${index}`}
          word={word}
          variant={step.variant + index}
          listen={step.kind === "listen"}
          reward={PICK_REWARD}
          onAnswer={(right) => {
            finishPlay(word.vocabularyId, right ? PICK_REWARD : 0);
            const nextCorrect = correct + (right ? 1 : 0);
            if (isLast) finishRound(roundCoins(nextCorrect, words.length));
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
                    coins={roundCoins(correct, words.length)}
                    text={
                      correct === words.length
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

  if (step.kind === "write") {
    return (
      <View className="gap-5">
        <WriteRiddle
          word={step.word}
          variant={step.variant}
          source="play"
          onClose={onClose}
        />
      </View>
    );
  }

  // Страница игры, а загадать нечего (слова успели кончиться) — как пустое меню
  const canPick = canPlay("pick");
  const canWrite = canPlay("write");
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
          reward={rewardRange(ROUND_COINS, ROUND_PERFECT_COINS)}
          coin
          onPress={() => start("pick")}
        />
        <PlayCard
          title={t("play.listen")}
          subtitle={t("play.listenHint")}
          reward={rewardRange(ROUND_COINS, ROUND_PERFECT_COINS)}
          coin
          onPress={() => start("listen")}
        />
        <PlayCard
          title={t("play.stroke")}
          subtitle={canStroke ? t("play.strokeHint") : t("play.writeLocked")}
          reward={rewardRange(STROKE_REWARD, STROKE_PERFECT_REWARD)}
          disabled={!canStroke}
          onPress={() => start("stroke")}
        />
        <PlayCard
          title={t("play.write")}
          subtitle={canWrite ? t("play.writeHint") : t("play.writeLockedMastered")}
          reward={rewardRange(WRITE_REWARD, WRITE_PERFECT_REWARD)}
          disabled={!canWrite}
          onPress={() => start("write")}
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
  coin = false,
  disabled = false,
  onPress,
}: {
  title: string;
  subtitle: string;
  /** Без награды (фраза дня) — справа ничего. */
  reward?: string;
  /** Награда — монеты (иначе опыт). */
  coin?: boolean;
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
          {coin ? (
            <Image source={COIN} style={{ width: 20, height: 20 }} />
          ) : (
            <ZapIcon width={18} height={18} color={colors.primary} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const COIN = require("@/assets/images/paw-coin.png");

/** Итог раунда: реплика панды и монеты (если заработаны). */
function RoundResult({ coins, text }: { coins: number; text: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3">
      <Text className="flex-1 font-nunitoBold text-body text-text">{text}</Text>
      {coins > 0 && (
        <View className="flex-row items-center gap-1">
          <Text className="font-nunitoBold text-body text-text">+{coins}</Text>
          <Image source={COIN} style={{ width: 22, height: 22 }} />
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

/** «+1» или «+1–2». */
function rewardRange(min: number, max: number) {
  return min === max ? `+${min}` : `+${min}–${max}`;
}
