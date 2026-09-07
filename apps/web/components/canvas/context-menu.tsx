"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CanvasObjectType } from "@/lib/types";

export interface ContextMenuState {
  x: number;
  y: number;
  target: "canvas" | "object";
  objectId?: string;
  objectType?: CanvasObjectType;
}

interface ContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
  onAction: (action: string) => void;
}

const CANVAS_ITEMS = [
  { id: "create-dataset", label: "Dataset", section: "Create" },
  { id: "create-chart", label: "Chart", section: "Create" },
  { id: "create-kpi", label: "KPI", section: "Create" },
  { id: "create-insight", label: "Insight", section: "Create" },
  { id: "create-table", label: "Table", section: "Create" },
  { id: "create-filter", label: "Filter", section: "Create" },
  { id: "create-summary", label: "Summary", section: "Create" },
  { id: "create-text", label: "Text", section: "Create" },
  { id: "create-comment", label: "Comment", section: "Create" },
  { id: "create-group", label: "Group", section: "Create" },
  { id: "auto-arrange", label: "Auto Arrange", section: "Canvas" },
  { id: "zoom-fit", label: "Zoom to Fit", section: "Canvas" },
];

const OBJECT_ITEMS: Record<string, { id: string; label: string }[]> = {
  dataset: [
    { id: "upload-dataset", label: "Replace File" },
    { id: "analyze", label: "Analyze" },
    { id: "delete", label: "Delete" },
  ],
  default: [
    { id: "duplicate", label: "Duplicate" },
    { id: "delete", label: "Delete" },
    { id: "point-to-ai", label: "Point to AI" },
  ],
};

export function ContextMenu({ menu, onClose, onAction }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!menu) return;
    const el = ref.current;
    const width = el?.offsetWidth ?? 200;
    const height = el?.offsetHeight ?? 300;
    const x = Math.min(menu.x, window.innerWidth - width - 8);
    const y = Math.min(menu.y, window.innerHeight - height - 8);
    setPos({ x, y });
  }, [menu]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (!menu) return null;

  const items =
    menu.target === "canvas"
      ? CANVAS_ITEMS
      : OBJECT_ITEMS[menu.objectType || "default"] || OBJECT_ITEMS.default;

  const sections = [...new Set(items.map((i) => (i as { section?: string }).section || ""))];

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
      style={{ left: pos.x, top: pos.y }}
    >
      {menu.target === "canvas" ? (
        sections.map((section) => (
          <div key={section}>
            {section && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {section}
              </div>
            )}
            {items
              .filter((i) => (i as { section?: string }).section === section)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  onClick={() => {
                    onAction(item.id);
                    onClose();
                  }}
                >
                  {item.label}
                </button>
              ))}
          </div>
        ))
      ) : (
        items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100",
              item.id === "delete" ? "text-red-600" : "text-neutral-700",
            )}
            onClick={() => {
              onAction(item.id);
              onClose();
            }}
          >
            {item.label}
          </button>
        ))
      )}
    </div>
  );
}
