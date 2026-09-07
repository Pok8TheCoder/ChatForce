"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  BarChart3,
  Database,
  FileText,
  Filter,
  Lightbulb,
  MessageSquare,
  Table2,
  TrendingUp,
  Type,
  Layers,
} from "lucide-react";
import type { CanvasObjectType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<CanvasObjectType, React.ElementType> = {
  dataset: Database,
  chart: BarChart3,
  kpi: TrendingUp,
  insight: Lightbulb,
  table: Table2,
  filter: Filter,
  summary: FileText,
  text: Type,
  comment: MessageSquare,
  group: Layers,
};

const LABELS: Record<CanvasObjectType, string> = {
  dataset: "Dataset",
  chart: "Chart",
  kpi: "KPI",
  insight: "Insight",
  table: "Table",
  filter: "Filter",
  summary: "Summary",
  text: "Text",
  comment: "Comment",
  group: "Group",
};

export interface CanvasNodeData {
  objectType: CanvasObjectType;
  label: string;
  subtitle?: string;
  meta?: string[];
  empty?: boolean;
  onUpload?: () => void;
  isConnectSource?: boolean;
  [key: string]: unknown;
}

export function CanvasObjectNode({ data, selected }: NodeProps) {
  const nodeData = data as CanvasNodeData;
  const Icon = ICONS[nodeData.objectType] || Database;
  const isConnectSource = nodeData.isConnectSource;
  const highlightClass = isConnectSource
    ? "border-emerald-500 ring-2 ring-emerald-200"
    : selected
      ? "border-blue-500 ring-2 ring-blue-200"
      : "border-neutral-200";

  if (nodeData.objectType === "dataset") {
    return (
      <div
        className={cn(
          "min-w-[260px] rounded-2xl border bg-white shadow-sm transition-shadow",
          highlightClass,
        )}
      >
        <Handle type="source" position={Position.Right} className="!bg-neutral-400" />
        <div className="border-b border-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Dataset
        </div>
        <div className="p-4">
          {nodeData.empty ? (
            <button
              type="button"
              onClick={nodeData.onUpload}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              <span className="text-2xl text-neutral-400">+</span>
              <span>Add Dataset</span>
              <span className="text-xs text-neutral-400">CSV • XLSX • Parquet</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-neutral-900">{nodeData.label}</span>
              </div>
              {nodeData.subtitle && (
                <p className="text-xs text-neutral-500">{nodeData.subtitle}</p>
              )}
              {nodeData.meta?.map((line) => (
                <p key={line} className="text-xs text-neutral-600">{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-w-[200px] rounded-2xl border bg-white shadow-sm",
        highlightClass,
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-neutral-400" />
      <Handle type="source" position={Position.Right} className="!bg-neutral-400" />
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2">
        <Icon className="h-4 w-4 text-neutral-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {LABELS[nodeData.objectType]}
        </span>
      </div>
      <div className="p-4">
        <p className="font-medium text-neutral-900">{nodeData.label}</p>
        {nodeData.subtitle && (
          <p className="mt-1 text-xs text-neutral-500">{nodeData.subtitle}</p>
        )}
      </div>
    </div>
  );
}

export const nodeTypes = {
  canvasObject: CanvasObjectNode,
};
