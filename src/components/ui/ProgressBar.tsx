// components/ui/ProgressBar.tsx

import { View } from "react-native";

interface ProgressBarProps {
  /** Процент заполнения, 0–100 */
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className = "" }: ProgressBarProps) => {
  const percent = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      className={`h-3 w-full overflow-hidden rounded-full bg-progress-inactive ${className}`}
    >
      {percent > 0 && (
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      )}
    </View>
  );
};
