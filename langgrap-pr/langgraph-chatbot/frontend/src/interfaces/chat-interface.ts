export interface AnswerBubbleProps {
  content: string;
  isStreaming?: boolean;
  isFinal?: boolean;
}

export interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  loading: boolean;
}

export interface QuestionBubbleProps {
  content: string;
}
