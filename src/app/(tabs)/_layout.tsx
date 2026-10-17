import { colors } from "@/theme/colors";
import { useFonts } from "expo-font";
import { Tabs, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import "../../i18n";

export default function TabLayout() {
  const pathname = usePathname();

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
          display: "none",
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderColor: colors.border,
          height: 50 + insets.bottom,
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
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
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
        name="games/writing/free"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/reading-exam"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/writing/exam"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/writing/set"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/writing/review"
        options={{
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="games/path/index"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/path/stage"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/writing/path"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="games/flashcards/edit/[setId]"
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
        name="shop"
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
