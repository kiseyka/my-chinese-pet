import LearnIcon from "@/assets/images/tab-icons/learn-icon4.svg";
import PawIcon from "@/assets/images/tab-icons/paw-icon2.svg";
import UserIcon from "@/assets/images/tab-icons/user-icon.svg";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import "../../i18n";
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loaded] = useFonts({
    NotoSansSC: require("../../../assets/fonts/NotoSerifSC-Regular.ttf"),
    NotoSansSCBold: require("../../../assets/fonts/NotoSerifSC-Bold.ttf"),
    NotoSansSCMedium: require("../../../assets/fonts/NotoSerifSC-Medium.ttf"),
  });

  if (!loaded) return null;
  return (
    <Tabs
      screenOptions={{
        sceneStyle: {
          backgroundColor: "#F3EFE2",
        },
        tabBarStyle: {
          backgroundColor: "#F3EFE2",
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
        name="game"
        options={{
          headerShown: false,
          tabBarLabel: t("profile.tabs.game"),
          tabBarIcon: ({ color, size }) => (
            <LearnIcon width={size} height={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
