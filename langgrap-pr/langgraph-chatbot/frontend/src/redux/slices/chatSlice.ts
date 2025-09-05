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
    // inside reducers:
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
        lastMsg.isFinal = true;
      }
    },
    // New:
    updateMessageById: (
      state,
      action: PayloadAction<{ id: string; patch: Partial<Message> }>
    ) => {
      const idx = state.messages.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) {
        state.messages[idx] = {
          ...state.messages[idx],
          ...action.payload.patch,
        };
      }
    },
    replaceMessageById: (
      state,
      action: PayloadAction<{ id: string; replacement: Message }>
    ) => {
      const idx = state.messages.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) state.messages[idx] = action.payload.replacement;
    },
  },
});

export const {
  addMessage,
  updateLastMessage,
  finalizeLastMessage,
  setMessages,
  setLoading,
  setError,
  clearChat,
  initializeChat,
  updateMessageById,
  replaceMessageById,
} = chatSlice.actions;

export default chatSlice.reducer;
