// src/components/panda/PandaText.tsx
//
// Китайский текст панды по словам: пиньинь над каждым словом (если включён глазиком),
// знаки препинания прилипают к предыдущему слову — точка не уезжает одна на новую строку.
// Если передан onWordPress, слова подчёркнуты тонкой линией и нажимаются.

import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import { segmentReply, type ChatSegment } from "@/utils/panda/chatSegments";
import { useMemo } from "react";
import { Pressable, View } from "react-native";

interface PandaTextProps {
  text: string;
  syllables?: string[];
  words?: string[];
  size?: number;
  onWordPress?: (segment: ChatSegment) => void;
}

/** Слово и знаки после него — один неразрывный блок. */
interface Group {
  word?: ChatSegment;
  tail: string;
}

function groupSegments(segments: ChatSegment[]): Group[] {
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
  text,
  syllables,
  words,
  size = 26,
  onWordPress,
}: PandaTextProps) {
  const showPinyin = useSettingsStore((s) => s.showPinyin);
  const groups = useMemo(
    () => groupSegments(segmentReply(text, syllables, words)),
    [text, syllables, words],
  );

  return (
    <View className="flex-row flex-wrap items-end">
      {groups.map(({ word, tail }, i) => (
        <View key={i} className="flex-row items-end">
          {word && (
            <Pressable
              onPress={onWordPress ? () => onWordPress(word) : undefined}
              disabled={!onWordPress}
              className={`items-center active:opacity-50 ${
                showPinyin ? "px-1" : onWordPress ? "mx-0.5" : ""
              }`}
              accessibilityRole={onWordPress ? "button" : undefined}
              accessibilityLabel={word.text}
            >
              {showPinyin && <Pinyin size="sm">{word.pinyin || " "}</Pinyin>}
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
                <Hanzi size={size}>{word.text}</Hanzi>
              </View>
            </Pressable>
          )}
          {!!tail && (
            <View className="items-center">
              {showPinyin && <Pinyin size="sm"> </Pinyin>}
              <Hanzi size={size}>{tail}</Hanzi>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
