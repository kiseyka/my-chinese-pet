// src/components/path/ScrollingBackground.tsx
//
// Повторяющийся фон-пейзаж под картой пути. Картинка — бесшовная плитка
// (assets/images/backgrounds/path.jpg): три панели пейзажа одна под другой,
// стыки между ними и низ третьей с верхом первой плавно перетекают. Плитка повторяется
// столько раз, сколько нужно, чтобы закрыть экран, и едет вместе с прокруткой,
// но медленнее (PARALLAX) — так кажется, что пейзаж дальше тропинки.
// Сдвиг считается по модулю высоты плитки, поэтому плиток всегда несколько,
// сколько бы ни был длинным путь. Всё на нативном драйвере — прокрутка не тормозит.

import { useMemo } from "react";
import { Animated, Image, View, useWindowDimensions } from "react-native";

const TILE = require("@/assets/images/backgrounds/path.jpg");
/** Размер плитки в пикселях (ширина × высота файла). */
const TILE_WIDTH = 503;
const TILE_HEIGHT = 2610;

/** Во сколько раз фон движется медленнее тропинки (1 — вместе с ней, 0 — стоит). */
const PARALLAX = 0.6;

interface ScrollingBackgroundProps {
  /** Прокрутка списка (contentOffset.y). */
  scrollY: Animated.Value;
}

export function ScrollingBackground({ scrollY }: ScrollingBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const tileHeight = Math.round((width * TILE_HEIGHT) / TILE_WIDTH);
  const count = Math.ceil(height / tileHeight) + 1;

  const translateY = useMemo(
    () =>
      Animated.multiply(
        Animated.modulo(
          // Оттягивание за верх (отрицательная прокрутка) фон не двигает
          scrollY.interpolate({
            inputRange: [0, 1],
            outputRange: [0, PARALLAX],
            extrapolateLeft: "clamp",
          }),
          tileHeight,
        ),
        -1,
      ),
    [scrollY, tileHeight],
  );

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      className="overflow-hidden bg-background"
    >
      <Animated.View style={{ transform: [{ translateY }] }}>
        {Array.from({ length: count }, (_, i) => (
          <Image
            key={i}
            source={TILE}
            style={{ width, height: tileHeight }}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
          />
        ))}
      </Animated.View>
    </View>
  );
}
