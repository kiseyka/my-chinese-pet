import NextIcon from "@/assets/images/icons/arrow-right.svg";
import LockIcon from "@/assets/images/icons/lock-keyhole.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { colors } from "@/theme/colors";
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
    route: "/games/writing",
    locked: true,
    imageSource: require("@/assets/images/games/hanzi.png"),
  },
];

export default function GamesScreen() {
  const router = useRouter();
  const { t } = useTranslation(["common"]);
  return (
    <Screen>
      <View className="w-full gap-10">
        <View className="flex-row w-full justify-between items-center">
          <BackButton href="/" />
          <Text className="text-3xl font-nunito self-center">
            {t("games.title")}
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-col gap-5">
          {games.map((game) => {
            const isLocked = game.locked;

            return (
              <Pressable
                key={game.id}
                disabled={isLocked}
                onPress={() => router.push(game.route as any)}
                className={`overflow-hidden rounded-2xl ${
                  isLocked ? "bg-border opacity-50" : "bg-background"
                }`}
                style={{
                  shadowColor: colors.textSecondary,
                  shadowOffset: {
                    width: -2,
                    height: 6,
                  },
                  shadowOpacity: 1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <View className="flex-row gap-2">
                  <View className="w-28 h-28">
                    <Image
                      source={game.imageSource}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  </View>

                  <View className="flex-1 justify-between mt-3">
                    <View className="pr-3">
                      <Text className="text-text text-lg font-nunito">
                        {t(game.title)}
                      </Text>

                      <Text className="text-textSecondary mt-1 font-nunito">
                        {t(game.description)}
                      </Text>
                    </View>

                    <View className="items-end">
                      {game.locked ? (
                        <View className="pr-3 pb-3">
                          <LockIcon
                            width={22}
                            height={22}
                            color={colors.text}
                          />
                        </View>
                      ) : (
                        <View>
                          <Image
                            className="absolute bottom-0 right-0"
                            source={require("@/assets/images/bg-arrow.png")}
                            style={{ width: 120, height: 90 }}
                          />
                          <View className="pr-3 mb-3">
                            <NextIcon
                              width={22}
                              height={22}
                              color={colors.surface}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {isLocked && (
                  <Text className="ml-2 mb-2 text-xs text-textSecondary font-nunito">
                    В разработке...
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
