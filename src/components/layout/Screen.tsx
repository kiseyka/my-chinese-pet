import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const Screen = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="relative"
      style={{
        flex: 1,
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 16,
      }}
    >
      {children}
    </View>
  );
};
