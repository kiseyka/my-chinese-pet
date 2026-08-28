import PandaIcon from "@/assets/images/tab-icons/house.svg";
import UserIcon from "@/assets/images/tab-icons/user-icon.svg";
import VocabularyIcon from "@/assets/images/tab-icons/vocabulary.svg";
import { colors } from "@/theme/colors";
import { useFonts } from "expo-font";
import { Tabs, usePathname } from "expo-router";
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
        sceneStyle: { backgroundColor: colors.background },
        tabBarShowLabel: false,
        tabBarStyle: {
          display: hideTabBar ? "none" : "flex",
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          padding: 5,
        },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.text,
        tabBarBackground: () => null,
      }}
      initialRouteName="pet"
    >
      <Tabs.Screen
        name="pet"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <PandaIcon width={30} height={30} color={color} strokeWidth={1} />
          ),
        }}
      />

      <Tabs.Screen
        name="games"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="vocabulary"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <VocabularyIcon
              width={30}
              height={30}
              color={color}
              strokeWidth={1}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <UserIcon width={30} height={30} color={color} strokeWidth={1} />
          ),
        }}
      />

      <Tabs.Screen
        name="games/flashcards/sets"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/tones"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/flashcards/[setId]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/stats"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
