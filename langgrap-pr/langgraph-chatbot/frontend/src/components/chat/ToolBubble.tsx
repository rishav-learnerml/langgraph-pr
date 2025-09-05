// src/components/chat/ToolBubble.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, HammerIcon } from "lucide-react";

function prettyJson(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/** Minimal spinner */
const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-4 w-4 animate-spin"} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-90" d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * ToolBubble
 * Expects msg to have:
 *  - id, type === "tool", content (string), isFinal (boolean)
 *  - optional meta: { tool_name, args, result, call_id, toolCallId }
 *
 * UI behavior:
 *  - Only a compact heading row is visible by default.
 *  - Clicking the heading toggles an expanded panel that shows Args / Result / Raw content.
 */
const ToolBubble: React.FC<{ msg: any }> = ({ msg }) => {
  const [open, setOpen] = useState(false);
  const meta = msg.meta ?? {};
  const title = meta.tool_name ?? meta.toolName ?? meta.name ?? "tool";
  const args = meta.args ?? meta.input ?? meta.arguments ?? null;
  const result = meta.result ?? meta.output ?? meta.content ?? null;
  const callId = meta.call_id ?? meta.toolCallId ?? meta.callId ?? null;
  const running = msg.isFinal === false || msg.phase === "start" || msg.status === "running";

  // Short one-line preview derived from result or content (only for heading)
  const shortPreview = (() => {
    if (result) {
      if (typeof result === "string") return result.split("\n\n")[0].slice(0, 120);
      try {
        const s = JSON.stringify(result);
        return s.length > 120 ? s.slice(0, 120) + "..." : s;
      } catch {
        return String(result).slice(0, 120);
      }
    }
    if (typeof msg.content === "string" && msg.content.length > 0) {
      return msg.content.split("\n\n")[0].slice(0, 120);
    }
    return "";
  })();

  return (
    <div className="flex items-start gap-3 my-4">
      <Avatar className="h-9 w-9 border mt-2">
        <AvatarImage src="/bot-avatar.png" alt="Tool" />
        <AvatarFallback>
          <HammerIcon className="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>

      <div className="w-full max-w-[78vw]">
        {/* Heading card (always visible) */}
        <Card className="bg-gray-800/80 text-white border border-gray-600 shadow-sm rounded-tl-xl rounded-br-xl cursor-pointer">
          <CardContent
            className="p-3 text-sm flex items-center justify-between gap-3"
            onClick={() => setOpen((v) => !v)}
            role="button"
            aria-expanded={open}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen((v) => !v);
              }
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-black/30">
                {running ? <Spinner className="h-4 w-4 text-yellow-400" /> : <div className="h-3 w-3 rounded-full bg-green-400" />}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-yellow-500 text-black text-xs font-medium truncate">
                    {title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{running ? "Running..." : "Finished"}</div>
                </div>
                {shortPreview && <div className="text-xs text-muted-foreground mt-1 truncate">{shortPreview}</div>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {callId && <div className="text-xs text-muted-foreground truncate">{String(callId)}</div>}
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground mr-1">{open ? "Hide" : "Show"}</div>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expanded details - only visible when open */}
        {open && (
          <div className="mt-2 rounded-md border border-gray-600 bg-gray-900/80 p-3 text-xs font-mono">
            {args ? (
              <>
                <div className="font-medium mb-1">Args</div>
                <pre className="whitespace-pre-wrap overflow-auto rounded bg-black/90 p-2 text-[12px]">
                  <code>{prettyJson(args)}</code>
                </pre>
              </>
            ) : (
              <div className="text-muted-foreground mb-2">No structured args available.</div>
            )}

            {result ? (
              <>
                <div className="font-medium mt-3 mb-1">Result</div>
                <pre className="whitespace-pre-wrap overflow-auto rounded bg-black/90 p-2 text-[12px]">
                  <code>{prettyJson(result)}</code>
                </pre>
              </>
            ) : (
              <div className="text-muted-foreground mt-2">No result available yet.</div>
            )}

            {/* Raw fallback content */}
            <div className="mt-3 text-xs text-muted-foreground">Raw</div>
            <pre className="mt-1 whitespace-pre-wrap rounded bg-black/90 p-2 text-[12px]">
              <code>{String(msg.content ?? "")}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolBubble;
