import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";

export type PandaState = "idle" | "wants_to_talk";

type PandaCompanionProps = {
  state: PandaState;
  onPress: () => void;
};

export function PandaCompanion({ state, onPress }: PandaCompanionProps) {
  const attentionAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== "wants_to_talk") {
      attentionAnimation.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(attentionAnimation, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(attentionAnimation, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [state, attentionAnimation]);

  const attentionScale = attentionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const attentionOpacity = attentionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View>
      <Pressable onPress={onPress}>
        <View className="relative">
          <Image
            source={require("../../../assets/motion/panda.png")}
            style={{ width: 300, height: 400 }}
            resizeMode="contain"
          />

          {state === "wants_to_talk" && (
            <Animated.View
              className="absolute right-8 top-8"
              style={{
                opacity: attentionOpacity,
                transform: [
                  {
                    scale: attentionScale,
                  },
                ],
              }}
            >
              <Text style={{ fontSize: 28 }}>✨</Text>
            </Animated.View>
          )}
        </View>
      </Pressable>
    </View>
  );
}
