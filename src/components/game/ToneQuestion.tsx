// components/game/ToneQuestion.tsx
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
    <View className="flex-col gap-6 items-center py-6">
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onPlayAudio}
          activeOpacity={0.7}
          className="bg-primary rounded-full px-6 py-3 flex-row items-center gap-2"
        >
          <Text className="text-white text-lg">▶</Text>
          <Text className="text-white text-lg font-nunitoMedium">Играть</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPlaySlowAudio}
          activeOpacity={0.7}
          className="bg-background border border-border rounded-full px-5 py-3 flex-row items-center gap-2"
        >
          <Text className="text-text text-base">🐢</Text>
          <Text className="text-text text-base font-nunitoMedium">
            Медленно
          </Text>
        </TouchableOpacity>
      </View>

      <View className="justify-center items-center">
        <Text
          className="text-3xl font-nunitoMedium text-text"
          style={{ opacity: showPinyin ? 1 : 0 }}
        >
          {pinyinToDisplay}
        </Text>
      </View>

      {/* Иероглиф: место всегда зарезервировано, скрываем через opacity */}
      <View className="justify-center items-center">
        <Text
          style={{
            fontFamily: "NotoSansSC",
            opacity: showHanzi ? 1 : 0,
          }}
          className="text-3xl text-text"
        >
          {hanzi}
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3 w-full px-4">
        {TONE_OPTION_DEFS.map(({ tone, label, arrow }) => {
          const isCorrect = tone === correctTone;
          const isSelected = tone === selectedTone;

          let buttonStyle = "bg-background border border-border/50";
          let textStyle = "text-text";
          let containerStyle = "";

          if (isAnswered) {
            if (isCorrect) {
              buttonStyle = "bg-primary border border-primary";
              textStyle = "text-white";
            } else if (isSelected) {
              buttonStyle = "bg-accentBeige border border-accentBeige";
            } else {
              containerStyle = "opacity-40";
            }
          }

          return (
            <TouchableOpacity
              key={tone}
              disabled={isAnswered}
              onPress={() => onSelectTone(tone)}
              className={`rounded-2xl px-5 py-4 w-[45%] items-center ${buttonStyle} ${containerStyle}`}
            >
              <Text className={`text-2xl ${textStyle}`}>{arrow}</Text>
              <Text className={`text-xl font-nunitoMedium mt-1 ${textStyle}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
