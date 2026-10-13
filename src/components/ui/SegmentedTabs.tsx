// src/components/ui/SegmentedTabs.tsx
//
// Переключатель вкладок в одну строку: «Ступени | Мои наборы».
// Это не отдельные экраны, а два вида одного экрана.

import { Pressable, Text, View } from "react-native";

export interface SegmentedTab<K extends string> {
  key: K;
  label: string;
}

interface SegmentedTabsProps<K extends string> {
  tabs: SegmentedTab<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}

export function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
  className = "",
}: SegmentedTabsProps<K>) {
  return (
    <View
      className={`flex-row rounded-2xl bg-progress-inactive p-1 ${className}`}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.key === value;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2 ${
              active ? "bg-surface" : "active:opacity-60"
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              className={`text-body ${
                active ? "font-nunitoBold text-text" : "font-nunito text-text/70"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
