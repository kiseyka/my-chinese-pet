// src/components/panda/PandaScene.tsx
//
// Комната (фон) и панда. У панды облачко мыслей — слой Layer_thought в её
// State Machine 1 (assets/motion/panda.riv), входы:
//   hasThought (bool) — облачко видно: idle → waiting_look (лучики один раз) → waiting;
//   look (trigger)    — ещё раз лучики (возвращение на экран, пока облачко висит);
//   tap (trigger)     — сжатие и свечение при тапе, потом облачко пропадает.
// Решает всё приложение (pandaStore.thought), Rive только показывает.
//
// Тап по панде — прозрачная область поверх неё (PANDA_HIT_AREA, в долях сцены).
// Включи SHOW_HIT_AREA, чтобы увидеть её и подогнать под свою панду.

import {
  CABINET_TYPE_MAP,
  CARPET_TYPE_MAP,
  FLOOR_TYPE_MAP,
  POSTER_TYPE_MAP,
  WALL_TYPE_MAP,
} from "@/content/roomInputMaps";
import { useApplyRiveInputs } from "@/hooks/useApplyRiveInputs";
import { useRoomStore } from "@/store/roomStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  Text,
  View,
  ViewStyle,
  type DimensionValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Rive, { Fit, type RiveRef } from "rive-react-native";

const PANDA_STATE_MACHINE = "State Machine 1";

/**
 * Облачко: "rive" — слой в файле панды; "stub" — простое «…» из React Native
 * (если в .riv ещё нет слоя облачка).
 */
const THOUGHT_CLOUD = "rive" as "rive" | "stub";

/** Где на сцене панда (для тапа), в процентах от сцены. */
const PANDA_HIT_AREA: {
  left: DimensionValue;
  top: DimensionValue;
  width: DimensionValue;
  height: DimensionValue;
} = { left: "25%", top: "40%", width: "44%", height: "44%" };

/** Показать область тапа полупрозрачной рамкой (для подгонки). */
const SHOW_HIT_AREA = false as boolean;

const HIT_AREA_DEBUG_STYLE = {
  borderWidth: 2,
  borderColor: "rgba(181, 66, 48, 0.6)",
  backgroundColor: "rgba(181, 66, 48, 0.1)",
};

/** Сколько длится анимация тапа: облачко прячем после неё, а не поверх. */
const TAP_ANIMATION_MS = 400;

interface PandaSceneProps {
  style?: ViewStyle;
  /** Облачко мыслей над головой. */
  hasThought?: boolean;
  /** Тап по панде (только когда есть облачко). */
  onPandaPress?: () => void;
}

export const PandaScene = ({
  style,
  hasThought = false,
  onPandaPress,
}: PandaSceneProps) => {
  const insets = useSafeAreaInsets();

  const cabinetType = useRoomStore((s) => s.cabinetType);
  const posterType = useRoomStore((s) => s.posterType);
  const wallType = useRoomStore((s) => s.wallType);
  const floorType = useRoomStore((s) => s.floorType);
  const carpetType = useRoomStore((s) => s.carpetType);

  const { riveRef, onPlay } = useApplyRiveInputs("State Machine 1", {
    cabinet_type: CABINET_TYPE_MAP[cabinetType],
    poster_type: POSTER_TYPE_MAP[posterType],
    wall_type: WALL_TYPE_MAP[wallType],
    floor_type: FLOOR_TYPE_MAP[floorType],
    carpet_type: CARPET_TYPE_MAP[carpetType],
  });

  const cloud = usePandaCloud(hasThought);

  const handlePress = () => {
    cloud.tap();
    onPandaPress?.();
  };

  return (
    <View
      style={[{ position: "absolute", inset: 0, overflow: "hidden" }, style]}
    >
      {/* Фон: с отступом снизу под системную панель */}
      <Rive
        ref={riveRef}
        source={require("@/assets/motion/bg_02.riv")}
        artboardName="background 3"
        stateMachineName="State Machine 1"
        fit={Fit.Fill}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onPlay={onPlay}
      />
      {/* Панда: до самого низа экрана */}
      <Rive
        ref={cloud.ref}
        source={require("@/assets/motion/panda.riv")}
        stateMachineName={PANDA_STATE_MACHINE}
        fit={Fit.Fill}
        style={{
          position: "absolute",
          top: insets.bottom,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
        }}
        onPlay={cloud.onPlay}
      />

      {/* Область тапа по панде: работает, только когда есть облачко */}
      <View
        pointerEvents={hasThought && onPandaPress ? "box-none" : "none"}
        style={{
          position: "absolute",
          top: insets.bottom,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 110,
        }}
      >
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Панде есть что сказать"
          style={{
            position: "absolute",
            ...PANDA_HIT_AREA,
            ...(SHOW_HIT_AREA ? HIT_AREA_DEBUG_STYLE : {}),
          }}
        >
          {THOUGHT_CLOUD === "stub" && hasThought && <StubCloud />}
        </Pressable>
      </View>
    </View>
  );
};

/** Облачко «…» без Rive — пока в файле панды нет слоя облачка. */
function StubCloud() {
  return (
    <View
      className="absolute self-center rounded-full bg-surface px-4 py-1"
      style={{ top: -36 }}
    >
      <Text className="font-nunitoBold text-title text-textSecondary">…</Text>
    </View>
  );
}

/**
 * Входы облачка в Rive. hasThought применяется, когда Rive готов; при возвращении
 * на экран с висящим облачком — ещё раз лучики (look). После тапа hasThought
 * гасится только когда доиграла анимация тапа: иначе Rive может уйти в idle
 * раньше, чем увидит триггер.
 */
function usePandaCloud(hasThought: boolean) {
  const ref = useRef<RiveRef>(null);
  const [isReady, setIsReady] = useState(false);
  /** Что сейчас выставлено в Rive. */
  const shown = useRef(false);
  const lastTapAt = useRef(0);

  const setInput = useCallback((value: boolean) => {
    shown.current = value;
    if (THOUGHT_CLOUD !== "rive") return;
    try {
      ref.current?.setInputState(PANDA_STATE_MACHINE, "hasThought", value);
    } catch {
      // В файле панды нет слоя облачка — просто ничего не показываем
    }
  }, []);

  const fire = useCallback((input: "look" | "tap") => {
    if (THOUGHT_CLOUD !== "rive") return;
    try {
      ref.current?.fireState(PANDA_STATE_MACHINE, input);
    } catch {
      // См. setInput
    }
  }, []);

  useEffect(() => {
    if (!isReady || shown.current === hasThought) return;

    const sinceTap = Date.now() - lastTapAt.current;
    if (!hasThought && sinceTap < TAP_ANIMATION_MS) {
      const timer = setTimeout(
        () => setInput(false),
        TAP_ANIMATION_MS - sinceTap,
      );
      return () => clearTimeout(timer);
    }

    setInput(hasThought);
  }, [isReady, hasThought, setInput]);

  // Вернулись на экран, а облачко висит — напомнить о нём лучиками один раз
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (isReady && shown.current) fire("look");
    }, [isReady, fire]),
  );

  return {
    ref,
    onPlay: () => setIsReady(true),
    tap: () => {
      lastTapAt.current = Date.now();
      fire("tap");
    },
  };
}
