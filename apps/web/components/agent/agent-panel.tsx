"use client";

import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        "I'm your InsightForge assistant. Upload a dataset, right-click the canvas to add objects, or ask me to help once analysis is available.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const targetNote = activeTargetId
      ? ` (targeting ${activeTargetLabel || activeTargetId})`
      : "";

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Agent tools will be wired in Phase 9. For now, use the canvas context menu to create and connect objects${targetNote}. Workspace: ${workspaceId}`,
        },
      ]);
    }, 400);
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">AI Agent</p>
        <h2 className="text-sm font-semibold text-neutral-900">Chat</h2>
        {activeTargetId && (
          <p className="mt-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
            Pointed to: {activeTargetLabel || activeTargetId}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                msg.role === "user" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600",
              )}
            >
              {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-800",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-200 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the agent..."
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
