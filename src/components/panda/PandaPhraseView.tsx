// src/components/panda/PandaPhraseView.tsx
//
// Фраза панды, которую можно разобрать: тап по слову — под фразой строка с этим словом
// (иероглиф, пиньинь, перевод из словаря; тап по строке — озвучка). Повторный тап по
// тому же слову убирает строку. Перевод всей фразы — по showTranslation.
// Используется в реплике панды и в коллекции «Фразы панды» в профиле.

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { PandaPhrase } from "@/content/panda/thoughtPhrases";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import {
  findWordByHanzi,
  phraseText,
  segmentPhrase,
  type PhraseSegment,
} from "@/utils/panda/phraseSegments";
import i18n from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { PandaText } from "./PandaText";

interface PandaPhraseViewProps {
  phrase: PandaPhrase;
  showTranslation: boolean;
  showNote?: boolean;
  size?: number;
}

const isRussian = () => !!i18n.language?.startsWith("ru");

export function phraseTranslation(phrase: PandaPhrase): string {
  return isRussian() ? phrase.ru : phrase.en || phrase.ru;
}

export function phraseNote(phrase: PandaPhrase): string | undefined {
  if (!phrase.note) return undefined;
  return isRussian() ? phrase.note.ru : phrase.note.en || phrase.note.ru;
}

export function PandaPhraseView({
  phrase,
  showTranslation,
  showNote = false,
  size,
}: PandaPhraseViewProps) {
  const { t } = useTranslation();
  const { speakForced } = useSpeakHanzi();
  const segments = useMemo(() => segmentPhrase(phrase), [phrase]);
  const [selected, setSelected] = useState<PhraseSegment | null>(null);

  const select = (segment: PhraseSegment) => {
    if (segment === selected) {
      setSelected(null);
      return;
    }
    setSelected(segment);
    speakForced(segment.text);
  };

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => speakForced(phraseText(phrase))}
        className="self-start active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Послушать фразу"
      >
        <PandaText
          segments={segments}
          size={size}
          selected={selected}
          onWordPress={select}
        />
      </Pressable>

      {selected && (
        <Pressable
          onPress={() => speakForced(selected.text)}
          className="flex-row items-center gap-3 rounded-2xl bg-background/70 px-3 py-2 active:opacity-70"
        >
          <Hanzi size="sm">{selected.text}</Hanzi>
          <View className="flex-1">
            <Pinyin size="sm">{selected.pinyin}</Pinyin>
            <Text
              className="font-nunito text-small text-textSecondary"
              numberOfLines={2}
            >
              {wordTranslation(selected, t)}
            </Text>
          </View>
        </Pressable>
      )}

      {showTranslation && (
        <Text className="font-nunito text-lead text-text">
          {phraseTranslation(phrase)}
        </Text>
      )}

      {showNote && phrase.note && (
        <View className="rounded-2xl bg-primary/10 px-4 py-3">
          <Text className="font-nunito text-body text-text">
            {phraseNote(phrase)}
          </Text>
        </View>
      )}
    </View>
  );
}

function wordTranslation(
  segment: PhraseSegment,
  t: (key: string) => string,
): string {
  if (segment.word) return t(segment.word.translation);

  // Слова целиком в словаре нет — по иероглифам
  return Array.from(segment.text)
    .map((char) => {
      const word = findWordByHanzi(char);
      return word ? `${char} — ${t(word.translation)}` : char;
    })
    .join("; ");
}
