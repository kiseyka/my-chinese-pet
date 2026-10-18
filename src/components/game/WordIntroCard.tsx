// src/components/game/WordIntroCard.tsx
//
// Знакомство с новым словом в тренировке перевода. Слово, которое человек видит
// впервые, сначала показывается этой карточкой, а сразу после неё идёт вопрос —
// так выбор перевода перестаёт быть угадайкой.
//
// На карточке: иероглиф (тап — озвучка, звучит и сам при показе), пиньинь, перевод
// и «Из чего состоит»: части каждого знака. Если часть сама есть в словаре отдельным
// словом — рядом её перевод: 好 = 女 «женщина» + 子 «ребёнок».
// Части берутся из данных Make Me a Hanzi (scripts/build-hanzi-data.mjs).

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { allWords } from "@/content/words/vocabulary";
import { getHanzi } from "@/content/writing/hanzi";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface WordIntroCardProps {
  hanzi: string;
  pinyin: string;
  /** Ключ перевода (как у вопроса). */
  translation: string;
  onContinue: () => void;
}

/** Слова из одного знака — по знаку: чтобы подписать части их переводом. */
let singleByHanzi: Map<string, string> | null = null;
function translationOfChar(char: string): string | undefined {
  if (!singleByHanzi) {
    singleByHanzi = new Map();
    for (const word of allWords) {
      if (Array.from(word.hanzi).length === 1 && !singleByHanzi.has(word.hanzi)) {
        singleByHanzi.set(word.hanzi, word.translation);
      }
    }
  }
  return singleByHanzi.get(char);
}

/** Части знака: из разбиения на части, иначе — из разложения (без ⿰⿱ и т. п.). */
function partsOf(char: string): string[] {
  const data = getHanzi(char);
  if (!data) return [];

  const labels = data.parts?.map((part) => part.label) ?? [];
  if (labels.length >= 2) return labels;

  const fromDecomposition = Array.from(data.decomposition ?? "").filter(
    (symbol) => /\p{Script=Han}/u.test(symbol) && symbol !== char,
  );
  return fromDecomposition.length >= 2 ? fromDecomposition : [];
}

export function WordIntroCard({
  hanzi,
  pinyin,
  translation,
  onContinue,
}: WordIntroCardProps) {
  const { t } = useTranslation(["sets"]);
  const { speak, speakForced } = useSpeakHanzi();

  useEffect(() => {
    speak(hanzi);
  }, [hanzi, speak]);

  // Разбор по знакам: только те, что делятся хотя бы на две части
  const breakdown = useMemo(
    () =>
      Array.from(new Set(Array.from(hanzi)))
        .map((char) => ({ char, parts: partsOf(char) }))
        .filter((item) => item.parts.length >= 2),
    [hanzi],
  );

  return (
    <View className="flex-1 gap-6 pt-6">
      <Text className="text-center font-nunitoBold text-small uppercase tracking-widest text-primary">
        Новое слово
      </Text>

      <View className="items-center gap-2">
        <Pressable
          onPress={() => speakForced(hanzi)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Послушать ${hanzi}`}
        >
          <Hanzi
            size={Array.from(hanzi).length > 2 ? 56 : 80}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {hanzi}
          </Hanzi>
        </Pressable>
        <Pinyin>{pinyin}</Pinyin>
        <Text className="text-center font-nunitoBold text-title text-text">
          {t(translation)}
        </Text>
      </View>

      {breakdown.length > 0 && (
        <View className="gap-3 rounded-2xl bg-surface p-4">
          <Text className="font-nunitoBold text-body text-text">
            Из чего состоит
          </Text>
          {breakdown.map(({ char, parts }) => (
            <View
              key={char}
              className="flex-row flex-wrap items-center gap-x-2 gap-y-1"
            >
              <Hanzi size={28}>{char}</Hanzi>
              <Text className="font-nunito text-lead text-textSecondary">=</Text>
              {parts.map((part, index) => {
                const meaning = translationOfChar(part);
                return (
                  <View
                    key={`${part}-${index}`}
                    className="flex-row items-center gap-1"
                  >
                    {index > 0 && (
                      <Text className="mr-1 font-nunito text-lead text-textSecondary">
                        +
                      </Text>
                    )}
                    <Hanzi size={24}>{part}</Hanzi>
                    {meaning && (
                      <Text
                        numberOfLines={1}
                        className="max-w-28 font-nunito text-small text-textSecondary"
                      >
                        «{t(meaning).split(";")[0].trim()}»
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <View className="flex-1" />

      <Pressable
        onPress={onContinue}
        className="mb-4 min-h-14 items-center justify-center rounded-full bg-primary px-8 active:opacity-80"
        accessibilityRole="button"
      >
        <Text className="font-nunitoBold text-body text-white">Понятно</Text>
      </Pressable>
    </View>
  );
}
