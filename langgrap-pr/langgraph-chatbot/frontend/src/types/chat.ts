export interface Message {
  type: "human" | "ai";
  content: string;
  isFinal?: boolean;
}

export interface ChatState {
  messages: Message[];
  session_id: string | null;
  loading: boolean;
  error: string | null;
}
