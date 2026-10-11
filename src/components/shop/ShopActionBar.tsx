import { Image, Pressable, Text, View } from "react-native";

type ShopActionBarProps = {
  // Есть ли в текущей категории выбранный предмет — от этого зависит,
  // отменяет ли левая кнопка выбор или выходит из магазина.
  hasSelectionInCategory: boolean;
  // Выбран ли хоть один предмет в любой категории.
  hasDrafts: boolean;
  // Общая стоимость всех некупленных предметов из примерки.
  // 0 — значит всё выбранное уже куплено и можно применять.
  totalPrice: number;
  onCancel: () => void;
  onApply: () => void;
  onBuy: () => void;
};

export const ShopActionBar = ({
  hasSelectionInCategory,
  hasDrafts,
  totalPrice,
  onCancel,
  onApply,
  onBuy,
}: ShopActionBarProps) => {
  const needsPurchase = totalPrice > 0;

  return (
    <View className="flex-row gap-2 pt-4 pb-4">
      {/* Второстепенная кнопка — как «Полная тренировка» */}
      <Pressable
        onPress={onCancel}
        className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-primary/30 bg-surface px-5 py-4 active:opacity-70"
      >
        <Text className="font-nunitoBold text-body text-text">
          {hasSelectionInCategory ? "Отменить" : "Выйти"}
        </Text>
      </Pressable>

      {/* Основная кнопка — как «Быстрая тренировка» */}
      {hasDrafts && (
        <Pressable
          onPress={needsPurchase ? onBuy : onApply}
          className="min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 active:opacity-80"
        >
          {needsPurchase ? (
            <>
              <Text className="font-nunitoBold text-body text-white">
                Купить за {totalPrice}
              </Text>
              <Image
                source={require("@/assets/images/paw-coin.png")}
                className="w-5 h-5"
              />
            </>
          ) : (
            <Text className="font-nunitoBold text-body text-white">
              Применить
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
};
