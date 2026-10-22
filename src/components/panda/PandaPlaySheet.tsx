// src/components/panda/PandaPlaySheet.tsx
//
// Тап по панде без облачка — панда предлагает поиграть (utils/panda/play):
//   меню    — «Чем займёмся?»: «Угадай слово», «Послушай и угадай», «Допиши черту»
//             (+1 опыт), «Напиши слово» (+1, без ошибок +2);
//   pick, listen — загадка прямо в панели; после ответа «Ещё» (если игры остались)
//             и «Готово»;
//   stroke, write — экран письма /panda-riddle (source=play, у stroke — mode=stroke);
//   устала  — игры кончились (15 за 3 часа): «Давай отдохнём, приходи через …»;
//   пусто   — слов ещё нет: «Сначала выучи пару слов на пути» и кнопка «К пути».
// Позже сюда же: погладить, покормить (когда будут анимации).

import PandaIcon from "@/assets/images/icons/panda.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Word } from "@/content/flashcards/types";
import { usePandaStore } from "@/store/pandaStore";
import {
  PICK_REWARD,
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
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import ZapIcon from "@/assets/images/icons/zap.svg";
import { colors } from "@/theme/colors";
import { MainButton, PickRiddle, WriteRiddle } from "./PandaRiddles";

type Step =
  | { kind: "menu" }
  | { kind: "pick" | "listen"; word: Word; variant: number }
  | { kind: "write"; word: Word; variant: number };

interface PandaPlaySheetProps {
  /** Открыта ли панель (увеличивается при каждом открытии — новое меню). */
  openId: number | null;
  onClose: () => void;
}

export function PandaPlaySheet({ openId, onClose }: PandaPlaySheetProps) {
  return (
    <BottomSheet item={openId} onClose={onClose}>
      {(id) => <PlayContent key={id} onClose={onClose} />}
    </BottomSheet>
  );
}

function PlayContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("pandaThoughts");
  const router = useRouter();
  const playTimes = usePandaStore((s) => s.playTimes);
  const [step, setStep] = useState<Step>({ kind: "menu" });

  const playsLeft = getPlaysLeft(playTimes);

  const start = (kind: PlayKind) => {
    const word = pickPlayWord(kind);
    if (!word) return;
    // «Допиши черту» — на экране письма (холст в панели мешал бы свайпу панели)
    if (kind === "stroke") {
      onClose();
      router.push({
        pathname: "/panda-riddle",
        params: { wordId: word.vocabularyId, source: "play", mode: "stroke" },
      });
      return;
    }
    setStep({ kind, word, variant: Date.now() });
  };

  if (step.kind === "pick" || step.kind === "listen") {
    const { word } = step;
    return (
      <View className="gap-5">
        <Header />
        <PickRiddle
          key={step.variant}
          word={word}
          variant={step.variant}
          listen={step.kind === "listen"}
          reward={PICK_REWARD}
          onAnswer={(correct) =>
            finishPlay(word.vocabularyId, correct ? PICK_REWARD : 0)
          }
          actions={(answered) => (
            <View className="flex-row gap-3">
              {answered && playsLeft > 0 && (
                <MainButton
                  label={t("play.more")}
                  variant="secondary"
                  onPress={() => setStep({ kind: "menu" })}
                />
              )}
              <MainButton
                label={t("play.done")}
                onPress={onClose}
                disabled={!answered}
              />
            </View>
          )}
        />
      </View>
    );
  }

  if (step.kind === "write") {
    return (
      <View className="gap-5">
        <Header />
        <WriteRiddle
          word={step.word}
          variant={step.variant}
          source="play"
          onClose={onClose}
        />
      </View>
    );
  }

  // Меню
  const canPick = canPlay("pick");
  const canWrite = canPlay("write");
  const canStroke = canPlay("stroke");

  if (!canPick) {
    return (
      <View className="gap-5">
        <Header />
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
        <Header />
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
      <Header />
      <Text className="font-nunito text-lead text-text">{t("play.question")}</Text>

      <View className="gap-3">
        <PlayCard
          title={t("play.pick")}
          subtitle={t("play.pickHint")}
          reward={`+${PICK_REWARD}`}
          onPress={() => start("pick")}
        />
        <PlayCard
          title={t("play.listen")}
          subtitle={t("play.listenHint")}
          reward={`+${PICK_REWARD}`}
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
          subtitle={canWrite ? t("play.writeHint") : t("play.writeLocked")}
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

/** Значок панды и имя — как в реплике с облачком. */
function Header() {
  const { t } = useTranslation("pandaThoughts");
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
        <PandaIcon width={18} height={18} />
      </View>
      <Text className="font-nunitoBold text-body text-text">{t("pandaName")}</Text>
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
  reward: string;
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
      <View className="flex-row items-center gap-1">
        <Text className="font-nunitoBold text-body text-text">{reward}</Text>
        <ZapIcon width={18} height={18} color={colors.primary} />
      </View>
    </Pressable>
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
