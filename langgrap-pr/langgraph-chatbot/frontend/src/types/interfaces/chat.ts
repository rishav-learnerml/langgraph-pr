import { MessageType } from "../message";

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  isFinal?: boolean; // for ai or tool
  meta?: Record<string, any>; // optional
}


export interface ChatState {
  messages: Message[];
  session_id: string | null;
  loading: boolean;
  error: string | null;
}
