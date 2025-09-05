export const API_ENDPOINTS = {
  CHAT: "/chat",
  ROOT: "/",
  STREAM_CHAT: "/stream-chat",
  CHAT_HISTORY: "/chathistory",
  SESSIONS: "/sessions",
};

// Pick BASE_URL dynamically depending on env
export const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000"
    : "https://langgraph-pr.onrender.com";
