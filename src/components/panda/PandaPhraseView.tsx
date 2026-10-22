// src/components/panda/PandaPhraseView.tsx
//
// Фраза панды, которую можно разобрать. Сверху справа — значки:
//   👁 пиньинь над словами (общая настройка, как в тренировках);
//   文A перевод фразы;
//   ⓘ «Почему так говорят?» — только у фраз с пояснением.
// Под фразой — одна панель, в ней по очереди: подсказка «тапни по слову», слово
// (иероглиф, пиньинь, перевод; тап — озвучка), перевод или пояснение. Иероглифы
// в переводе и пояснении тоже нажимаются: слово показывается строкой внизу панели.
//
// Чтобы окно не прыгало:
//   - скрытый пиньинь только прозрачный, место под ним остаётся (PandaText);
//   - высота панели — по самому высокому её содержимому: все варианты лежат в ряд
//     в одной полосе, видна только нужная, а высота полосы — по самой высокой.

import InfoIcon from "@/assets/images/icons/info.svg";
import LanguagesIcon from "@/assets/images/icons/languages.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import type { PandaPhrase } from "@/content/panda/thoughtPhrases";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { colors } from "@/theme/colors";
import {
  findWordByHanzi,
  phraseText,
  segmentMixedText,
  segmentPhrase,
  type PhraseSegment,
} from "@/utils/panda/phraseSegments";
import i18n from "i18next";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { PandaText } from "./PandaText";

type IconProps = { width: number; height: number; color: string };

type Panel = "hint" | "word" | "translation" | "note";

interface PandaPhraseViewProps {
  phrase: PandaPhrase;
  size?: number;
  /**
   * В списке (профиль): без подсказки «тапни по слову», панель появляется
   * только когда что-то открыто.
   */
  compact?: boolean;
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
  size,
  compact = false,
}: PandaPhraseViewProps) {
  const { t } = useTranslation("pandaThoughts");
  const { speakForced } = useSpeakHanzi();
  const segments = useMemo(() => segmentPhrase(phrase), [phrase]);

  const [panel, setPanel] = useState<Panel>("hint");
  /** Слово из фразы (панель «word»). */
  const [word, setWord] = useState<PhraseSegment | null>(null);
  /** Иероглиф, нажатый в переводе или пояснении (строка внизу панели). */
  const [inlineWord, setInlineWord] = useState<PhraseSegment | null>(null);

  const selectWord = (segment: PhraseSegment) => {
    setInlineWord(null);
    if (panel === "word" && segment === word) {
      setPanel("hint");
      setWord(null);
      return;
    }
    setWord(segment);
    setPanel("word");
    speakForced(segment.text);
  };

  const toggle = (next: "translation" | "note") => {
    setInlineWord(null);
    setWord(null);
    setPanel((current) => (current === next ? "hint" : next));
  };

  const selectInline = (segment: PhraseSegment) => {
    setInlineWord((current) => (current?.text === segment.text ? null : segment));
    speakForced(segment.text);
  };

  const note = phraseNote(phrase);

  const pages: Array<{ id: Panel; content: ReactNode }> = [
    {
      id: "hint",
      content: compact ? null : (
        <Text className="font-nunito text-small text-textSecondary">
          {t("phraseHint")}
        </Text>
      ),
    },
    {
      id: "word",
      content: word && (
        <WordLine segment={word} onSpeak={() => speakForced(word.text)} />
      ),
    },
    {
      id: "translation",
      content: (
        <MixedText
          text={phraseTranslation(phrase)}
          className="font-nunito text-lead text-text"
          selected={inlineWord}
          onHanziPress={selectInline}
        />
      ),
    },
    ...(note
      ? [
          {
            id: "note" as const,
            content: (
              <MixedText
                text={note}
                className="font-nunito text-body text-text"
                selected={inlineWord}
                onHanziPress={selectInline}
              />
            ),
          },
        ]
      : []),
  ];

  const hasInline = panel === "translation" || panel === "note";

  return (
    <View className="gap-3">
      {/* Значки */}
      <View className="flex-row items-center justify-end gap-4">
        {/* В списке профиля глазик один, в шапке блока */}
        {!compact && <PinyinToggle />}
        <IconToggle
          Icon={LanguagesIcon}
          label={t("showTranslation")}
          active={panel === "translation"}
          onPress={() => toggle("translation")}
        />
        {note && (
          <IconToggle
            Icon={InfoIcon}
            label={t("whyNote")}
            active={panel === "note"}
            onPress={() => toggle("note")}
          />
        )}
      </View>

      <Pressable
        onPress={() => speakForced(phraseText(phrase))}
        className="self-start active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={t("listen")}
      >
        <PandaText
          segments={segments}
          size={size}
          selected={panel === "word" ? word : null}
          onWordPress={selectWord}
        />
      </Pressable>

      {(!compact || panel !== "hint") && (
        <View className="rounded-2xl bg-background/70 px-4 py-3">
          <StablePages pages={pages} active={panel} />
          {/* Строка под переводом и пояснением: место есть всегда (на подсказке и
              слове она просто прозрачная), чтобы панель не меняла высоту */}
          {(hasInline || !compact) && (
            <View
              className="mt-2 min-h-11 justify-center border-t border-border pt-2"
              style={{ opacity: hasInline ? 1 : 0 }}
              pointerEvents={hasInline ? "auto" : "none"}
            >
              {inlineWord ? (
                <WordLine
                  segment={inlineWord}
                  onSpeak={() => speakForced(inlineWord.text)}
                />
              ) : (
                <Text className="font-nunito text-caption text-textSecondary">
                  {t("inlineHint")}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Все страницы лежат в ряд, полоса сдвигается к нужной. Высота ряда — по самой
 * высокой странице, поэтому при переключении высота не меняется.
 */
function StablePages({
  pages,
  active,
}: {
  pages: Array<{ id: Panel; content: ReactNode }>;
  active: Panel;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    pages.findIndex((page) => page.id === active),
  );

  return (
    <View
      className="overflow-hidden"
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
    >
      {width === 0 ? (
        // Первый кадр, ширина ещё неизвестна — только нужная страница
        <View>{pages[index]?.content}</View>
      ) : (
        <View
          className="flex-row"
          style={{ width: width * pages.length, marginLeft: -width * index }}
        >
          {pages.map((page) => (
            <View
              key={page.id}
              style={{ width, opacity: page.id === active ? 1 : 0 }}
              pointerEvents={page.id === active ? "auto" : "none"}
              className="justify-center"
            >
              {page.content}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** Иероглиф, пиньинь и перевод одной строкой; тап — озвучка. */
function WordLine({
  segment,
  onSpeak,
}: {
  segment: PhraseSegment;
  onSpeak: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onSpeak}
      className="flex-row items-center gap-3 active:opacity-70"
    >
      <Hanzi size="sm">{segment.text}</Hanzi>
      <View className="flex-1">
        <Pinyin size="sm">{segment.pinyin || " "}</Pinyin>
        <Text
          className="font-nunito text-small text-textSecondary"
          numberOfLines={2}
        >
          {wordTranslation(segment, t)}
        </Text>
      </View>
    </Pressable>
  );
}

/** Обычный текст, в котором иероглифы подчёркнуты и нажимаются. */
function MixedText({
  text,
  className,
  selected,
  onHanziPress,
}: {
  text: string;
  className: string;
  selected: PhraseSegment | null;
  onHanziPress: (segment: PhraseSegment) => void;
}) {
  const parts = useMemo(() => segmentMixedText(text), [text]);

  return (
    <Text className={className}>
      {parts.map((part, i) =>
        part.isHan ? (
          <Text
            key={i}
            onPress={() => onHanziPress(part)}
            suppressHighlighting
            style={{
              color: colors.primary,
              textDecorationLine: "underline",
              backgroundColor:
                selected?.text === part.text ? `${colors.primary}22` : undefined,
            }}
          >
            {part.text}
          </Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        ),
      )}
    </Text>
  );
}

function IconToggle({
  Icon,
  label,
  active,
  onPress,
}: {
  Icon: ComponentType<IconProps>;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className={`h-9 w-9 items-center justify-center rounded-full active:opacity-60 ${
        active ? "bg-primary" : ""
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon
        width={20}
        height={20}
        color={active ? "#FFFFFF" : `${colors.text}99`}
      />
    </Pressable>
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
