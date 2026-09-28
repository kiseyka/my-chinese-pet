// src/components/panda/PandaScene.tsx
import { CABINET_TYPE_MAP, POSTER_TYPE_MAP } from "@/content/roomInputMaps";
import { useApplyRiveInputs } from "@/hooks/useApplyRiveInputs";
import { useRoomStore } from "@/store/roomStore";
import { View, ViewStyle } from "react-native";
import Rive, { Fit } from "rive-react-native";

interface PandaSceneProps {
  style?: ViewStyle;
}

export const PandaScene = ({ style }: PandaSceneProps) => {
  const cabinetType = useRoomStore((s) => s.cabinetType);
  const posterType = useRoomStore((s) => s.posterType);

  const { riveRef, onPlay } = useApplyRiveInputs("State Machine 1", {
    cabinet_type: CABINET_TYPE_MAP[cabinetType],
    poster_type: POSTER_TYPE_MAP[posterType],
  });

  return (
    <View
      style={[{ position: "absolute", inset: 0, overflow: "hidden" }, style]}
    >
      <Rive
        ref={riveRef}
        source={require("@/assets/motion/bg_03.riv")}
        artboardName="background 3"
        stateMachineName="State Machine 1"
        fit={Fit.Fill}
        style={{ position: "absolute", inset: 0 }}
        onPlay={onPlay}
      />
      <Rive
        source={require("@/assets/motion/panda_01.riv")}
        stateMachineName="State Machine 1"
        fit={Fit.Fill}
        style={{ position: "absolute", inset: 0, zIndex: 100 }}
      />
    </View>
  );
};
