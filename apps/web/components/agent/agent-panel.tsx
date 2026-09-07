"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { LlmConnectionPanel } from "./llm-connection-panel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AgentPanelProps {
  workspaceId: string;
  activeTargetId?: string | null;
  activeTargetLabel?: string | null;
}

export function AgentPanel({ workspaceId, activeTargetId, activeTargetLabel }: AgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm your InsightForge assistant. Configure an LLM connection above, upload a dataset, or use the canvas tools to build your analysis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await api.llmChat(text, {
        workspace_id: workspaceId,
        active_target: activeTargetId
          ? { object_id: activeTargetId, label: activeTargetLabel }
          : undefined,
      });
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: result.message },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: err instanceof Error ? err.message : "Failed to reach the agent.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Agent
        </p>
        <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        {activeTargetId && (
          <p className="mt-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-600 dark:text-blue-400">
            Pointed to: {activeTargetLabel || activeTargetId}
          </p>
        )}
      </div>

      <LlmConnectionPanel />

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the agent..."
            disabled={loading}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-muted-foreground disabled:opacity-50"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
