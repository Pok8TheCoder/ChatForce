"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection as FlowConnection,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { CanvasObjectType, WorkspaceState } from "@/lib/types";
import { nodeTypes } from "./canvas-object-node";
import { CanvasToolbar, type CanvasTool } from "./canvas-toolbar";
import { ContextMenu, type ContextMenuState } from "./context-menu";

interface InfiniteCanvasProps {
  workspace: WorkspaceState;
  onWorkspaceChange: (workspace: WorkspaceState) => void;
  onPointToAi?: (objectId: string) => void;
}

function workspaceToNodes(workspace: WorkspaceState): Node[] {
  return workspace.objects.map((obj) => ({
    id: obj.id,
    type: "canvasObject",
    position: { x: obj.position.x, y: obj.position.y },
    data: {
      objectType: obj.type,
      label: (obj.data.label as string) || obj.type,
      subtitle: obj.data.subtitle as string | undefined,
      meta: obj.data.meta as string[] | undefined,
      empty: obj.data.empty as boolean | undefined,
      objectId: obj.id,
    },
    style: { width: obj.size.width, height: obj.size.height },
    selected: workspace.selected_object_ids.includes(obj.id),
  }));
}

function workspaceToEdges(workspace: WorkspaceState): Edge[] {
  return workspace.connections.map((conn) => {
    const isArrow = conn.label === "→";
    return {
      id: conn.id,
      source: conn.source_id,
      target: conn.target_id,
      animated: isArrow,
      label: conn.label || undefined,
      style: {
        stroke: isArrow ? "#2563eb" : "#737373",
        strokeWidth: isArrow ? 2 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isArrow ? "#2563eb" : "#737373",
        width: 16,
        height: 16,
      },
    };
  });
}

function InfiniteCanvasInner({ workspace, onWorkspaceChange, onPointToAi }: InfiniteCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistWorkspace = useCallback(
    (updated: WorkspaceState) => {
      onWorkspaceChange(updated);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        api.saveWorkspace(updated).catch(console.error);
      }, 500);
    },
    [onWorkspaceChange],
  );

  const applyCommand = useCallback(
    async (command: string, payload: Record<string, unknown>) => {
      const result = await api.applyCommand(workspace.id, command, payload);
      persistWorkspace(result.workspace);
      return result.workspace;
    },
    [workspace.id, persistWorkspace],
  );

  useEffect(() => {
    setNodes(workspaceToNodes(workspace));
    setEdges(workspaceToEdges(workspace));
  }, [workspace, setNodes, setEdges]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        setConnectSourceId(null);
        if (activeTool === "connect" || activeTool === "arrow") setActiveTool("select");
      }
      if (e.key === "v" && !e.metaKey && !e.ctrlKey) setActiveTool("select");
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) setActiveTool("connect");
      if (e.key === "a" && !e.metaKey && !e.ctrlKey) setActiveTool("arrow");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTool]);

  const handleToolChange = useCallback((tool: CanvasTool) => {
    setActiveTool(tool);
    setConnectSourceId(null);
  }, []);

  const connectHint = useMemo(() => {
    if (activeTool !== "connect" && activeTool !== "arrow") return null;
    if (!connectSourceId) return "Step 1: click the source object";
    const source = workspace.objects.find((o) => o.id === connectSourceId);
    const label = (source?.data.label as string) || "object";
    return `Step 2: click target to connect from "${label}"`;
  }, [activeTool, connectSourceId, workspace.objects]);

  const handleNodeClick = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
      if (activeTool !== "connect" && activeTool !== "arrow") return;

      if (!connectSourceId) {
        setConnectSourceId(node.id);
        return;
      }

      if (connectSourceId === node.id) {
        setConnectSourceId(null);
        return;
      }

      await applyCommand("CONNECT", {
        source_id: connectSourceId,
        target_id: node.id,
        label: activeTool === "arrow" ? "→" : undefined,
      });
      setConnectSourceId(null);
    },
    [activeTool, connectSourceId, applyCommand],
  );

  const handleConnect = useCallback(
    async (connection: FlowConnection) => {
      if (!connection.source || !connection.target) return;
      await applyCommand("CONNECT", {
        source_id: connection.source,
        target_id: connection.target,
      });
    },
    [applyCommand],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const createObject = useCallback(
    async (type: CanvasObjectType, position?: { x: number; y: number }) => {
      const pos = position || { x: 200 + Math.random() * 200, y: 150 + Math.random() * 150 };
      const data: Record<string, unknown> = {
        label: type.charAt(0).toUpperCase() + type.slice(1),
      };
      if (type === "dataset") {
        data.empty = true;
        data.label = "Dataset";
      }
      await applyCommand("CREATE_OBJECT", {
        type,
        position: pos,
        size: { width: type === "dataset" ? 280 : 240, height: type === "dataset" ? 200 : 160 },
        data,
      });
    },
    [applyCommand],
  );

  const handleContextAction = useCallback(
    async (action: string) => {
      if (action.startsWith("create-")) {
        const type = action.replace("create-", "") as CanvasObjectType;
        const pos = contextMenu
          ? screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y })
          : undefined;
        await createObject(type, pos);
        return;
      }
      if (action === "zoom-fit") {
        fitView({ padding: 0.2 });
        return;
      }
      if (action === "upload-dataset" && contextMenu?.objectId) {
        uploadTargetRef.current = contextMenu.objectId;
        fileInputRef.current?.click();
        return;
      }
      if (action === "delete" && contextMenu?.objectId) {
        await applyCommand("DELETE_OBJECT", { object_id: contextMenu.objectId });
        return;
      }
      if (action === "point-to-ai" && contextMenu?.objectId) {
        onPointToAi?.(contextMenu.objectId);
      }
    },
    [applyCommand, contextMenu, createObject, fitView, onPointToAi, screenToFlowPosition],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const objectId = uploadTargetRef.current;
      if (!file || !objectId) return;

      try {
        const result = await api.uploadDataset(workspace.id, file, objectId);
        const profile = result.profile;
        const typeCounts = profile.type_counts || {};
        const meta = [
          `${profile.rows?.toLocaleString() ?? 0} records`,
          `${profile.columns ?? 0} columns`,
          ...Object.entries(typeCounts).map(([k, v]) => `${k}: ${v}`),
        ];
        const updated = await api.getWorkspace(workspace.id);
        const objects = updated.objects.map((obj) =>
          obj.id === objectId
            ? {
                ...obj,
                data: {
                  ...obj.data,
                  empty: false,
                  label: file.name.replace(/\.[^.]+$/, ""),
                  subtitle: file.name,
                  meta,
                  dataset_id: result.dataset_id,
                  profile,
                },
              }
            : obj,
        );
        persistWorkspace({ ...updated, objects });
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Upload failed");
      }
      e.target.value = "";
      uploadTargetRef.current = null;
    },
    [workspace.id, persistWorkspace],
  );

  const onPaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault();
    const clientX = "clientX" in e ? e.clientX : 0;
    const clientY = "clientY" in e ? e.clientY : 0;
    setContextMenu({ x: clientX, y: clientY, target: "canvas" });
  }, []);

  const onNodeContextMenu = useCallback((e: MouseEvent | React.MouseEvent, node: Node) => {
    e.preventDefault();
    const clientX = "clientX" in e ? e.clientX : 0;
    const clientY = "clientY" in e ? e.clientY : 0;
    const data = node.data as { objectType: CanvasObjectType };
    setContextMenu({
      x: clientX,
      y: clientY,
      target: "object",
      objectId: node.id,
      objectType: data.objectType,
    });
  }, []);

  const nodesWithUpload = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isConnectSource: connectSourceId === node.id,
          onUpload: () => {
            uploadTargetRef.current = node.id;
            fileInputRef.current?.click();
          },
        },
        draggable: activeTool === "select",
      })),
    [nodes, connectSourceId, activeTool],
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-[#f8f9fb]">
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        connectHint={connectHint}
        onZoomFit={() => fitView({ padding: 0.2 })}
      />
      <div className="relative flex-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.parquet"
        className="hidden"
        onChange={handleFileUpload}
      />
      <ReactFlow
        nodes={nodesWithUpload}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        nodesConnectable={activeTool === "select"}
        elementsSelectable={activeTool === "select"}
        onNodeDragStop={(_event, node) => {
          if (activeTool !== "select") return;
          void applyCommand("MOVE_OBJECT", {
            object_id: node.id,
            position: node.position,
          });
        }}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        className={activeTool === "connect" || activeTool === "arrow" ? "cursor-crosshair" : undefined}
        defaultViewport={{
          x: workspace.viewport.x,
          y: workspace.viewport.y,
          zoom: workspace.viewport.zoom,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d4d8" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#e5e7eb"
          maskColor="rgba(248,249,251,0.8)"
          className="!rounded-xl !border !border-neutral-200"
        />
      </ReactFlow>
      <ContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onAction={handleContextAction}
      />
      </div>
    </div>
  );
}

export function InfiniteCanvas(props: InfiniteCanvasProps) {
  return (
    <ReactFlowProvider>
      <InfiniteCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
