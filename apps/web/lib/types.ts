export type CanvasObjectType =
  | "dataset"
  | "chart"
  | "kpi"
  | "insight"
  | "table"
  | "filter"
  | "summary"
  | "text"
  | "comment"
  | "group";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  position: Position;
  size: Size;
  z_index?: number;
  locked?: boolean;
  data: Record<string, unknown>;
}

export interface Connection {
  id: string;
  source_id: string;
  target_id: string;
  source_port?: string | null;
  target_port?: string | null;
  route?: Position[];
  label?: string | null;
}

export interface Comment {
  id: string;
  object_id?: string | null;
  position: Position;
  text: string;
  status: "open" | "in_progress" | "resolved" | "ignored";
}

export interface WorkspaceState {
  id: string;
  title: string;
  objects: CanvasObject[];
  connections: Connection[];
  comments: Comment[];
  viewport: Viewport;
  selected_object_ids: string[];
  undo_stack?: unknown[];
  redo_stack?: unknown[];
}

export interface WorkspaceSummary {
  id: string;
  title: string;
  updated_at?: string | null;
}

export interface DatasetProfile {
  rows: number;
  columns: number;
  column_names?: string[];
  type_counts?: Record<string, number>;
  missing_ratio?: number;
  preview?: Record<string, unknown>[];
  error?: string;
}

export interface UploadResponse {
  dataset_id: string;
  filename: string;
  workspace_id: string;
  size_bytes: number;
  profile: DatasetProfile;
}
