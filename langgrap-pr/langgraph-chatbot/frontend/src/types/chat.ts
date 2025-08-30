export interface Message {
  type: "human" | "ai";
  content: string;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}
