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

/**
 * Цвет SVG-иконки через className (text-primary, text-white): класс превращается
 * в проп color, а иконка рисуется currentColor. Повторный вызов для той же иконки безопасен.
 */
export function interopIconColor(...icons: ComponentType<any>[]) {
  for (const Icon of icons) {
    cssInterop(Icon, {
      className: { target: "style", nativeStyleToProp: { color: true } },
    });
  }
}
