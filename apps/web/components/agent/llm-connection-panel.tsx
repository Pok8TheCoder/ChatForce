"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Plug, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type LlmPreset } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LlmConnectionPanel() {
  const [open, setOpen] = useState(false);
  const [presetId, setPresetId] = useState("none");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: presets = [] } = useQuery({
    queryKey: ["llm-presets"],
    queryFn: api.listLlmPresets,
  });

  const { data: config } = useQuery({
    queryKey: ["llm-config"],
    queryFn: api.getLlmConfig,
  });

  useEffect(() => {
    if (!config) return;
    setPresetId(config.preset_id);
    setBaseUrl(config.base_url);
    setModel(config.model);
  }, [config]);

  const selectedPreset = presets.find((p) => p.id === presetId);

  const applyPreset = (preset: LlmPreset) => {
    setPresetId(preset.id);
    setBaseUrl(preset.base_url);
    setModel(preset.default_model);
    setTestResult(null);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateLlmConfig({
        preset_id: presetId,
        base_url: baseUrl,
        api_key: apiKey || undefined,
        model,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llm-config"] });
      setApiKey("");
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      await api.updateLlmConfig({
        preset_id: presetId,
        base_url: baseUrl,
        api_key: apiKey || undefined,
        model,
      });
      return api.testLlmConnection();
    },
    onSuccess: (result) => setTestResult(result),
    onError: (err) =>
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : "Connection failed",
      }),
  });

  const isNone = presetId === "none";

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <Plug className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">LLM Connection</span>
          {config && config.enabled && config.preset_id !== "none" && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {presets.find((p) => p.id === config.preset_id)?.name || config.preset_id}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left transition-colors",
                  presetId === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <p className="text-[11px] font-medium text-foreground">{preset.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>

          {!isNone && (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Base URL
                </label>
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={selectedPreset?.base_url || "http://localhost:11434/v1"}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-muted-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Model
                </label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={selectedPreset?.default_model || "model name"}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-muted-foreground"
                />
              </div>
              {(selectedPreset?.requires_api_key || presetId === "custom-openai") && (
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    API Key {config?.api_key_set && !apiKey ? "(saved)" : ""}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-muted-foreground"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Test"
              )}
            </Button>
          </div>

          {testResult && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs",
                testResult.ok
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400",
              )}
            >
              {testResult.ok ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
