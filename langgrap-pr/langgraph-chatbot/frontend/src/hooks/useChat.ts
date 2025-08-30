import axiosInstance from "@/api/axiosInstance";
import { useDispatch } from "react-redux";
import { addMessage, setLoading, setError } from "@/redux/slices/chatSlice";
import { API_ENDPOINTS } from "@/constants/api_endpoints";

const useChat = () => {
  const dispatch = useDispatch();

  const sendMessage = async (message: string) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      dispatch(addMessage({ type: "human", content: message }));
      const response = await axiosInstance.post(API_ENDPOINTS.CHAT, { message });
      dispatch(addMessage({ type: "ai", content: response.data.response }));
    } catch (err) {
      console.error("Error sending message:", err);
      dispatch(setError("Failed to send message. Please try again."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { sendMessage };
};

export default useChat;
