// src/components/chat/AnswerBubble.tsx
import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { BotIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface AnswerBubbleProps {
  msg: any; // { id, type: "ai", content: string, isFinal?: boolean }
  isStreaming?: boolean;
  isFinal?: boolean;
  toolResult?: any; // optional result passed from an immediately preceding tool call
}

function safeJsonParse(str: string): any | null {
  if (!str || typeof str !== "string") return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}


/**
 * Helper: try to decode escaped unicode sequences like \u2014 into real characters
 */
function decodeEscapes(s: string) {
  try {
    // JSON.parse trick to decode escapes safely if we wrap in quotes
    return JSON.parse(`"${s.replace(/"/g, '\\"')}"`);
  } catch {
    // fallback: replace common escapes
    return s
      .replace(/\\u2014/g, "—")
      .replace(/\\u2019/g, "’")
      .replace(/\\u201c/g, "“")
      .replace(/\\u201d/g, "”");
  }
}

/**
 * Normalize a raw string that may contain doubled braces like '{{' or '}}'
 * and attempt to extract the inner `result` field or the whole object.
 */
function extractToolResult(raw: any): string | null {
  if (raw === null || typeof raw === "undefined") return null;

  // If it's already an object and has `result` key, prefer that
  if (typeof raw === "object") {
    if ("result" in raw) {
      try {
        const r = raw.result;
        return typeof r === "string" ? r : JSON.stringify(r, null, 2);
      } catch {
        return String(raw.result ?? raw);
      }
    }
    // otherwise pretty-print whole object (but we'll still attempt to find result below)
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      // continue to string logic
    }
  }

  // Ensure it's a string now
  let s = String(raw);

  if (!s.trim()) return null;

  // 1) Normalize doubled braces to single braces (common in templates)
  //    but only if it's safe: replace '{{'->'{' and '}}'->'}'
  if (s.includes("{{") || s.includes("}}")) {
    s = s.replace(/{{/g, "{").replace(/}}/g, "}");
  }

  // 2) Try JSON.parse directly
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object") {
      if ("result" in parsed) {
        const r = parsed.result;
        return typeof r === "string" ? r : JSON.stringify(r, null, 2);
      }
      // if nested, try to find result deeper
      // attempt shallow search for 'result' anywhere
      if (parsed && typeof parsed === "object") {
        // find result in first-level children
        for (const k of Object.keys(parsed)) {
          const val = parsed[k];
          if (val && typeof val === "object" && "result" in val) {
            const r = (val as any).result;
            return typeof r === "string" ? r : JSON.stringify(r, null, 2);
          }
        }
      }
      // fallback to entire JSON pretty print
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    // fall through
  }
  

  // 3) Attempt to extract a "result" field using regex
  //    Match "result": <value> where value may be object or string
  try {
    const resultRegex = /"result"\s*:\s*(\{[\s\S]*?\}|"(?:(?:\\.|[^"\\])*)")/m;
    const m = s.match(resultRegex);
    if (m && m[1]) {
      let token = m[1].trim();
      // if token is a JSON string (starts with "), strip quotes and decode escapes
      if (token.startsWith('"') && token.endsWith('"')) {
        // remove wrapping quotes then unescape sequences
        const unq = token.slice(1, -1).replace(/\\"/g, '"');
        return decodeEscapes(unq);
      }
      // if token looks like an object, try parse it
      if (token.startsWith("{") && token.endsWith("}")) {
        try {
          const obj = JSON.parse(token);
          // if nested "result" inside, unwrap further
          if (obj && typeof obj === "object" && "result" in obj) {
            const inner = obj.result;
            return typeof inner === "string"
              ? inner
              : JSON.stringify(inner, null, 2);
          }
          return JSON.stringify(obj, null, 2);
        } catch {
          // fallback to raw token
          return token;
        }
      }
      // fallback
      return token;
    }
  } catch {
    // ignore
  }

  // 4) fallback: replace common escaped unicode sequences and trim
  const decoded = s
    .replace(/\\u2014/g, "—")
    .replace(/\\u2019/g, "’")
    .replace(/\\u201c/g, "“")
    .replace(/\\u201d/g, "”")
    .replace(/\\n/g, "\n");

  return decoded;
}

/**
 * AnswerBubble shows:
 *  - only the extracted tool result (not the entire tool payload)
 *  - assistant content below
 *  - optional show-more toggle for long tool results
 */
const AnswerBubble: React.FC<AnswerBubbleProps> = ({
  msg,
  isStreaming,
  isFinal,
  toolResult,
}) => {
  const content = String(msg?.content ?? "");

  // compute prettyTool once
  const prettyTool = useMemo(() => extractToolResult(toolResult), [toolResult]);

  // manage show/hide for long results
  const [expanded, setExpanded] = useState(false);
  const MAX_PREVIEW_LINES = 8;

  // const previewText = useMemo(() => {
  //   if (!prettyTool) return "";
  //   const lines = prettyTool.split(/\r?\n/);
  //   if (lines.length <= MAX_PREVIEW_LINES) return prettyTool;
  //   return lines.slice(0, MAX_PREVIEW_LINES).join("\n") + "\n...";
  // }, [prettyTool]);

  // If there's neither assistant content nor tool result -> render nothing
  if (!prettyTool && !content.trim()) return null;

  return (
    <div className="flex items-start gap-3 animate-fade-in my-4">
      <Avatar className="h-10 w-10 border shadow-sm mt-2">
        <AvatarImage src="/bot-avatar.png" alt="Bot" />
        <AvatarFallback>
          <BotIcon className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>

      <div className="w-full max-w-[78vw]">
        <Card className="bg-gray-700 text-white dark:bg-gray-300 dark:text-black shadow-xl border border-gray-600 rounded-b-2xl rounded-tr-2xl transition hover:shadow-2xl">
          <CardContent className="prose dark:prose-invert prose-p:leading-relaxed text-sm md:text-base p-4">
            {/* Show only the extracted tool result */}
            {prettyTool && (
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground mb-1">
                    Tool result
                  </div>
                  {prettyTool.split(/\r?\n/).length > MAX_PREVIEW_LINES && (
                    <button
                      onClick={() => setExpanded((v) => !v)}
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                    >
                      {expanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
                {(() => {
          const parsed = safeJsonParse(prettyTool);
          return parsed && parsed.result ? parsed.result : prettyTool;
        })()}
              </div>
            )}

            {isStreaming && !isFinal ? (
              <span key={content.length}>
                {content}
                <span className="animate-pulse">▋</span>
              </span>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnswerBubble;
