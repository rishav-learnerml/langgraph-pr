// src/redux/slices/chatSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

type Message = {
  id: string;
  type: "human" | "ai" | "tool";
  content: string;
  isFinal?: boolean;
  meta?: any;
};

type ChatState = {
  messages: Message[];
  loading: boolean;
  error: string | null;
};

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
    },

    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },

    // Append tokens to last open AI message (streaming)
    appendToLastMessage(state, action: PayloadAction<string>) {
      const text = action.payload ?? "";
      if (!state.messages?.length) return;
      for (let i = state.messages.length - 1; i >= 0; i--) {
        const m = state.messages[i];
        if (m.type === "ai" && !m.isFinal) {
          m.content = (m.content || "") + text;
          return;
        }
      }
    },

    // Replace last open AI message content (final)
    setLastMessage(state, action: PayloadAction<string>) {
      const text = action.payload ?? "";
      if (!state.messages?.length) return;
      for (let i = state.messages.length - 1; i >= 0; i--) {
        const m = state.messages[i];
        if (m.type === "ai" && !m.isFinal) {
          m.content = text;
          return;
        }
      }
      // No open AI placeholder: append final AI
      state.messages.push({
        id: uuidv4(),
        type: "ai",
        content: text,
        isFinal: true,
      });
    },

    // Update a message by id (used to update tool messages)
    updateMessageById(
      state,
      action: PayloadAction<{ id: string; patch: Partial<Message> }>
    ) {
      const { id, patch } = action.payload;
      const idx = state.messages.findIndex((m) => m.id === id);
      if (idx !== -1) {
        state.messages[idx] = { ...state.messages[idx], ...patch };
      }
    },

    // finalize last ai message (mark isFinal true)
    finalizeLastMessage(state) {
      for (let i = state.messages.length - 1; i >= 0; i--) {
        const m = state.messages[i];
        if (m.type === "ai" && !m.isFinal) {
          m.isFinal = true;
          return;
        }
      }
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    // optional: clear messages
    clearMessages(state) {
      state.messages = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setMessages,
  addMessage,
  appendToLastMessage,
  setLastMessage,
  updateMessageById,
  finalizeLastMessage,
  setLoading,
  setError,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
