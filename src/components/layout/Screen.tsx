import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const Screen = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom,
      }}
    >
      {children}
    </View>
  );
};
