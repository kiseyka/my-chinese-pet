// src/components/panda/PandaText.tsx
//
// Китайская фраза панды по словам: пиньинь над каждым словом (если включён глазиком),
// знаки препинания прилипают к предыдущему слову — точка не уезжает одна на новую строку.
// Скрытый пиньинь только прозрачный, а место под ним остаётся: переключение глазиком
// не двигает фразу.
// collapsePinyin — скрытый пиньинь не занимает места (варианты ответа: без пустых строк).
// Если передан onWordPress, слова подчёркнуты тонкой линией и нажимаются.

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import type { PhraseSegment } from "@/utils/panda/phraseSegments";
import { useMemo } from "react";
import { Pressable, View, type GestureResponderEvent } from "react-native";

interface PandaTextProps {
  segments: PhraseSegment[];
  size?: number;
  /** Выбранное слово (подсвечено). */
  selected?: PhraseSegment | null;
  /** Тап по слову; событие — чтобы показать тултип у места касания. */
  onWordPress?: (segment: PhraseSegment, e: GestureResponderEvent) => void;
  /** Белый текст — на зелёном фоне (ответ пользователя). */
  light?: boolean;
  /** Скрытый пиньинь убирать совсем, а не оставлять пустую строку. */
  collapsePinyin?: boolean;
}

/** Слово и знаки после него — один неразрывный блок. */
interface Group {
  word?: PhraseSegment;
  tail: string;
}

function groupSegments(segments: PhraseSegment[]): Group[] {
  const groups: Group[] = [];
  for (const segment of segments) {
    if (segment.isHan) {
      groups.push({ word: segment, tail: "" });
    } else if (groups.length > 0) {
      groups[groups.length - 1].tail += segment.text;
    } else {
      groups.push({ tail: segment.text });
    }
  }
  return groups;
}

export function PandaText({
  segments,
  size = 30,
  selected,
  onWordPress,
  light = false,
  collapsePinyin = false,
}: PandaTextProps) {
  const hanziClass = light ? "text-white" : undefined;
  const pinyinClass = light ? "text-white" : "";
  const showPinyin = useSettingsStore((s) => s.showPinyin);
  const groups = useMemo(() => groupSegments(segments), [segments]);
  const pinyinRow = showPinyin || !collapsePinyin;

  return (
    <View className="flex-row flex-wrap items-end">
      {groups.map(({ word, tail }, i) => (
        <View key={i} className="flex-row items-end">
          {word && (
            <Pressable
              onPress={onWordPress ? (e) => onWordPress(word, e) : undefined}
              disabled={!onWordPress}
              className={`items-center rounded-lg px-1 active:opacity-50 ${
                word === selected ? "bg-primary/15" : ""
              }`}
              accessibilityRole={onWordPress ? "button" : undefined}
              accessibilityLabel={word.text}
            >
              {pinyinRow && (
                <Pinyin
                  size="sm"
                  className={pinyinClass}
                  style={{ opacity: showPinyin ? (light ? 0.85 : 1) : 0 }}
                >
                  {word.pinyin || " "}
                </Pinyin>
              )}
              {/* Линия под словом — рамкой, а не подчёркиванием текста:
                  цвет и толщина подчёркивания на Android не настраиваются */}
              <View
                style={
                  onWordPress
                    ? {
                        borderBottomWidth: 1.5,
                        borderBottomColor: `${colors.primary}66`,
                      }
                    : undefined
                }
              >
                <Hanzi size={size} className={hanziClass}>
                  {word.text}
                </Hanzi>
              </View>
            </Pressable>
          )}
          {!!tail && (
            <View className="items-center">
              {pinyinRow && <Pinyin size="sm"> </Pinyin>}
              <Hanzi size={size} className={hanziClass}>
                {tail}
              </Hanzi>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
