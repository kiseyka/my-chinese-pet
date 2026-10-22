// src/components/profile/ProfilePandaPhrases.tsx
//
// «Фразы панды» в профиле: фразы, которые панда уже рассказала (мысль phrase),
// новые сверху. Чтобы профиль открывался быстро:
//   - сначала видно PAGE фраз, «Показать ещё» добавляет следующие PAGE;
//   - строка свёрнута: только иероглифы фразы одной строкой (лёгкий Text, без разбора
//     по словам); тап — раскрывает полный вид (слова тапом, перевод, факт, ответ).

import ChevronRight from "@/assets/images/icons/chevron-right.svg";
import { PandaPhraseView } from "@/components/panda/PandaPhraseView";
import { Hanzi } from "@/components/ui/Hanzi";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import { findPandaPhrase, type PandaPhrase } from "@/content/panda/thoughtPhrases";
import { usePandaStore } from "@/store/pandaStore";
import { colors } from "@/theme/colors";
import { phraseText } from "@/utils/panda/phraseSegments";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

/** Сколько фраз показывать сразу и добавлять по «Показать ещё». */
const PAGE = 5;

export function ProfilePandaPhrases() {
  const { t } = useTranslation("pandaThoughts");
  const collected = usePandaStore((s) => s.collectedPhrases);
  const [limit, setLimit] = useState(PAGE);
  const [openedId, setOpenedId] = useState<string | null>(null);

  const phrases = useMemo(
    () =>
      [...collected]
        .reverse()
        .map((item) => findPandaPhrase(item.phraseId))
        .filter((phrase): phrase is PandaPhrase => !!phrase),
    [collected],
  );
  const shown = phrases.slice(0, limit);

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-nunitoBold text-title text-text">
          {t("profile.title")}
          {phrases.length > 0 && (
            <Text className="font-nunito text-small text-textSecondary">
              {"  "}
              {phrases.length}
            </Text>
          )}
        </Text>
        {openedId && <PinyinToggle />}
      </View>

      {phrases.length === 0 ? (
        <Text className="font-nunito text-small text-textSecondary">
          {t("profile.empty")}
        </Text>
      ) : (
        <View className="gap-2">
          {shown.map((phrase, i) => (
            <View key={phrase.id} className="gap-2">
              {i > 0 && <View className="h-px bg-border" />}
              <PhraseRow
                phrase={phrase}
                open={openedId === phrase.id}
                onToggle={() =>
                  setOpenedId((id) => (id === phrase.id ? null : phrase.id))
                }
              />
            </View>
          ))}

          {phrases.length > limit && (
            <Pressable
              onPress={() => setLimit((n) => n + PAGE)}
              className="mt-1 min-h-11 items-center justify-center rounded-full border border-primary/30 active:opacity-70"
              accessibilityRole="button"
            >
              <Text className="font-nunito text-body text-primary">
                {t("profile.more", { count: Math.min(PAGE, phrases.length - limit) })}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function PhraseRow({
  phrase,
  open,
  onToggle,
}: {
  phrase: PandaPhrase;
  open: boolean;
  onToggle: () => void;
}) {
  const answer = usePandaStore((s) => s.answers[phrase.id]);

  const { t } = useTranslation("pandaThoughts");

  if (open) {
    return (
      <View className="gap-2">
        <PandaPhraseView
          phrase={phrase}
          size={24}
          compact
          answer={answer}
          from="profile"
        />
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          className="self-start py-1 active:opacity-60"
          accessibilityRole="button"
        >
          <Text className="font-nunito text-small text-primary">
            {t("profile.collapse")}
          </Text>
        </Pressable>
      </View>
    );
  }

  // Свёрнуто — фраза одной строкой; тап — полный вид
  return (
    <Pressable
      onPress={onToggle}
      className="min-h-11 flex-row items-center gap-2 active:opacity-70"
      accessibilityRole="button"
      accessibilityState={{ expanded: false }}
    >
      <View className="flex-1">
        <Hanzi size={22} numberOfLines={1}>
          {phraseText(phrase)}
        </Hanzi>
      </View>
      <ChevronRight width={20} height={20} color={`${colors.text}88`} />
    </Pressable>
  );
}
