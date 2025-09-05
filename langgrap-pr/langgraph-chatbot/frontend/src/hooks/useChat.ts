// src/hooks/useChat.ts
import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import {
  addMessage,
  updateLastMessage,
  finalizeLastMessage,
  setLoading,
  setError,
  updateMessageById,
} from "@/redux/slices/chatSlice";
import { API_ENDPOINTS, BASE_URL } from "@/constants/api_endpoints";
import { useLocation } from "react-router-dom";
import { MessageType } from "@/types/message";

/**
 * useChat
 * - Streams assistant tokens into the last AI message (updateLastMessage)
 * - Adds a tool message on tool_call and updates the same message on tool_result using updateMessageById
 * - Finalizes AI messages on `message` or `done`
 *
 * Assumes Message type accepts fields: id, type, content, isFinal?, meta?
 */
const useChat = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  // EventSource ref
  const evtRef = useRef<EventSource | null>(null);

  // Map to correlate tool_name (or a tool call id) -> client message id
  // If your server can emit a unique call id per tool call, prefer that over tool_name
  const toolMessageRef = useRef<Record<string, string>>({});

  // Extract sessionId from query params
  const searchParams = new URLSearchParams(location.search);
  const urlThreadId = searchParams.get("sessionId") ?? undefined;

  const closeStream = useCallback(() => {
    if (evtRef.current) {
      try {
        evtRef.current.close();
      } catch (err) {
        // ignore
        // eslint-disable-next-line no-console
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

      // Close any ongoing streams
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

        // 2) Push placeholder AI message that will receive streamed tokens
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

        // Diagnostics
        evtSource.onopen = (ev) => {
          // eslint-disable-next-line no-console
          console.log("SSE opened", ev);
        };

        // Token event: append token to last AI message
        evtSource.addEventListener("token", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const text =
              typeof parsed === "object" ? parsed.text ?? "" : parsed;
            if (text) {
              dispatch(updateLastMessage(text));
            }
          } catch (err) {
            // fallback: append raw data
            if (e.data) {
              dispatch(updateLastMessage(e.data));
            }
            // eslint-disable-next-line no-console
            console.warn("token parse error", err, e.data);
          }
        });

        // Tool call started -> add a tool message and record mapping
        evtSource.addEventListener("tool_call", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            // server should ideally send a unique call_id; fall back to tool_name
            const toolCallId = parsed.call_id ?? parsed.tool_name ?? uuidv4();
            const tool_name = parsed.tool_name ?? "unknown_tool";
            const args = parsed.args ?? {};

            const msgId = uuidv4();
            // Map the server toolCallId (or tool_name) to this client message id
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
            // eslint-disable-next-line no-console
            console.warn("tool_call parse error", err, e.data);
            const msgId = uuidv4();
            dispatch(
              addMessage({
                id: msgId,
                type: "tool",
                content: `▶️ tool called: ${String(e.data)}`,
                isFinal: false,
                meta: { raw: e.data },
              })
            );
          }
        });

        // Tool result -> update the original tool message in-place via updateMessageById
        evtSource.addEventListener("tool_result", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const toolCallId = parsed.call_id ?? parsed.tool_name ?? null;
            const tool_name = parsed.tool_name ?? "unknown_tool";
            let result = parsed.result ?? parsed.output ?? parsed;

            // If result is a JSON string, try parsing it
            if (typeof result === "string") {
              try {
                const maybeObj = JSON.parse(result);
                result = maybeObj;
              } catch {
                // keep string
              }
            }

            const mappedMsgId =
              (toolCallId && toolMessageRef.current[toolCallId]) ||
              toolMessageRef.current[tool_name] ||
              null;

            const pretty =
              typeof result === "object"
                ? JSON.stringify(result, null, 2)
                : String(result);

            if (mappedMsgId) {
              dispatch(
                updateMessageById({
                  id: mappedMsgId,
                  patch: {
                    content: `${pretty}`,
                    isFinal: true,
                    meta: { tool_name, result, phase: "finished", toolCallId },
                  },
                })
              );
              if (toolCallId && toolMessageRef.current[toolCallId]) {
                delete toolMessageRef.current[toolCallId];
              } else if (toolMessageRef.current[tool_name]) {
                delete toolMessageRef.current[tool_name];
              }
            } else {
              // fallback
              const fallbackId = uuidv4();
              dispatch(
                addMessage({
                  id: fallbackId,
                  type: "tool",
                  content: `◀️ ${tool_name} result: ${pretty}`,
                  isFinal: true,
                  meta: { tool_name, result, phase: "finished", toolCallId },
                })
              );
            }
          } catch (err) {
            console.warn("tool_result parse error", err, e.data);
            const fallbackId = uuidv4();
            dispatch(
              addMessage({
                id: fallbackId,
                type: "tool",
                content: `◀️ tool result: ${String(e.data)}`,
                isFinal: true,
                meta: { raw: e.data },
              })
            );
          }
        });

        // Final assistant message event — finalize the last AI message
        evtSource.addEventListener("message", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const text = parsed.text ?? "";
            // if server sent final text, we could append it (but tokens should usually cover content)
            if (text) {
              // optionally: dispatch(updateLastMessage(text));
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("final message parse failed", err, e.data);
          }
          dispatch(finalizeLastMessage());
          dispatch(setLoading(false));
          closeStream();
        });

        // Done marker — also safe-finalize
        evtSource.addEventListener("done", () => {
          dispatch(finalizeLastMessage());
          dispatch(setLoading(false));
          closeStream();
        });

        // SSE onerror
        evtSource.onerror = (err) => {
          // eslint-disable-next-line no-console
          console.error("SSE error", err);
          closeStream();
          dispatch(setError("Streaming connection failed"));
          dispatch(setLoading(false));
        };
      } catch (err) {
        closeStream();
        dispatch(setError("Failed to send message. Please try again."));
        dispatch(setLoading(false));
        // eslint-disable-next-line no-console
        console.error("sendMessage error", err);
      }
    },
    [closeStream, dispatch, urlThreadId]
  );

  return { sendMessage, thread_id: urlThreadId, closeStream };
};

export default useChat;
