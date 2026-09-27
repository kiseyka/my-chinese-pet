import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiveRef } from "rive-react-native";

/**
 * Держит ref+ready-состояние Rive-компонента и применяет переданные
 * инпуты в State Machine — при монтировании, при смене значений и
 * при возврате экрана в фокус (например, после ухода в магазин).
 */
export function useApplyRiveInputs(
  stateMachineName: string,
  inputs: Record<string, number>,
) {
  const riveRef = useRef<RiveRef>(null);
  const [isReady, setIsReady] = useState(false);
  const inputsKey = JSON.stringify(inputs);

  const apply = useCallback(() => {
    if (!isReady) return;
    Object.entries(inputs).forEach(([name, value]) => {
      riveRef.current?.setInputState(stateMachineName, name, value);
    });
    // inputsKey специально в зависимостях вместо inputs — стабильная
    // ссылка на объект пересоздаётся на каждый рендер родителя.
  }, [isReady, stateMachineName, inputsKey]);

  useEffect(() => {
    apply();
  }, [apply]);

  useFocusEffect(
    useCallback(() => {
      apply();
    }, [apply]),
  );

  return { riveRef, onPlay: () => setIsReady(true) };
}
