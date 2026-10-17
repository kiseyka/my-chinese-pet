// app/(game)/games.tsx  (твой путь к файлу экрана)

import { GameCard } from "@/components/game/GameCard";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

// Путь — изучение по темам, «Словарь» — все слова, свои тренировки, наборы,
// «Повторение» и экзамен; «Тоны» — отдельная игра на слух.
const games = [
  {
    id: "path",
    title: "games.path.title",
    description: "games.path.description",
    route: "/games/path",
    locked: false,
    // Своей картинки у пути пока нет
    imageSource: require("@/assets/images/games/hanzi.png"),
  },
  {
    id: "dictionary",
    title: "games.dictionary.title",
    description: "games.dictionary.description",
    route: "/vocabulary",
    locked: false,
    // Своей картинки у словаря пока нет
    imageSource: require("@/assets/images/games/flashcards.png"),
  },
  {
    id: "tones",
    title: "games.tones.title",
    description: "games.tones.description",
    route: "/games/tones",
    locked: false,
    imageSource: require("@/assets/images/games/tones.png"),
  },
];

export default function GamesScreen() {
  const router = useRouter();
  const { t } = useTranslation(["common"]);

  return (
    <Screen className="bg-background">
      <View className="w-full gap-10">
        <View className="flex-row w-full justify-between items-center">
          <BackButton href="/" />
          <Title>{t("games.title")}</Title>

          <View style={{ width: 28 }} />
        </View>

        <View className=" flex-col gap-5">
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={t(game.title)}
              description={t(game.description)}
              imageSource={game.imageSource}
              locked={game.locked}
              onPress={() => router.push(game.route as any)}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}
