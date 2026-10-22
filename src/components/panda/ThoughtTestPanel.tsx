// src/components/panda/ThoughtTestPanel.tsx
//
// Только для проверки мыслей панды: маленькие кнопки на экране панды.
// Видны только в режиме разработки (__DEV__ — dev-клиент, `npx expo start`);
// в preview- и релизной сборке их нет. Выключить совсем — SHOW_THOUGHT_TEST_PANEL.
//
//   Фраза / Вопрос / Выбрать / Написать — сразу облачко с мыслью этого вида (без правил и лимитов);
//   Сброс — убрать облачко, сбросить паузу и лимиты (мыслей и игр по тапу).

import {
  resetTestThoughts,
  showTestThought,
  type TestThought,
} from "@/utils/panda/thoughts";
import { Pressable, Text, View } from "react-native";

const SHOW_THOUGHT_TEST_PANEL = true;

const BUTTONS: Array<{ label: string; type: TestThought }> = [
  { label: "Фраза", type: "phrase" },
  { label: "Вопрос", type: "question" },
  { label: "Выбрать", type: "pick" },
  { label: "Написать", type: "write" },
];

export function ThoughtTestPanel() {
  if (!__DEV__ || !SHOW_THOUGHT_TEST_PANEL) return null;

  return (
    <View className="z-10 flex-row flex-wrap justify-end gap-1 px-2 pt-2">
      {BUTTONS.map(({ label, type }) => (
        <TestButton key={type} label={label} onPress={() => showTestThought(type)} />
      ))}
      <TestButton label="Сброс" onPress={resetTestThoughts} />
    </View>
  );
}

function TestButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border border-dashed border-primary bg-surface/80 px-3 py-1 active:opacity-60"
    >
      <Text className="font-nunito text-caption text-text">🧪 {label}</Text>
    </Pressable>
  );
}
