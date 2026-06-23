import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
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
    <SafeAreaView className="flex-1 ">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="bg-blue-500">
          <Text>Привет, писюн</Text>
        </View>
        <View className=" rounded-b-3xl  px-6 pt-8 pb-6" />
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
