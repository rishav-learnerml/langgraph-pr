// src/hooks/useConversationHistory.ts
import { useDispatch } from "react-redux";
import { setMessages } from "@/redux/slices/chatSlice";
import { useCallback } from "react";
import { BASE_URL, API_ENDPOINTS } from "@/constants/api_endpoints";

/**
 * Try to unescape the doubled-brace encoding your backend uses when persisting
 * tool JSON (it replaces '{' -> '{{' and '}' -> '}}').
 */
function unescapeDoubledBraces(s: string): string {
  if (!s || typeof s !== "string") return s;
  // Fast path: if it doesn't contain doubled braces, return as-is
  if (!s.includes("{{") && !s.includes("}}")) return s;
  return s.replace(/{{/g, "{").replace(/}}/g, "}");
}

/**
 * Try to parse a string as JSON, with a few recovery heuristics:
 *  - direct JSON.parse
 *  - try extracting substring from first "{" to last "}" and parse
 *  - return null if nothing parsed
 */
function tryParseJsonSafe(s: string): any | null {
  if (typeof s !== "string" || !s.trim()) return null;
  try {
    return JSON.parse(s);
  } catch {
    // try substring between first { and last }
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const sub = s.slice(first, last + 1);
      try {
        return JSON.parse(sub);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Create a concise preview string from a parsed tool payload (result/args)
 */
function makeToolPreview(parsed: any): string {
  try {
    if (!parsed) return "";
    // prefer result text if present
    const maybeResult = parsed.result ?? parsed.output ?? parsed.content;
    if (typeof maybeResult === "string" && maybeResult.trim()) {
      // show first paragraph or first 400 chars
      const firstParagraph = maybeResult.split(/\n\s*\n/)[0].trim();
      return firstParagraph.length > 400 ? firstParagraph.slice(0, 400) + " ... " : firstParagraph;
    }
    // if result is object
    if (typeof maybeResult === "object" && maybeResult !== null) {
      try {
        const j = JSON.stringify(maybeResult);
        return j.length > 400 ? j.slice(0, 400) + " ... " : j;
      } catch {
        return String(maybeResult).slice(0, 400);
      }
    }
    // otherwise try top-level fields
    const args = parsed.args ?? parsed.input ?? {};
    try {
      const j = JSON.stringify(args);
      if (j && j !== "{}") {
        return `args: ${j.length > 200 ? j.slice(0, 200) + "..." : j}`;
      }
    } catch {
      // ignore
    }
    // fallback to stringified parsed object
    try {
      const j = JSON.stringify(parsed);
      return j.length > 200 ? j.slice(0, 200) + "..." : j;
    } catch {
      return String(parsed).slice(0, 200);
    }
  } catch {
    return "";
  }
}

export function useConversationHistory() {
  const dispatch = useDispatch();

  const fetchConversation = useCallback(
    async (sessionId: string | null) => {
      if (!sessionId) return;
      try {
        const res = await fetch(`${BASE_URL}${API_ENDPOINTS.CHAT_HISTORY}/${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch conversation");
        const data = await res.json();

        const normalized = (data.messages || []).map((m: any, idx: number) => {
          const role = (m.role || "").toLowerCase();
          // Use an id if provided by server, otherwise fall back to synthetic id
          const id = m._id ?? m.id ?? `${role[0] ?? "m"}-${idx}`;

          // If server persisted tool ops they may have escaped JSON in content.
          // Try to detect and parse it so the client can restore structured meta.
          if (role === "tool") {
            const rawContent = typeof m.content === "string" ? m.content : "";
            // Unescape doubled braces ({{ -> {, }} -> })
            const unescaped = unescapeDoubledBraces(rawContent);

            // Attempt to parse as JSON
            const parsed = tryParseJsonSafe(unescaped);

            if (parsed && typeof parsed === "object") {
              // parsed may be shape: { "args": {...}, "result": {...}, "call_id": "..." }
              const args = parsed.args ?? parsed.input ?? parsed.arguments ?? null;
              const result = parsed.result ?? parsed.output ?? parsed.content ?? null;
              const call_id = parsed.call_id ?? parsed.callId ?? parsed.id ?? null;
              const tool_name = parsed.tool_name ?? parsed.name ?? parsed._tool ?? null;

              const preview = makeToolPreview(parsed) || (typeof result === "string" ? result.slice(0, 400) : "");
              const meta = {
                fromServer: true,
                parsed,
                args,
                result,
                call_id,
                tool_name,
              };

              return {
                id,
                type: "tool",
                content: preview || rawContent || String(tool_name ?? "tool"),
                isFinal: true,
                meta,
              };
            }

            // If parse failed, try a looser extraction: maybe content is already a readable string
            const fallbackPreview = rawContent && rawContent.length > 0 ? (rawContent.length > 400 ? rawContent.slice(0, 400) + "..." : rawContent) : "tool";
            return {
              id,
              type: "tool",
              content: fallbackPreview,
              isFinal: true,
              meta: { fromServer: true, raw: rawContent },
            };
          }

          if (role === "human") {
            return { id, type: "human", content: m.content ?? "", isFinal: true, meta: m.meta ?? null };
          }

          // default -> ai
          // Some AI messages might include meta too (keep it)
          return { id, type: "ai", content: m.content ?? "", isFinal: true, meta: m.meta ?? null };
        });

        dispatch(setMessages(normalized));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching conversation:", err);
      }
    },
    [dispatch]
  );

  return { fetchConversation };
}
