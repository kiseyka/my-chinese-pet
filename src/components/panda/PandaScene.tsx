// src/components/panda/PandaScene.tsx
import { useRoomStore } from "@/store/roomStore";
import { useEffect, useRef, useState } from "react";
import { View, ViewStyle } from "react-native";
import Rive, { Alignment, Fit, RiveRef } from "rive-react-native";

type CabinetType = "stand" | "wardrobe";

const CABINET_TYPE_MAP: Record<CabinetType, number> = {
  stand: 0,
  wardrobe: 1,
};

interface PandaSceneProps {
  style?: ViewStyle;
}

export const PandaScene = ({ style }: PandaSceneProps) => {
  const riveRef = useRef<RiveRef>(null);
  const [isRiveReady, setIsRiveReady] = useState(false);
  const cabinetType = useRoomStore((s) => s.cabinetType);

  // Применяем input, как только Rive реально готов,
  // и повторно — при каждой смене cabinetType в сторе.
  useEffect(() => {
    if (!isRiveReady) return;

    riveRef.current?.setInputState(
      "State Machine 1",
      "cabinet_type",
      CABINET_TYPE_MAP[cabinetType],
    );
  }, [cabinetType, isRiveReady]);

  return (
    <View
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Rive
        ref={riveRef}
        source={require("@/assets/motion/panda03.riv")}
        stateMachineName="State Machine 1"
        artboardName="background 2"
        fit={Fit.Fill}
        alignment={Alignment.Center}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
        onPlay={() => setIsRiveReady(true)}
      />
    </View>
  );
};
