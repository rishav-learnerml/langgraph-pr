import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";
import { ChatInputProps } from "@/types/interfaces/chat-interface";

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  setInputValue,
  handleSendMessage,
  loading,
}) => {
  return (
    <footer className="sticky bottom-0 z-20 px-6 pt-2 bg-gradient-to-t from-background via-background/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
        <Input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 rounded-2xl px-5 py-4 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
        />
        <Button
          onClick={handleSendMessage}
          disabled={loading}
          size="icon"
          className="rounded-lg h-8 w-14 bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-transform shadow-lg border dark:border-white cursor-pointer"
        >
          <SendHorizonal className="h-5 w-5 black:text-white" />
        </Button>
      </div>
    </footer>
  );
};

export default ChatInput;
