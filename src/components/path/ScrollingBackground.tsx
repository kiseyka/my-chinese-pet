// src/components/path/ScrollingBackground.tsx
//
// Повторяющийся фон-пейзаж под картой пути.
// Три панели пейзажа собраны в одну бесшовную петлю (стыки между ними и низ третьей
// с верхом первой плавно перетекают) и разрезаны на три файла одинаковой высоты:
// assets/images/backgrounds/path-1.jpg, -2, -3. Одна картинка на всю петлю была бы
// выше 6000 пикселей — такие на части Android-телефонов не отрисовываются.
//
// Плитки идут подряд по кругу (1, 2, 3, 1, 2…), их столько, чтобы закрыть экран при любом
// сдвиге. Фон едет вместе с прокруткой, но медленнее (PARALLAX) — кажется, что пейзаж
// дальше тропинки. Сдвиг считается по модулю высоты петли, поэтому плиток всегда
// несколько, сколько бы ни был длинным путь. Всё на нативном драйвере.

import { useMemo } from "react";
import { Animated, Image, View, useWindowDimensions } from "react-native";

const TILES = [
  require("@/assets/images/backgrounds/path-1.jpg"),
  require("@/assets/images/backgrounds/path-2.jpg"),
  require("@/assets/images/backgrounds/path-3.jpg"),
];
/** Размер одной плитки в пикселях (ширина × высота файла). */
const TILE_WIDTH = 1080;
const TILE_HEIGHT = 1836;

/** Во сколько раз фон движется медленнее тропинки (1 — вместе с ней, 0 — стоит). */
const PARALLAX = 0.6;

interface ScrollingBackgroundProps {
  /** Прокрутка списка (contentOffset.y). */
  scrollY: Animated.Value;
}

export function ScrollingBackground({ scrollY }: ScrollingBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const tileHeight = Math.round((width * TILE_HEIGHT) / TILE_WIDTH);
  const loopHeight = tileHeight * TILES.length;
  // Петля целиком плюс столько плиток, чтобы закрыть экран в конце сдвига
  const count = TILES.length + Math.ceil(height / tileHeight) + 1;

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
          loopHeight,
        ),
        -1,
      ),
    [scrollY, loopHeight],
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
            source={TILES[i % TILES.length]}
            style={{ width, height: tileHeight }}
            resizeMode="stretch"
            fadeDuration={0}
            accessibilityIgnoresInvertColors
          />
        ))}
      </Animated.View>
    </View>
  );
}
