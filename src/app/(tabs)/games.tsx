import { Screen } from "@/components/layout/Screen";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";

const games = [
  {
    id: "flashcards",
    title: "games.flashcards.title",
    description: "games.flashcards.description",
    route: "/games/flashcards/sets",
    locked: false,
    imageSource: require("@/assets/images/card-game2.png"),
    icon: "→",
  },
  {
    id: "tones",
    title: "games.tones.title",
    description: "games.tones.description",
    route: "/games/tones",
    locked: true,
    imageSource: require("@/assets/images/tone-game.png"),
    icon: "🔒",
  },
  {
    id: "writing",
    title: "games.writting.title",
    description: "games.writting.description",
    route: "/games/writing",
    locked: true,
    imageSource: require("@/assets/images/write-game.png"),
    icon: "🔒",
  },
];

export default function GamesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen>
      {/* <Image
        source={require("@/assets/images/sakura.png")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 100,
          height: 150,
          zIndex: 1,
        }}
        resizeMode="contain"
      /> */}

      <View className="w-full gap-5 ">
        <Text className="text-3xl font-nunito self-center">
          {t("games.title")}
        </Text>
        {games.map((game) => {
          const isLocked = game.locked;

          return (
            <Pressable
              key={game.id}
              disabled={isLocked}
              onPress={() => router.push(game.route as any)}
              className={`
                rounded-2xl p-4 border 
                ${isLocked ? "bg-[#E8E2D6] opacity-50" : "bg-[#F3EFE2]"}
                border-border
              `}
            >
              <View className="flex-row gap-5">
                <View className="w-28 h-28 ">
                  <Image
                    style={{ width: "100%", height: "100%" }}
                    source={game.imageSource}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-1 justify-between">
                  {/* TOP */}
                  <View className="pr-3">
                    <Text className="text-text font-bold text-lg font-nunito">
                      {t(game.title)}
                    </Text>

                    <Text className="text-textSecondary mt-1">
                      {t(game.description)}
                    </Text>
                  </View>

                  {/* BOTTOM RIGHT */}
                  <View className="items-end">
                    <Text className="text-primary text-xl">{game.icon}</Text>
                  </View>
                </View>
              </View>
              {/* locked label */}
              {isLocked && (
                <Text className="text-xs text-textSecondary">
                  В разработке...
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
