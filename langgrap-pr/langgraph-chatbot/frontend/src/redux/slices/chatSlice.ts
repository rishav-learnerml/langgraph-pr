import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, ChatState } from "@/types";

const initialState: ChatState = {
  messages: [],
  session_id: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    initializeChat: (state, action: PayloadAction<string>) => {
      state.session_id = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action: PayloadAction<string>) => {
      const lastMsg = state.messages[state.messages.length - 1];

      if (lastMsg && lastMsg.type === "ai") {
        lastMsg.content += action.payload;
      }
    },
    finalizeLastMessage: (state) => {
      const lastMsg: any = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.type === "ai") {
        lastMsg.isFinal = true as any;
      }
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  addMessage,
  updateLastMessage,
  finalizeLastMessage,
  setMessages,   // ✅ new action
  setLoading,
  setError,
  clearChat,
  initializeChat,
} = chatSlice.actions;

export default chatSlice.reducer;
