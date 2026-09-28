import { Text, TextProps } from "react-native";

type TitleProps = TextProps & {
  children: React.ReactNode;
};

export function Title({ children, className, ...props }: TitleProps) {
  return (
    <Text
      className={`text-3xl font-nunito self-center ${className ?? ""}`}
      {...props}
    >
      {children}
    </Text>
  );
}
