// src/components/panda/PandaScenePreview.tsx
import {
  CABINET_TYPE_MAP,
  CabinetType,
  CARPET_TYPE_MAP,
  CarpetType,
  FLOOR_TYPE_MAP,
  FloorType,
  POSTER_TYPE_MAP,
  PosterType,
  WALL_TYPE_MAP,
  WallType,
} from "@/content/roomInputMaps";
import { useApplyRiveInputs } from "@/hooks/useApplyRiveInputs";
import { View, ViewStyle } from "react-native";
import Rive, { Alignment, Fit } from "rive-react-native";

interface PandaScenePreviewProps {
  previewCabinetType: CabinetType;
  previewPosterType: PosterType;
  previewWallType: WallType;
  previewFloorType: FloorType;
  previewCarpetType: CarpetType;
  style?: ViewStyle;
}

export const PandaScenePreview = ({
  previewCabinetType,
  previewPosterType,
  previewWallType,
  previewFloorType,
  previewCarpetType,
  style,
}: PandaScenePreviewProps) => {
  const { riveRef, onPlay } = useApplyRiveInputs("State Machine 1", {
    cabinet_type: CABINET_TYPE_MAP[previewCabinetType],
    poster_type: POSTER_TYPE_MAP[previewPosterType],
    wall_type: WALL_TYPE_MAP[previewWallType],
    floor_type: FLOOR_TYPE_MAP[previewFloorType],
    carpet_type: CARPET_TYPE_MAP[previewCarpetType],
  });

  return (
    <View
      className="border border-transparent rounded-xl"
      style={[{ position: "absolute", inset: 0, overflow: "hidden" }, style]}
    >
      <Rive
        ref={riveRef}
        source={require("@/assets/motion/preview_01.riv")}
        artboardName="background 5"
        stateMachineName="State Machine 1"
        fit={Fit.Cover}
        alignment={Alignment.TopCenter}
        style={{ position: "absolute", inset: 0 }}
        onPlay={onPlay}
      />
    </View>
  );
};
