// src/components/panda/PandaScenePreview.tsx
import {
  CABINET_TYPE_MAP,
  CabinetType,
  POSTER_TYPE_MAP,
  PosterType,
} from "@/content/roomInputMaps";
import { useApplyRiveInputs } from "@/hooks/useApplyRiveInputs";
import { View, ViewStyle } from "react-native";
import Rive, { Fit } from "rive-react-native";

interface PandaScenePreviewProps {
  previewCabinetType: CabinetType;
  previewPosterType: PosterType;
  style?: ViewStyle;
}

export const PandaScenePreview = ({
  previewCabinetType,
  previewPosterType,
  style,
}: PandaScenePreviewProps) => {
  const { riveRef, onPlay } = useApplyRiveInputs("State Machine 1", {
    cabinet_type: CABINET_TYPE_MAP[previewCabinetType],
    poster_type: POSTER_TYPE_MAP[previewPosterType],
  });

  return (
    <View
      style={[{ position: "absolute", inset: 0, overflow: "hidden" }, style]}
    >
      <Rive
        ref={riveRef}
        source={require("@/assets/motion/preview_03.riv")}
        artboardName="background 5"
        stateMachineName="State Machine 1"
        fit={Fit.Contain}
        style={{ position: "absolute", inset: 0 }}
        onPlay={onPlay}
      />
    </View>
  );
};
