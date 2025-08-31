import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, ChatState } from "@/types";

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action: PayloadAction<string>) => {
      const lastMsg = state.messages[state.messages.length - 1];

      if (lastMsg && lastMsg.type === "ai") {
        lastMsg.content += action.payload;
      }
      // console.log(state.messages,'message state')
    },
    finalizeLastMessage: (state) => {
      const lastMsg: any = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.type === "ai") {
        // mark message as finished
        lastMsg.isFinal = true as any;
      }
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
  setLoading,
  setError,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
