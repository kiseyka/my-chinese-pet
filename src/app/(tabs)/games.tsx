// app/(game)/games.tsx  (твой путь к файлу экрана)

import BookIcon from "@/assets/images/icons/vocabulary.svg";
import { GameCard } from "@/components/game/GameCard";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

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
    id: "flashcards",
    title: "games.flashcards.title",
    description: "games.flashcards.description",
    route: "/games/flashcards/sets",
    locked: false,
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
  {
    id: "writing",
    title: "games.writting.title",
    description: "games.writting.description",
    route: "/games/writing/sets",
    locked: false,
    imageSource: require("@/assets/images/games/hanzi.png"),
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

          <Pressable
            onPress={() => router.push("/vocabulary")}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Словарь"
          >
            <BookIcon width={26} height={26} color={colors.text} />
          </Pressable>
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
