import { useDispatch } from "react-redux";
import {
  addMessage,
  updateLastMessage,
  finalizeLastMessage,
  setLoading,
  setError,
} from "@/redux/slices/chatSlice";
import { API_ENDPOINTS, BASE_URL } from "@/constants/api_endpoints";

const useChat = () => {
  const dispatch = useDispatch();

  const sendMessage = async (message: string) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Add human message immediately
      dispatch(addMessage({ type: "human", content: message }));

      // Add placeholder AI message
      dispatch(addMessage({ type: "ai", content: "", isFinal: false }));

      // Open SSE connection
      const evtSource = new EventSource(
        `${BASE_URL + API_ENDPOINTS.STREAM_CHAT}?message=${encodeURIComponent(
          message
        )}`
      );

      evtSource.onmessage = (e) => {
        if (e.data === "[DONE]") {
          console.log("END CHUNK:", e.data); // 👈 see tokens as they arrive

          evtSource.close();
          dispatch(finalizeLastMessage());
          dispatch(setLoading(false));
        } else if (e.data.trim()) {
          console.log("STREAM CHUNK:", e.data); // 👈 see tokens as they arrive
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

  return { sendMessage };
};

export default useChat;
