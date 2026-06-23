// app/(game)/levels.tsx
import { levels } from "@/content/flashcards/levels";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function LevelsScreen() {
  const router = useRouter();

  const unlockedLevels = ["level-1", "level-2"];

  return (
    <View style={{ padding: 20, gap: 12 }}>
      {levels.map((level) => {
        const isLocked = !unlockedLevels.includes(level.id);

        return (
          <Pressable
            key={level.id}
            onPress={() => {
              if (isLocked) return;
              router.push(`../games/flashcards/${level.id}`);
            }}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: isLocked ? "#ddd" : "#fff",
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 18 }}>{level.title}</Text>

            <Text style={{ fontSize: 12 }}>
              {isLocked ? "Locked" : "Tap to play"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
