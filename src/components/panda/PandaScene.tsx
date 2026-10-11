// src/components/panda/PandaScene.tsx
import {
  CABINET_TYPE_MAP,
  CARPET_TYPE_MAP,
  FLOOR_TYPE_MAP,
  POSTER_TYPE_MAP,
  WALL_TYPE_MAP,
} from "@/content/roomInputMaps";
import { useApplyRiveInputs } from "@/hooks/useApplyRiveInputs";
import { useRoomStore } from "@/store/roomStore";
import { View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Rive, { Fit } from "rive-react-native";

interface PandaSceneProps {
  style?: ViewStyle;
}

export const PandaScene = ({ style }: PandaSceneProps) => {
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
        source={require("@/assets/motion/panda_02.riv")}
        stateMachineName="State Machine 1"
        fit={Fit.Fill}
        style={{
          position: "absolute",
          top: insets.bottom,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
        }}
      />
    </View>
  );
};
