import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { VocabularyWordItem } from "@/components/VocabularyWordItem";
import { allWords } from "@/content/flashcards/data";
import { getMasteryBucket } from "@/services/storage/progressStorage";
import { useVocabularyStore } from "@/store/vocabularyStore";
import { colors } from "@/theme/colors";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

type WordFilter = "all" | "favorites" | "learned" | "inProgress";

export default function VocabularyScreen() {
  const progress = useVocabularyStore((s) => s.progress);
  const toggleFavorite = useVocabularyStore((s) => s.toggleFavorite);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WordFilter>("all");
  const { t } = useTranslation(["sets"]);

  const filteredWords = useMemo(() => {
    if (!progress) {
      return [];
    }

    const query = search.trim().toLowerCase();

    if (!query && filter === "all") {
      return allWords;
    }

    return allWords.filter((word) => {
      const vocabWordProgress = progress.vocabulary.words[word.vocabularyId];

      if (filter === "favorites" && !vocabWordProgress?.isFavorite) {
        return false;
      }

      if (filter === "learned" || filter === "inProgress") {
        const skillProgress = progress.flashcards.words[word.vocabularyId];

        const bucket = getMasteryBucket(
          skillProgress,
          vocabWordProgress?.isKnown ?? false,
        );

        if (filter === "learned" && bucket !== "learned") {
          return false;
        }

        if (filter === "inProgress" && bucket !== "recognizing") {
          return false;
        }
      }

      if (query) {
        const matchesSearch =
          word.hanzi.toLowerCase().includes(query) ||
          word.pinyin.toLowerCase().includes(query) ||
          t(word.translation).toLowerCase().includes(query);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [search, filter, progress, t]);

  const handleToggleFavorite = useCallback(
    (wordId: string) => {
      toggleFavorite(wordId);
    },
    [toggleFavorite],
  );

  if (!progress) {
    return null;
  }

  return (
    <Screen>
      {/* Header */}
      <View className="flex-row justify-between">
        <BackButton href="/pet" />

        <Text className="text-3xl font-nunito self-center">Словарь</Text>

        <View className="w-10" />
      </View>

      {/* Search + filters */}
      <View className="my-4">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Найти слово..."
          placeholderTextColor={colors.textSecondary}
          className="rounded-2xl bg-surface/60 px-4 py-3 mb-3 text-text"
        />

        <View className="flex-row gap-2">
          <FilterButton
            title="Все"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />

          <FilterButton
            title="Избранное"
            active={filter === "favorites"}
            onPress={() => setFilter("favorites")}
          />

          <FilterButton
            title="Изучено"
            active={filter === "learned"}
            onPress={() => setFilter("learned")}
          />

          <FilterButton
            title="В процессе"
            active={filter === "inProgress"}
            onPress={() => setFilter("inProgress")}
          />
        </View>
      </View>

      {/* Words */}
      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.vocabularyId}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => {
          const wordProgress = progress.vocabulary.words[item.vocabularyId];

          return (
            <VocabularyWordItem
              word={item}
              isFavorite={wordProgress?.isFavorite ?? false}
              onToggleFavorite={handleToggleFavorite}
            />
          );
        }}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-text text-lg text-center">
              {filter === "favorites"
                ? "У тебя пока нет избранных слов ⭐"
                : search
                  ? "Ничего не найдено"
                  : "Словарь пока пуст"}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function FilterButton({
  title,
  active = false,
  onPress,
}: {
  title: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 ${
        active ? "bg-primaryDark" : "bg-surface/60"
      }`}
    >
      <Text className={active ? "text-white" : "text-text"}>{title}</Text>
    </Pressable>
  );
}
