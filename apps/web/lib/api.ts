import type { UploadResponse, WorkspaceState, WorkspaceSummary } from "./types";

export type ApplyCommandResponse = {
  workspace: WorkspaceState;
  can_undo: boolean;
  can_redo: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  listWorkspaces: () => request<WorkspaceSummary[]>("/api/workspaces"),

  createWorkspace: (title = "Untitled Workspace") =>
    request<WorkspaceState>("/api/workspaces", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getWorkspace: (id: string) => request<WorkspaceState>(`/api/workspaces/${id}`),

  saveWorkspace: (workspace: WorkspaceState) =>
    request<WorkspaceState>(`/api/workspaces/${workspace.id}`, {
      method: "PUT",
      body: JSON.stringify(workspace),
    }),

  deleteWorkspace: (id: string) =>
    request<{ deleted: boolean }>(`/api/workspaces/${id}`, { method: "DELETE" }),

  applyCommand: (workspaceId: string, command: string, payload: Record<string, unknown>) =>
    request<ApplyCommandResponse>(`/api/workspaces/${workspaceId}/commands`, {
      method: "POST",
      body: JSON.stringify({ command, payload }),
    }),

  uploadDataset: async (workspaceId: string, file: File, objectId?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("workspace_id", workspaceId);
    if (objectId) form.append("object_id", objectId);

    const res = await fetch(`${API_URL}/api/datasets`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || res.statusText);
    }
    return res.json() as Promise<UploadResponse>;
  },

  getDatasetProfile: (datasetId: string, workspaceId: string) =>
    request<UploadResponse["profile"]>(
      `/api/datasets/${datasetId}/profile?workspace_id=${workspaceId}`,
    ),
};
