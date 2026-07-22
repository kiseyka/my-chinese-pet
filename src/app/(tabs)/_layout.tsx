import LearnIcon from "@/assets/images/tab-icons/learn-icon4.svg";
import PawIcon from "@/assets/images/tab-icons/paw-icon2.svg";
import UserIcon from "@/assets/images/tab-icons/user-icon.svg";
import { useFonts } from "expo-font";
import { Tabs, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import "../../i18n";

export default function TabLayout() {
  const pathname = usePathname();

  const hideTabBar =
    (pathname.startsWith("/games/flashcards/") &&
      pathname !== "/games/flashcards/sets") ||
    pathname === "/games/stats";

  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loaded] = useFonts({
    NotoSansSC: require("../../../assets/fonts/NotoSerifSC-Regular.ttf"),
    NotoSansSCBold: require("../../../assets/fonts/NotoSerifSC-Bold.ttf"),
    NotoSansSCMedium: require("../../../assets/fonts/NotoSerifSC-Medium.ttf"),
    NunitoRegular: require("../../../assets/fonts/Nunito-Regular.ttf"),
    NunitoMedium: require("../../../assets/fonts/Nunito-Medium.ttf"),
    NunitoBold: require("../../../assets/fonts/Nunito-Bold.ttf"),
  });

  if (!loaded) return null;
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: "#F7F4ED" },
        tabBarStyle: {
          display: hideTabBar ? "none" : "flex",
          backgroundColor: "#F3EEE8",
          borderTopWidth: 1,
          borderColor: "rgba(179, 151, 120, 0.2)",
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          padding: 5,
        },

        tabBarActiveTintColor: "#7D2619",
        tabBarInactiveTintColor: "#2C241E",
        tabBarBackground: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false, // заголовок сверху (в навбаре)
          tabBarLabel: t("profile.tabs.profile"), // подпись внизу
          tabBarIcon: ({ color, size }) => (
            <UserIcon width={size} height={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          headerShown: false,
          tabBarLabel: t("profile.tabs.pet"),
          tabBarIcon: ({ color, size }) => (
            <PawIcon width={size} height={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          headerShown: false,
          tabBarLabel: t("profile.tabs.game"),
          // Переопределяем цвета текста и иконки, если путь начинается с /games
          tabBarLabelStyle: {
            color: pathname.startsWith("/games") ? "#7D2619" : "#2C241E",
          },
          tabBarIcon: ({ color, size }) => {
            // Если мы внутри раздела игр, принудительно ставим активный цвет
            const iconColor = pathname.startsWith("/games") ? "#7D2619" : color;

            return <LearnIcon width={size} height={size} color={iconColor} />;
          },
        }}
      />
      {/* Скрываем внутренние экраны игр из самого таббара */}
      <Tabs.Screen
        name="games/flashcards/sets"
        options={{
          href: null, // <-- Магия: вкладка не появится внизу
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/flashcards/[setId]"
        options={{
          href: null, // <-- Тоже скрываем из нижнего меню
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/stats"
        options={{
          href: null, // <-- Тоже скрываем из нижнего меню
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
