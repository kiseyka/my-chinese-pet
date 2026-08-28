// src/lib/interopIcon.ts
import { cssInterop } from "nativewind";
import type { ComponentType } from "react";

export function interopIcon(Component: ComponentType<any>) {
  cssInterop(Component, {
    className: {
      target: "style",
      nativeStyleToProp: { fill: true, stroke: true },
    },
  });
  return Component;
}
