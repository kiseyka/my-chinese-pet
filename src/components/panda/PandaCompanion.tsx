import Rive, { Alignment, Fit } from "rive-react-native";

export function PandaCompanion() {
  return (
    <Rive
      source={require("@/assets/motion/anime.riv")}
      autoplay={true}
      artboardName="panda"
      fit={Fit.Contain}
      alignment={Alignment.Center}
      style={{ width: 400, height: 400 }}
    />
  );
}
