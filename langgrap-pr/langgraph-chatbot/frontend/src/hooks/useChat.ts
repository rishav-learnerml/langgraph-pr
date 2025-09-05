// src/hooks/useChat.ts
import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import {
  addMessage,
  updateMessageById,
  appendToLastMessage,
  setLastMessage,
  finalizeLastMessage,
  setLoading,
  setError,
} from "@/redux/slices/chatSlice";
import { API_ENDPOINTS, BASE_URL } from "@/constants/api_endpoints";
import { useLocation } from "react-router-dom";
import { MessageType } from "@/types/message";

/**
 * useChat - robust SSE streaming handler
 *
 * Behavior:
 * - Adds human message
 * - Adds ai placeholder (isFinal: false)
 * - Listens for SSE events: token, tool_call, tool_result, message (final), done
 * - token => appendToLastMessage
 * - tool_call => add tool message (mapping call_id -> client msg id)
 * - tool_result => updateMessageById for mapped tool message
 * - message => setLastMessage (final text) then finalizeLastMessage
 */

const useChat = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const evtRef = useRef<EventSource | null>(null);
  const toolMessageRef = useRef<Record<string, string>>({});

  const searchParams = new URLSearchParams(location.search);
  const urlThreadId = searchParams.get("sessionId") ?? undefined;

  const closeStream = useCallback(() => {
    if (evtRef.current) {
      try {
        evtRef.current.close();
      } catch (err) {
        console.warn("Error closing EventSource", err);
      }
      evtRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      closeStream();
    };
  }, [closeStream]);

  const sendMessage = useCallback(
    async (message: string, sessionId?: string) => {
      const activeThreadId = sessionId || urlThreadId;

      if (!activeThreadId) {
        dispatch(setError("No session ID provided"));
        return;
      }

      closeStream();

      dispatch(setLoading(true));
      dispatch(setError(null));

      try {
        // 1) Push human message
        const humanMsg = {
          id: uuidv4(),
          type: "human" as MessageType,
          content: message,
        };
        dispatch(addMessage(humanMsg));

        // 2) Push placeholder AI message (will receive streamed tokens)
        const aiMsgId = uuidv4();
        dispatch(
          addMessage({
            id: aiMsgId,
            type: "ai",
            content: "",
            isFinal: false,
          })
        );

        // Build SSE URL
        const url =
          `${BASE_URL}${API_ENDPOINTS.STREAM_CHAT}` +
          `?message=${encodeURIComponent(
            message
          )}&thread_id=${encodeURIComponent(activeThreadId)}`;

        const evtSource = new EventSource(url);
        evtRef.current = evtSource;

        evtSource.onopen = (ev) => {
          console.log("[SSE] opened", ev);
        };

        // tokens - append
        evtSource.addEventListener("token", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const text = typeof parsed === "object" ? parsed.text ?? "" : String(parsed);
            if (text) {
              console.log("[SSE] token:", text);
              dispatch(appendToLastMessage(String(text)));
            }
          } catch (err) {
            console.warn("[SSE] token parse error:", err, e.data);
            dispatch(appendToLastMessage(String(e.data)));
          }
        });

        // tool_call -> create a tool message and map call id to client id
        evtSource.addEventListener("tool_call", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            console.log("[SSE] tool_call:", parsed);
            const toolCallId = parsed.call_id ?? parsed.tool_name ?? uuidv4();
            const tool_name = parsed.tool_name ?? "unknown_tool";
            const args = parsed.args ?? {};
            const msgId = uuidv4();
            toolMessageRef.current[toolCallId] = msgId;
            dispatch(
              addMessage({
                id: msgId,
                type: "tool",
                content: `▶️ ${tool_name} called with ${JSON.stringify(args)}`,
                isFinal: false,
                meta: { tool_name, args, phase: "started", toolCallId },
              })
            );
          } catch (err) {
            console.warn("[SSE] tool_call parse error", err, e.data);
          }
        });

        // tool_result -> update mapped tool message
        evtSource.addEventListener("tool_result", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            console.log("[SSE] tool_result:", parsed);
            const toolCallId = parsed.call_id ?? null;
            const tool_name = parsed.tool_name ?? "unknown_tool";
            let result = parsed.result ?? parsed.output ?? parsed;

            if (typeof result === "string") {
              try {
                result = JSON.parse(result);
              } catch {}
            }

            const mappedMsgId =
              (toolCallId && toolMessageRef.current[toolCallId]) ||
              toolMessageRef.current[tool_name] ||
              null;

            const pretty =
              typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);

            if (mappedMsgId) {
              dispatch(
                updateMessageById({
                  id: mappedMsgId,
                  patch: {
                    content: pretty,
                    isFinal: true,
                    meta: { tool_name, result, phase: "finished", toolCallId },
                  },
                })
              );
              // optionally remove mapping now
              if (toolCallId && toolMessageRef.current[toolCallId]) {
                delete toolMessageRef.current[toolCallId];
              }
            } else {
              // fallback: push a new tool message
              dispatch(
                addMessage({
                  id: uuidv4(),
                  type: "tool",
                  content: `◀️ ${tool_name} result: ${pretty}`,
                  isFinal: true,
                  meta: { tool_name, result, phase: "finished", toolCallId },
                })
              );
            }
          } catch (err) {
            console.warn("[SSE] tool_result parse error", err, e.data);
          }
        });

        // final human-facing message: set final content then finalize
        evtSource.addEventListener("message", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const text = parsed?.text ?? "";
            console.log("[SSE] final message:", text);

            if (text) {
              // Replace final content (not append)
              dispatch(setLastMessage(String(text)));
            } else {
              console.warn("[SSE] message event had no text:", e.data);
            }
          } catch (err) {
            console.warn("[SSE] final message parse failed:", err, e.data);
          }

          dispatch(finalizeLastMessage());
          dispatch(setLoading(false));
          closeStream();
        });

        // done marker (backup finalize)
        evtSource.addEventListener("done", () => {
          console.log("[SSE] done");
          dispatch(finalizeLastMessage());
          dispatch(setLoading(false));
          closeStream();
        });

        // SSE onerror
        evtSource.onerror = (err) => {
          console.error("SSE error", err);
          closeStream();
          dispatch(setError("Streaming connection failed"));
          dispatch(setLoading(false));
        };
      } catch (err) {
        closeStream();
        dispatch(setError("Failed to send message. Please try again."));
        dispatch(setLoading(false));
        console.error("sendMessage error", err);
      }
    },
    [closeStream, dispatch, urlThreadId]
  );

  return { sendMessage, thread_id: urlThreadId, closeStream };
};

export default useChat;
