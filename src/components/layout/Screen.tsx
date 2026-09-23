import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const Screen = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="relative bg-background"
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 16,
      }}
    >
      {children}
    </View>
  );
};
