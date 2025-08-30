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

export const { addMessage, setLoading, setError, clearChat } =
  chatSlice.actions;

export default chatSlice.reducer;
