import { useVocabularyStore } from "@/store/vocabularyStore";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const loadVocabulary = useVocabularyStore((state) => state.load);

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
