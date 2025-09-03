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
  },
});

export const { setSessions, setLoading, setError, clearSessions } =
  historySlice.actions;

export default historySlice.reducer;
