import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Запас сверху под системной панелью: без него шапки экранов прижаты к часам. */
export const SCREEN_TOP_GAP = 4;

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
        paddingTop: insets.top + SCREEN_TOP_GAP,
        paddingBottom: insets.bottom,
        paddingHorizontal: 16,
      }}
    >
      {children}
    </View>
  );
};
