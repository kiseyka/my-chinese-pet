// src/components/panda/PandaDialogBubble.tsx

import type { DialogReply } from "@/content/panda/scenarios";
import type { DialogPhrase } from "@/utils/pandaDialog";
import { Pressable, Text, View } from "react-native";

interface PandaDialogBubbleProps {
  text: string;
  phrase?: DialogPhrase;
  replies: DialogReply[];
  onReply: (index: number) => void;
  onSpeakPhrase: () => void;
  onClose: () => void;
}

export function PandaDialogBubble({
  text,
  phrase,
  replies,
  onReply,
  onSpeakPhrase,
  onClose,
}: PandaDialogBubbleProps) {
  // Варианты квиза идут столбиком: переводы бывают длинными
  const isQuiz = replies.some((reply) => reply.isCorrect !== undefined);

  return (
    <View className="rounded-3xl bg-surface px-5 py-5 gap-4">
      <Text className="font-nunito text-xl leading-7 text-text">{text}</Text>

      {phrase && (
        <View className="flex-row items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3">
          <View className="flex-1 gap-1">
            <Text className="font-nunito text-2xl text-text">
              {phrase.hanzi}
            </Text>
            <Text className="font-nunito text-base text-text">
              {phrase.pinyin}
            </Text>
            {phrase.translation !== "" && (
              <Text className="font-nunito text-base text-text">
                {phrase.translation}
              </Text>
            )}
          </View>

          <Pressable
            onPress={onSpeakPhrase}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary"
          >
            <Text style={{ fontSize: 22 }}>🔊</Text>
          </Pressable>
        </View>
      )}

      {replies.length > 0 ? (
        isQuiz ? (
          <View className="gap-3">
            {replies.map((reply, index) => (
              <Pressable
                key={index}
                onPress={() => onReply(index)}
                className="min-h-12 justify-center rounded-2xl bg-primary px-5 py-3"
              >
                <Text className="font-nunito text-base text-white">
                  {reply.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-end gap-3">
            {replies.map((reply, index) => (
              <Pressable
                key={index}
                onPress={() => onReply(index)}
                className="min-h-12 justify-center rounded-full bg-primary px-6 py-3"
              >
                <Text className="font-nunito text-base text-white">
                  {reply.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      ) : (
        <View className="flex-row justify-end">
          <Pressable
            onPress={onClose}
            className="min-h-12 justify-center rounded-full bg-primary px-6 py-3"
          >
            <Text className="font-nunito text-base text-white">Понятно!</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
