"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AgentPanel } from "@/components/agent/agent-panel";
import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { api } from "@/lib/api";
import type { WorkspaceState } from "@/lib/types";

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [activeTargetLabel, setActiveTargetLabel] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => api.getWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (data) setWorkspace(data);
  }, [data]);

  const handlePointToAi = useCallback(
    (objectId: string) => {
      const obj = workspace?.objects.find((o) => o.id === objectId);
      setActiveTargetId(objectId);
      setActiveTargetLabel((obj?.data.label as string) || objectId);
    },
    [workspace],
  );

  if (isLoading || !workspace) {
    return (
      <div className="flex h-screen items-center justify-center text-neutral-500">
        {error ? "Workspace not found" : "Loading workspace..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceSidebar activeWorkspaceId={workspaceId} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <h1 className="text-sm font-semibold text-neutral-900">{workspace.title}</h1>
          <span className="text-xs text-neutral-400">
            {workspace.objects.length} objects · {workspace.connections.length} connections
          </span>
        </header>
        <div className="flex-1 overflow-hidden">
          <InfiniteCanvas
            workspace={workspace}
            onWorkspaceChange={setWorkspace}
            onPointToAi={handlePointToAi}
          />
        </div>
      </main>
      <AgentPanel
        workspaceId={workspaceId}
        activeTargetId={activeTargetId}
        activeTargetLabel={activeTargetLabel}
      />
    </div>
  );
}
