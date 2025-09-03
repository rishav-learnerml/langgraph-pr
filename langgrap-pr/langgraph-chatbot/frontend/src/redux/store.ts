import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import historyReducer from "./slices/historySlice";

const store = configureStore({
  reducer: {
    chat: chatReducer,
    history: historyReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
