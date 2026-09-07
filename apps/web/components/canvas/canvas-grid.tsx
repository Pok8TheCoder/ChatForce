"use client";

import { Background, BackgroundVariant } from "@xyflow/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function CanvasGrid() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const minorColor = isDark ? "#2a2a2e" : "#e4e4e7";
  const majorColor = isDark ? "#3f3f46" : "#d4d4d8";

  return (
    <>
      <Background
        id="grid-minor"
        variant={BackgroundVariant.Lines}
        gap={20}
        size={1}
        color={minorColor}
      />
      <Background
        id="grid-major"
        variant={BackgroundVariant.Lines}
        gap={100}
        size={1}
        color={majorColor}
      />
    </>
  );
}
