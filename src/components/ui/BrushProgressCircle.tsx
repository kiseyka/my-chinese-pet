// BrushProgressCircle.tsx
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface BrushProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  animationDuration?: number;
  className?: string;
}

export const BrushProgressCircle: React.FC<BrushProgressCircleProps> = ({
  percentage,
  size = 140,
  strokeWidth = 12,
  progressColor = "#A03927",
  backgroundColor = "#E2D9CD",
  showPercentage = true,
  label = "Точность",
  animationDuration = 1500,
  className = "",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const [displayPercentage, setDisplayPercentage] = useState(0);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(percentage, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage, animationDuration]);

  useDerivedValue(() => {
    runOnJS(setDisplayPercentage)(Math.round(animatedProgress.value));
  });

  // Анимируем strokeDashoffset (от circumference до 0)
  const animatedCircleProps = useAnimatedProps(() => {
    const offset =
      circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset: offset,
    };
  });
  useEffect(() => {
    cancelAnimation(animatedProgress);

    animatedProgress.value = 0;

    animatedProgress.value = withDelay(
      0,
      withTiming(percentage, {
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [percentage]);
  return (
    <View
      className={`items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Поворачиваем сам SVG на -90 градусов, чтобы старт был на 12 часах */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* 1. Базовый серо-бежевый круг (незаполненный) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />

        {/* 2. Активный графитовый круг (заполняющийся) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round" // Красивые скругленные края у линии прогресса
        />
      </Svg>

      {/* Текст по центру (вне повернутого SVG, поэтому он не перевернется) */}
      <View className="absolute items-center" pointerEvents="none">
        {showPercentage && (
          <Text
            className="font-bold"
            style={{
              fontSize: size * 0.22,
              color: progressColor,
            }}
          >
            {displayPercentage}%
          </Text>
        )}
        <Text
          className="text-text"
          style={{
            fontSize: size * 0.09,
            marginTop: showPercentage ? size * 0.02 : 0,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};
