import { Message } from "./chat";

export interface AnswerBubbleProps {
  msg: Message;
  isStreaming?: boolean;
  isFinal?: boolean;
  callingTool?: boolean;
}

export interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  loading: boolean;
}

export interface QuestionBubbleProps {
  msg: Message;
}
