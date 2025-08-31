export interface Message {
  type: "human" | "ai";
  content: string;
  isFinal?:boolean
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}
