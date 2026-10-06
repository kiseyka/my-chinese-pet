import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
};

export const Screen = ({ children, className = "" }: ScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`relative  ${className}`}
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
