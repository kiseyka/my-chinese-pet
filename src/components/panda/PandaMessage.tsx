import { Pressable, Text, View } from "react-native";

const colors = {
  background: "#F3EFE2",
  text: "#2C241E",
  border: "#BDB4A0",
  accent: "#B54230",
  accentDark: "#7D2619",
};

type PandaMessageProps = {
  title: string;
  subtitle?: string;
  onDismiss?: () => void;
};

export const PandaMessage = ({
  title,
  subtitle,
  onDismiss,
}: PandaMessageProps) => (
  <Pressable onPress={onDismiss} className="mx-12 w-[80%] items-center">
    <View
      className="w-full rounded-[28px] border px-6 py-5"
      style={{
        borderColor: `${colors.border}80`,
        backgroundColor: colors.background,
      }}
    >
      <Text
        className="text-center font-chineseMedium text-base leading-6"
        style={{ color: colors.text }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          className="mt-1 text-center font-chineseMedium text-base leading-6"
          style={{ color: colors.text }}
        >
          {subtitle}
        </Text>
      )}
    </View>

    <View
      className="h-0 w-0"
      style={{
        borderLeftWidth: 9,
        borderRightWidth: 9,
        borderTopWidth: 12,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: colors.border,
        marginTop: -1,
      }}
    />
  </Pressable>
);
