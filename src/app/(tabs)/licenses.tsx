// app/(tabs)/licenses.tsx
//
// «Лицензии» — откуда взяты данные, шрифты и иконки и под какими лицензиями.
// Тап по строке открывает страницу источника (там полный текст лицензии).
// Пока черновик: позже добавить полные тексты и список библиотек приложения.

import ChevronRightIcon from "@/assets/images/icons/chevron-right.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Title } from "@/components/ui/Title";
import { LICENSES } from "@/constants/legal";
import { colors } from "@/theme/colors";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

export default function LicensesScreen() {
  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton href="/profile" />
        <Title>Лицензии</Title>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
      >
        <Text className="mb-2 font-nunito text-small text-textSecondary">
          Спасибо авторам открытых данных, шрифтов и иконок, без которых этого
          приложения не было бы.
        </Text>

        {LICENSES.map((entry) => (
          <Pressable
            key={entry.title}
            onPress={() => Linking.openURL(entry.url)}
            className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3 active:opacity-70"
            accessibilityRole="link"
          >
            <View className="flex-1 gap-0.5">
              <Text className="font-nunitoBold text-body text-text">
                {entry.title}
              </Text>
              <Text className="font-nunito text-small text-text">
                {entry.usage}
              </Text>
              <Text className="font-nunitoMedium text-caption text-primary">
                {entry.license}
              </Text>
            </View>
            <ChevronRightIcon width={20} height={20} color={colors.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
