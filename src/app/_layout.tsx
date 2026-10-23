import { warmUpSpeech } from "@/hooks/useSpeakHanzi";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  // Озвучка готова к первой фразе панды
  useEffect(() => warmUpSpeech(), []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
