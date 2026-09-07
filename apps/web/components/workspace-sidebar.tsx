"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  activeWorkspaceId?: string;
}

export function WorkspaceSidebar({ activeWorkspaceId }: WorkspaceSidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: api.listWorkspaces,
  });

  const createMutation = useMutation({
    mutationFn: () => api.createWorkspace("New Workspace"),
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push(`/workspace/${workspace.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push("/");
    },
  });

  return (
    <aside className="flex h-full w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Workspaces
          </p>
          <h2 className="text-sm font-semibold text-neutral-900">InsightForge</h2>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          title="New workspace"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <p className="px-2 py-4 text-xs text-neutral-400">Loading...</p>
        )}
        {!isLoading && workspaces.length === 0 && (
          <p className="px-2 py-4 text-xs text-neutral-400">No workspaces yet</p>
        )}
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={cn(
              "group mb-1 flex items-center gap-2 rounded-lg px-2 py-2",
              activeWorkspaceId === ws.id ? "bg-neutral-100" : "hover:bg-neutral-50",
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0 text-neutral-400" />
            <Link
              href={`/workspace/${ws.id}`}
              className="flex-1 truncate text-sm text-neutral-700"
            >
              {ws.title}
            </Link>
            <button
              type="button"
              className="hidden rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-red-500 group-hover:block"
              onClick={() => {
                if (confirm("Delete this workspace?")) deleteMutation.mutate(ws.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
