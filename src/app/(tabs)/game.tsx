// app/(tabs)/game.tsx
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function GameTab() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Мини-игры</Text>
      <Pressable onPress={() => router.push("/games/flashcards")}>
        <Text>Карточки</Text>
        <Text>Изучай иероглифы с помощью карточек</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/games/flashcards")}>
        <Text>Тоны</Text>
        <Text>Тренеруй произношение и различай тоны</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/games/flashcards")}>
        <Text>Написание иероглифов</Text>
        <Text>Учись писать иероглифы правильно </Text>
      </Pressable>
    </View>
  );
}
