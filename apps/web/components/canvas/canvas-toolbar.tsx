"use client";

import { ArrowRight, Link2, Maximize2, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasTool = "select" | "connect" | "arrow";

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  connectHint?: string | null;
  onZoomFit?: () => void;
}

const TOOLS: {
  id: CanvasTool;
  label: string;
  icon: React.ElementType;
  title: string;
}[] = [
  {
    id: "select",
    label: "Select",
    icon: MousePointer2,
    title: "Select and move objects",
  },
  {
    id: "connect",
    label: "Connect",
    icon: Link2,
    title: "Click source, then target to connect",
  },
  {
    id: "arrow",
    label: "Arrow",
    icon: ArrowRight,
    title: "Click source, then target to draw an arrow",
  },
];

export function CanvasToolbar({
  activeTool,
  onToolChange,
  connectHint,
  onZoomFit,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-1.5">
      <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              title={tool.title}
              onClick={() => onToolChange(tool.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {activeTool === "connect" || activeTool === "arrow" ? (
        <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span>{connectHint || "Click a source object, then a target"}</span>
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          title="Zoom to fit"
          onClick={onZoomFit}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
