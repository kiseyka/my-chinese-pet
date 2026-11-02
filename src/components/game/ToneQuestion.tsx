// components/game/ToneQuestion.tsx

import { getOptionState, OPTION_STYLES } from "@/components/game/AnswerOption";
import { Text, TouchableOpacity, View } from "react-native";

interface ToneQuestionProps {
  hanzi: string;
  blankedPinyin: string;
  fullPinyin: string;
  correctTone: number;
  selectedTone: number | null;
  isAnswered: boolean;
  showHanzi: boolean;
  showPinyin: boolean;
  onSelectTone: (tone: number) => void;
  onPlayAudio: () => void;
  onPlaySlowAudio: () => void;
}

const TONE_OPTION_DEFS = [
  { tone: 1, label: "1-й тон", arrow: "→" },
  { tone: 2, label: "2-й тон", arrow: "↗" },
  { tone: 3, label: "3-й тон", arrow: "⌄" },
  { tone: 4, label: "4-й тон", arrow: "↘" },
];

export function ToneQuestion({
  hanzi,
  blankedPinyin,
  fullPinyin,
  correctTone,
  selectedTone,
  isAnswered,
  showHanzi,
  showPinyin,
  onSelectTone,
  onPlayAudio,
  onPlaySlowAudio,
}: ToneQuestionProps) {
  const pinyinToDisplay = isAnswered ? fullPinyin : blankedPinyin;

  return (
    <View className="flex-col items-center gap-6 py-6">
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onPlayAudio}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 rounded-full bg-primary px-6 py-3"
        >
          <Text className="text-lg text-white">▶</Text>
          <Text className="text-lg font-nunitoMedium text-white">Играть</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPlaySlowAudio}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 rounded-full bg-surface px-5 py-3"
        >
          <Text className="text-base text-text">🐢</Text>
          <Text className="text-base font-nunitoMedium text-text">
            Медленно
          </Text>
        </TouchableOpacity>
      </View>

      <View className="items-center justify-center">
        <Text
          className="text-3xl font-nunitoMedium text-text"
          style={{ opacity: showPinyin ? 1 : 0 }}
        >
          {pinyinToDisplay}
        </Text>
      </View>

      {/* Иероглиф: место всегда зарезервировано, скрываем через opacity */}
      <View className="items-center justify-center">
        <Text
          className="text-3xl text-text"
          style={{ fontFamily: "NotoSansSC", opacity: showHanzi ? 1 : 0 }}
        >
          {hanzi}
        </Text>
      </View>

      <View className="w-full flex-row flex-wrap justify-center gap-3 px-4">
        {TONE_OPTION_DEFS.map(({ tone, label, arrow }) => {
          const state = getOptionState(
            isAnswered,
            tone === correctTone,
            tone === selectedTone,
          );
          const { button, text } = OPTION_STYLES[state];

          return (
            <TouchableOpacity
              key={tone}
              disabled={isAnswered}
              onPress={() => onSelectTone(tone)}
              className={`w-[45%] items-center rounded-xl border-2 py-4 ${button}`}
            >
              <Text className={`text-2xl ${text}`}>{arrow}</Text>
              <Text className={`mt-1 text-xl font-nunitoMedium ${text}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
