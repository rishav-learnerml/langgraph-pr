import { useDispatch } from "react-redux";
import {
  addMessage,
  updateLastMessage,
  finalizeLastMessage,
  setLoading,
  setError,
} from "@/redux/slices/chatSlice";
import { API_ENDPOINTS, BASE_URL } from "@/constants/api_endpoints";
import { useLocation } from "react-router-dom";

const useChat = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  // Extract sessionId from query params
  const searchParams = new URLSearchParams(location.search);
  const urlThreadId = searchParams.get("sessionId");

  const sendMessage = async (message: string, sessionId?: string) => {
    const activeThreadId = sessionId || urlThreadId;

    if (!activeThreadId) {
      console.error("No thread_id found (URL or argument missing)");
      dispatch(setError("No session ID provided"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Push human + placeholder ai message into store
      dispatch(addMessage({ type: "human", content: message }));
      dispatch(addMessage({ type: "ai", content: "", isFinal: false }));

      // Open SSE connection
      const evtSource = new EventSource(
        `${BASE_URL + API_ENDPOINTS.STREAM_CHAT}?message=${encodeURIComponent(
          message
        )}&thread_id=${activeThreadId}`
      );

      evtSource.onmessage = (e) => {
        if (e.data === "[DONE]") {
          evtSource.close();
          dispatch(finalizeLastMessage());
          dispatch(setLoading(false));
        } else if (e.data.trim()) {
          dispatch(updateLastMessage(e.data));
        }
      };

      evtSource.onerror = () => {
        evtSource.close();
        dispatch(setError("Streaming connection failed"));
        dispatch(setLoading(false));
      };
    } catch (err) {
      console.error("Error sending message:", err);
      dispatch(setError("Failed to send message. Please try again."));
      dispatch(setLoading(false));
    }
  };

  return { sendMessage, thread_id: urlThreadId };
};

export default useChat;
