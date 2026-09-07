"use client";

import { useMutation } from "@tanstack/react-query";
import { Upload, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: async (file?: File) => {
      const workspace = await api.createWorkspace(
        file ? file.name.replace(/\.[^.]+$/, "") : "Demo Workspace",
      );
      if (file) {
        await api.uploadDataset(workspace.id, file);
      }
      return workspace;
    },
    onSuccess: (workspace) => {
      router.push(`/workspace/${workspace.id}`);
    },
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) createMutation.mutate(file);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fb] px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
          <Sparkles className="h-3 w-3" />
          InsightForge
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900">
          Drop in data.
          <br />
          Build the story automatically.
        </h1>
        <p className="mt-4 text-neutral-600">
          Upload an unfamiliar spreadsheet and get an explainable visual analytical workspace —
          editable by hand, controllable by AI.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.parquet"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={createMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            Upload your dataset
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => createMutation.mutate(undefined)}
            disabled={createMutation.isPending}
          >
            Try Demo Workspace
          </Button>
        </div>

        {createMutation.isError && (
          <p className="mt-4 text-sm text-red-600">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "Something went wrong"}
          </p>
        )}
      </div>
    </div>
  );
}
