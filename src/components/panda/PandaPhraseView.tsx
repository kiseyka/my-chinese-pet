// src/components/panda/PandaPhraseView.tsx
//
// Фраза панды как маленький диалог, сверху вниз:
//   - шапка: значок панды и имя слева, справа озвучка и глазик пиньиня;
//   - фраза по словам (пиньинь при скрытии только прозрачный — фраза не прыгает);
//   - «Показать перевод» — плашка, которая на месте превращается в перевод;
//   - пояснение «Почему так говорят?» — сразу карточкой, если оно есть;
//   - у вопросов — варианты ответа; выбранный ответ встаёт справа, как сообщение
//     пользователя, а под ним — реакция панды.
// Тап по слову (во фразе, в ответе панды, по иероглифу в пояснении) — тултип над словом
// (если сверху нет места — под ним): пиньинь, перевод, «Повторение» и «Этап».
// В пояснении иероглифы подряд — одно выражение (送钟 целиком, а не 送 и 钟): перевод
// из note.terms, из самой фразы или из словаря.
// Тап мимо тултипа его закрывает.
// Варианты ответа — короткие (до 3 иероглифов) сеткой 2×2, длинные — списком на всю
// ширину. Пиньинь над иероглифами — по глазику, перевод под ними — по значку 文A;
// скрытые строки места не занимают.
// После ответа: свой ответ и реакция панды озвучиваются подряд, у обоих есть озвучка,
// перевод реакции — по ссылке «Перевод».
//
// compact — в списке профиля: без шапки и без выбора ответа (ответ, если был, показан).

import FlagIcon from "@/assets/images/icons/flag.svg";
import LanguagesIcon from "@/assets/images/icons/languages.svg";
import PandaIcon from "@/assets/images/icons/panda.svg";
import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import VolumeIcon from "@/assets/images/icons/volume.svg";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import type {
  PandaPhrase,
  PhraseLine,
  PhraseReply,
} from "@/content/panda/thoughtPhrases";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { findWordStage } from "@/utils/dictionary";
import {
  findWordByHanzi,
  phraseText,
  segmentNoteText,
  segmentPhrase,
  type NoteTerm,
  type PhraseSegment,
} from "@/utils/panda/phraseSegments";
import * as Speech from "expo-speech";
import { useRouter } from "expo-router";
import i18n from "i18next";
import { useMemo, useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { PandaText } from "./PandaText";

type IconProps = { width: number; height: number; color: string };

/** Ширина тултипа слова. */
const TIP_WIDTH = 260;
/** Насколько ниже точки касания показывать тултип. */
const TIP_OFFSET = 28;
/** Высота тултипа до первого замера. */
const TIP_HEIGHT = 140;

interface PandaPhraseViewProps {
  phrase: PandaPhrase;
  size?: number;
  compact?: boolean;
  /** Выбранный ответ на вопрос (id). */
  answer?: string;
  /** Выбрали ответ (только не в compact). */
  onAnswer?: (replyId: string) => void;
  /** Откуда открыт этап по кнопке «Этап» — туда вернёт «назад». */
  from: "pet" | "profile";
  /** Перед переходом на другой экран (например, закрыть панель). */
  onLeave?: () => void;
}

const isRussian = () => !!i18n.language?.startsWith("ru");

export function lineTranslation(line: PhraseLine): string {
  return isRussian() ? line.ru : line.en || line.ru;
}

export function phraseNote(phrase: PandaPhrase): string | undefined {
  if (!phrase.note) return undefined;
  return isRussian() ? phrase.note.ru : phrase.note.en || phrase.note.ru;
}

const hanOnly = (text: string) => text.replace(/[^\p{Script=Han}]/gu, "");

/**
 * Перевод выражения из пояснения: сначала note.terms, потом сама фраза, ответ или
 * реакция (我吃饱了 в пояснении — это фраза целиком). Иначе — словарь.
 */
function noteTerms(phrase: PandaPhrase): (run: string) => NoteTerm | undefined {
  const ru = isRussian();
  const lines: PhraseLine[] = [phrase];
  for (const reply of phrase.replies ?? []) {
    lines.push(reply);
    if (reply.reaction) lines.push(reply.reaction);
  }

  return (run) => {
    const term = phrase.note?.terms?.[run];
    if (term) {
      return { pinyin: term.pinyin, gloss: ru ? term.ru : term.en || term.ru };
    }
    const line = lines.find((l) => hanOnly(phraseText(l)) === run);
    if (line) {
      const pinyin = segmentPhrase(line)
        .filter((segment) => segment.isHan)
        .map((segment) => segment.pinyin)
        .join(" ");
      return { pinyin, gloss: lineTranslation(line) };
    }
    return undefined;
  };
}

interface Tip {
  segment: PhraseSegment;
  x: number;
  y: number;
}

export function PandaPhraseView({
  phrase,
  size,
  compact = false,
  answer,
  onAnswer,
  from,
  onLeave,
}: PandaPhraseViewProps) {
  const { t } = useTranslation("pandaThoughts");
  const { speakForced } = useSpeakHanzi();
  const segments = useMemo(() => segmentPhrase(phrase), [phrase]);

  // Тултип слова: координаты внутри этого блока
  const rootRef = useRef<View>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [tip, setTip] = useState<Tip | null>(null);

  const openTip = (segment: PhraseSegment, e: GestureResponderEvent) => {
    speakForced(segment.text);
    if (tip?.segment.text === segment.text) {
      setTip(null);
      return;
    }
    const { pageX, pageY } = e.nativeEvent;
    rootRef.current?.measureInWindow((x, y) => {
      setTip({ segment, x: pageX - x, y: pageY - y });
    });
  };

  const note = phraseNote(phrase);
  const termFor = useMemo(() => noteTerms(phrase), [phrase]);
  const reply = phrase.replies?.find((r) => r.id === answer);

  /** Озвучить ответ пользователя, а следом — реакцию панды. */
  const speakExchange = (option: PhraseReply) => {
    Speech.stop();
    Speech.speak(phraseText(option), {
      language: "zh-CN",
      onDone: () => {
        if (option.reaction) {
          Speech.speak(phraseText(option.reaction), { language: "zh-CN" });
        }
      },
    });
  };

  return (
    <Pressable
      ref={rootRef}
      onPress={() => setTip(null)}
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        setHeight(e.nativeEvent.layout.height);
      }}
      className="gap-4"
      // Тултип не прячется под кнопками ниже блока
      style={{ zIndex: 10, elevation: tip ? 10 : 0 }}
      // Тап по пустому месту только закрывает тултип, без отклика
      android_disableSound
    >
      {!compact && (
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
              <PandaIcon width={18} height={18} />
            </View>
            <Text className="font-nunitoBold text-body text-text">
              {t("pandaName")}
            </Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => speakForced(phraseText(phrase))}
              hitSlop={8}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={t("listen")}
            >
              <VolumeIcon width={24} height={24} color={`${colors.text}99`} />
            </Pressable>
            <PinyinToggle />
          </View>
        </View>
      )}

      <PandaText
        segments={segments}
        size={size}
        selected={tip?.segment ?? null}
        onWordPress={openTip}
      />

      <TranslationReveal key={phrase.id} line={phrase} compact={compact} />

      {note && (
        <View className="rounded-2xl bg-primary/10 px-4 py-3">
          <Text className="mb-1 font-nunitoBold text-small text-primary">
            {t("whyNote")}
          </Text>
          <MixedText
            text={note}
            termFor={termFor}
            className="font-nunito text-body text-text"
            selected={tip?.segment ?? null}
            onHanziPress={openTip}
          />
        </View>
      )}

      {/* Вопрос: варианты ответа или выбранный ответ и реакция панды */}
      {phrase.replies &&
        (reply ? (
          <Exchange
            reply={reply}
            selected={tip?.segment ?? null}
            onWordPress={openTip}
            onSpeak={speakForced}
          />
        ) : (
          !compact &&
          onAnswer && (
            <ReplyOptions
              replies={phrase.replies}
              onPick={(option) => {
                setTip(null);
                onAnswer(option.id);
                speakExchange(option);
              }}
            />
          )
        ))}

      {tip && width > 0 && (
        <WordTip
          key={`${tip.segment.text}-${tip.x}-${tip.y}`}
          tip={tip}
          containerWidth={width}
          containerHeight={height}
          from={from}
          onLeave={onLeave}
          onClose={() => setTip(null)}
        />
      )}
    </Pressable>
  );
}

// ── Перевод ──────────────────────────────────────────────────────────────────

/** Плашка «Показать перевод», которая на том же месте превращается в перевод. */
function TranslationReveal({
  line,
  compact,
}: {
  line: PhraseLine;
  compact: boolean;
}) {
  const { t } = useTranslation("pandaThoughts");
  const [shown, setShown] = useState(false);

  if (shown) {
    return (
      <Pressable
        onPress={() => setShown(false)}
        className="min-h-12 justify-center active:opacity-70"
      >
        <Text
          className={`font-nunito text-text ${compact ? "text-body" : "text-lead"}`}
        >
          {lineTranslation(line)}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => setShown(true)}
      className="min-h-12 justify-center rounded-2xl border border-dashed border-primary/40 px-4 active:opacity-70"
      accessibilityRole="button"
    >
      <Text className="font-nunito text-body text-primary">
        {t("showTranslation")}
      </Text>
    </Pressable>
  );
}

// ── Ответы ───────────────────────────────────────────────────────────────────

/** До скольких иероглифов варианты идут сеткой 2×2; длиннее — списком. */
const SHORT_REPLY_CHARS = 3;

const hanCount = (reply: PhraseReply) => hanOnly(phraseText(reply)).length;

/**
 * Варианты ответа: короткие — сеткой 2×2 (по центру), длинные — списком на всю ширину.
 * Над иероглифами — пиньинь (глазик в шапке), под ними — перевод (значок 文A).
 * Скрытые строки места не занимают: карточки плотные, без пустоты.
 */
function ReplyOptions({
  replies,
  onPick,
}: {
  replies: PhraseReply[];
  onPick: (reply: PhraseReply) => void;
}) {
  const { t } = useTranslation("pandaThoughts");
  const [showTranslation, setShowTranslation] = useState(false);

  const grid = replies.every((reply) => hanCount(reply) <= SHORT_REPLY_CHARS);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-nunito text-small text-textSecondary">
          {t("yourAnswer")}
        </Text>
        <SmallToggle
          Icon={LanguagesIcon}
          label={t("showTranslation")}
          active={showTranslation}
          onPress={() => setShowTranslation((v) => !v)}
        />
      </View>
      <View className={grid ? "flex-row flex-wrap justify-between gap-y-2" : "gap-2"}>
        {replies.map((option) => (
          <ReplyOption
            key={option.id}
            reply={option}
            grid={grid}
            showTranslation={showTranslation}
            onPress={() => onPick(option)}
          />
        ))}
      </View>
    </View>
  );
}

function ReplyOption({
  reply,
  grid,
  showTranslation,
  onPress,
}: {
  reply: PhraseReply;
  grid: boolean;
  showTranslation: boolean;
  onPress: () => void;
}) {
  const segments = useMemo(() => segmentPhrase(reply), [reply]);

  return (
    <Pressable
      onPress={onPress}
      className={`justify-center gap-1 rounded-2xl border border-primary/40 bg-surface px-4 py-2.5 active:bg-primary/10 ${
        grid ? "items-center" : "items-start"
      }`}
      style={grid ? { width: "48.5%", minHeight: 64 } : { minHeight: 56 }}
      accessibilityRole="button"
      accessibilityLabel={phraseText(reply)}
    >
      <PandaText segments={segments} size={grid ? 26 : 24} collapsePinyin />
      {showTranslation && (
        <Text
          className={`px-1 font-nunito text-small text-textSecondary ${
            grid ? "text-center" : ""
          }`}
        >
          {lineTranslation(reply)}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Выбранный ответ (справа, как сообщение пользователя) и реакция панды (слева).
 * У обоих — озвучка; перевод реакции — по ссылке «Перевод» (сначала только иероглифы).
 */
function Exchange({
  reply,
  selected,
  onWordPress,
  onSpeak,
}: {
  reply: PhraseReply;
  selected: PhraseSegment | null;
  onWordPress: (segment: PhraseSegment, e: GestureResponderEvent) => void;
  onSpeak: (text: string) => void;
}) {
  const { t } = useTranslation("pandaThoughts");
  const [showTranslation, setShowTranslation] = useState(false);
  const replySegments = useMemo(() => segmentPhrase(reply), [reply]);
  const reactionSegments = useMemo(
    () => (reply.reaction ? segmentPhrase(reply.reaction) : []),
    [reply],
  );

  return (
    <View className="gap-2">
      <Pressable
        onPress={() => onSpeak(phraseText(reply))}
        className="flex-row items-end gap-2 self-end rounded-2xl rounded-br-md bg-primary px-3 py-1.5 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={phraseText(reply)}
      >
        <PandaText segments={replySegments} size={22} light />
        <View className="pb-1.5">
          <VolumeIcon width={16} height={16} color="#FFFFFF" />
        </View>
      </Pressable>

      {reply.reaction && (
        <View className="flex-row items-start gap-2 self-start">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
            <PandaIcon width={18} height={18} />
          </View>
          <View className="shrink rounded-2xl rounded-tl-md bg-background/80 px-3 py-1.5">
            <View className="flex-row items-end gap-2">
              <View className="shrink">
                <PandaText
                  segments={reactionSegments}
                  size={24}
                  selected={selected}
                  onWordPress={onWordPress}
                />
              </View>
              <Pressable
                onPress={() => onSpeak(phraseText(reply.reaction!))}
                hitSlop={8}
                className="pb-1.5 active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel={t("listen")}
              >
                <VolumeIcon width={18} height={18} color={`${colors.text}99`} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => setShowTranslation((v) => !v)}
              hitSlop={6}
              className="self-start active:opacity-60"
              accessibilityRole="button"
            >
              <Text
                className={`font-nunito text-small ${
                  showTranslation ? "text-textSecondary" : "text-primary"
                }`}
              >
                {showTranslation
                  ? lineTranslation(reply.reaction)
                  : t("translation")}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function SmallToggle({
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
      className={`h-8 w-8 items-center justify-center rounded-full active:opacity-60 ${
        active ? "bg-primary" : ""
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon width={18} height={18} color={active ? "#FFFFFF" : `${colors.text}99`} />
    </Pressable>
  );
}

// ── Тултип слова ─────────────────────────────────────────────────────────────

function WordTip({
  tip,
  containerWidth,
  containerHeight,
  from,
  onLeave,
  onClose,
}: {
  tip: Tip;
  containerWidth: number;
  containerHeight: number;
  from: "pet" | "profile";
  onLeave?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { t: tp } = useTranslation("pandaThoughts");
  const router = useRouter();
  const { segment } = tip;
  const word = segment.word;

  const inReview = useWordProgressStore((s) =>
    word ? !!s.review[word.vocabularyId] : false,
  );
  const toggleReview = useWordProgressStore((s) => s.toggleReview);
  const stage = word ? findWordStage(word.vocabularyId) : undefined;

  const tipWidth = Math.min(TIP_WIDTH, containerWidth);
  const left = Math.max(
    0,
    Math.min(tip.x - tipWidth / 2, containerWidth - tipWidth),
  );

  // Над словом, а если сверху места нет (слово у самого верха) — под ним.
  // Высота — замеренная (до замера тултип прозрачный)
  const [measured, setMeasured] = useState<number | null>(null);
  const tipHeight = measured ?? TIP_HEIGHT;
  const above = tip.y - TIP_OFFSET / 2 - tipHeight >= 0;
  const top = above ? tip.y - TIP_OFFSET / 2 - tipHeight : tip.y + TIP_OFFSET;
  void containerHeight;

  const openStage = () => {
    if (!stage) return;
    onClose();
    onLeave?.();
    router.push({
      pathname: "/games/path/stage" as any,
      params: { id: stage.id, from },
    });
  };

  return (
    <Pressable
      onPress={onClose}
      onLayout={(e) => setMeasured(e.nativeEvent.layout.height)}
      className="absolute gap-2 rounded-2xl border border-border bg-surface p-3"
      style={{
        top,
        left,
        opacity: measured === null ? 0 : 1,
        width: tipWidth,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View className="flex-row items-center gap-3">
        <Hanzi size="sm">{segment.text}</Hanzi>
        <Pinyin size="md">{segment.pinyin || word?.pinyin || ""}</Pinyin>
      </View>
      <Text className="font-nunito text-small text-text" numberOfLines={3}>
        {wordTranslation(segment, t, tp("notInDictionary"))}
      </Text>

      {(word || stage) && (
        <View className="flex-row gap-2">
          {word && (
            <TipButton
              Icon={ReviewIcon}
              label={tp("review")}
              active={inReview}
              onPress={() => toggleReview(word.vocabularyId)}
            />
          )}
          {stage && (
            <TipButton
              Icon={FlagIcon}
              label={tp("toStage")}
              active={false}
              onPress={openStage}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

function TipButton({
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
      className={`min-h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-3 active:opacity-70 ${
        active ? "bg-primary" : "border border-primary/30 bg-surface"
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Icon width={16} height={16} color={active ? "#FFFFFF" : colors.primary} />
      <Text
        numberOfLines={1}
        className={`font-nunitoBold text-caption ${active ? "text-white" : "text-text"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Текст с иероглифами ──────────────────────────────────────────────────────

/** Обычный текст, в котором выражения из иероглифов подчёркнуты и нажимаются. */
function MixedText({
  text,
  termFor,
  className,
  selected,
  onHanziPress,
}: {
  text: string;
  termFor: (run: string) => NoteTerm | undefined;
  className: string;
  selected: PhraseSegment | null;
  onHanziPress: (segment: PhraseSegment, e: GestureResponderEvent) => void;
}) {
  const parts = useMemo(() => segmentNoteText(text, termFor), [text, termFor]);

  return (
    <Text className={className}>
      {parts.map((part, i) =>
        part.isHan ? (
          <Text
            key={i}
            onPress={(e) => onHanziPress(part, e)}
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

function wordTranslation(
  segment: PhraseSegment,
  t: (key: string) => string,
  missing: string,
): string {
  if (segment.gloss) return segment.gloss;
  if (segment.word) return t(segment.word.translation);

  // Слова целиком в словаре нет — по иероглифам
  const chars = Array.from(segment.text).map((char) => {
    const word = findWordByHanzi(char);
    return word ? `${char} — ${t(word.translation)}` : null;
  });
  const known = chars.filter(Boolean);
  return known.length > 0 ? known.join("; ") : missing;
}
