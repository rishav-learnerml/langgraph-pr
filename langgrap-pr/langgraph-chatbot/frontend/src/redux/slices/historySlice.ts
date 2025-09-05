import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Session {
  thread_id: string;
  title: string;
}

interface HistoryState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  sessions: [],
  loading: false,
  error: null,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSessions: (state) => {
      state.sessions = [];
      state.error = null;
    },
    addOptimisticSession: (state, action: PayloadAction<Session>) => {
      if (state.sessions.length > 0 && state.sessions[0].title === "New Chat")
        return;
      state.sessions.unshift(action.payload);
    },
  },
});

export const {
  setSessions,
  setLoading,
  setError,
  clearSessions,
  addOptimisticSession,
} = historySlice.actions;

export default historySlice.reducer;
