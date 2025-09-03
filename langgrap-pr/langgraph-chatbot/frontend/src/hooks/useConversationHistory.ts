import { useDispatch } from "react-redux";
import { setMessages } from "@/redux/slices/chatSlice";
import { useCallback } from "react";
import { BASE_URL, API_ENDPOINTS } from "@/constants/api_endpoints";

export function useConversationHistory() {
  const dispatch = useDispatch();

  const fetchConversation = useCallback(
    async (sessionId: string|null) => {
      if (!sessionId) return;
      try {
        const res = await fetch(
          `${BASE_URL}${API_ENDPOINTS.CHAT_HISTORY}/${sessionId}`
        );
        if (!res.ok) throw new Error("Failed to fetch conversation");
        const data = await res.json();
        // Normalize messages into redux format
        dispatch(
          setMessages(
            data.messages.map((m: any) => ({
              type: m.role === "human" ? "human" : "ai",
              content: m.content,
              isFinal: true,
            }))
          )
        );
      } catch (err) {
        console.error("Error fetching conversation:", err);
      }
    },
    [dispatch]
  );

  return { fetchConversation };
}
