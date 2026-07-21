import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Заглушка для иконок (можно заменить на react-native-vector-icons)
const CheckCircle = () => <Text className="text-green-500 text-xl">✓</Text>;
const Trophy = () => <Text className="text-yellow-500 text-xl">🏆</Text>;
const Fire = () => <Text className="text-orange-500 text-xl">🔥</Text>;
const Cards = () => <Text className="text-blue-500 text-xl">🃏</Text>;

const ProfileScreen = () => {
  const { t } = useTranslation();

  // Данные пользователя (можно вынести в стор)
  const user = {
    name: "Ли Вэй",
    level: 2,
    currentXP: 320,
    maxXP: 500,
    stats: {
      words: 245,
      characters: 128,
      streak: 12,
      time: "15 ч 30 мин",
      games: 56,
      avgScore: "85%",
    },
    achievements: [
      {
        id: 1,
        title: t("profile.achievementsList.firstSteps"),
        description: t("profile.achievementsList.firstStepsDesc"),
        icon: <Trophy />,
        completed: true,
      },
      {
        id: 2,
        title: t("profile.achievementsList.sevenDays"),
        description: t("profile.achievementsList.sevenDaysDesc"),
        icon: <Fire />,
        completed: true,
      },
      {
        id: 3,
        title: t("profile.achievementsList.cardMaster"),
        description: t("profile.achievementsList.cardMasterDesc"),
        icon: <Cards />,
        completed: true, // все выполнены, можно сделать частично
      },
    ],
  };

  // Прогресс XP
  const xpProgress = (user.currentXP / user.maxXP) * 100;

  return (
    <SafeAreaView className="flex-1 " style={{ backgroundColor: "#F4E9D6" }}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Заголовок профиля */}
        <View className=" rounded-b-3xl  px-6 pt-8 pb-6">
          <View className="flex flex-col items-center gap-5">
            <View className="w-40 h-40 rounded-full  items-center justify-center mr-4 overflow-hidden">
              <Image
                source={require("@/assets/images/avatars/male.png")}
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-800">
                {t("profile.greeting", { name: user.name })}
              </Text>
              {/* <Text className="text-gray-500 text-base">
                {t("profile.level", { level: user.level })}
              </Text> */}
            </View>
          </View>

          {/* XP прогресс */}
          {/* <View className="mt-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm font-medium text-gray-700">
                {t("profile.xp")}
              </Text>
              <Text className="text-sm text-gray-500">
                {user.currentXP} / {user.maxXP} XP
              </Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${xpProgress}%` }}
              />
            </View>
          </View> */}
        </View>

        {/* Достижения */}
        {/* <View className="mt-4 mx-4 bg-white rounded-2xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">
              {t("profile.achievements")}
            </Text>
            <Pressable onPress={() => console.log("View all achievements")}>
              <Text className="text-blue-500 text-sm font-medium">
                {t("profile.viewAll")}
              </Text>
            </Pressable>
          </View>

          {user.achievements.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center py-3 border-b border-gray-100 last:border-0"
            >
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                {item.icon}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-500">
                  {item.description}
                </Text>
              </View>
              {item.completed && <CheckCircle />}
            </View>
          ))}
        </View> */}

        {/* Статистика */}
        {/* <View className="mt-4 mx-4 bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            {t("profile.stats")}
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <StatCard
              label={t("profile.wordsLearned")}
              value={user.stats.words}
            />
            <StatCard
              label={t("profile.charactersLearned")}
              value={user.stats.characters}
            />
            <StatCard
              label={t("profile.daysStreak")}
              value={user.stats.streak}
            />
            <StatCard label={t("profile.studyTime")} value={user.stats.time} />
            <StatCard
              label={t("profile.gamesPlayed")}
              value={user.stats.games}
            />
            <StatCard
              label={t("profile.averageResult")}
              value={user.stats.avgScore}
            />
          </View>
        </View> */}

        {/* Отступ для нижнего таббара */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

// Компонент для статистики
const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View className="w-[48%] bg-gray-50 rounded-xl p-3 mb-3">
    <Text className="text-gray-500 text-xs mb-1">{label}</Text>
    <Text className="text-xl font-bold text-gray-800">{value}</Text>
  </View>
);

// Кнопка таббара
export const TabButton = ({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) => (
  <Pressable className="py-2 px-6 rounded-full">
    <Text
      className={`font-semibold ${active ? "text-blue-500" : "text-gray-400"}`}
    >
      {label}
    </Text>
  </Pressable>
);

export default ProfileScreen;
