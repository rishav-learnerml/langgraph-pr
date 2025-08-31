import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BotIcon, Settings } from "lucide-react";
import useChat from "@/hooks/useChat";
import { BeatLoader } from "react-spinners";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import QuestionBubble from "@/components/chat/QuestionBubble";
import AnswerBubble from "@/components/chat/AnswerBubble";
import ChatInput from "@/components/chat/ChatInput";

const ChatPage = () => {
  const [inputValue, setInputValue] = useState("");
  const { sendMessage } = useChat();
  const { messages, loading, error } = useSelector(
    (state: RootState) => state.chat
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="relative flex flex-col h-[78vh] overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 pb-2 border-b border-border backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-3">
          <BotIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            ChatSphere Assistant
          </h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
            <BotIcon className="h-14 w-14 text-primary/70" />
            <p className="text-lg font-medium">Start a conversation 🚀</p>
            <p className="text-sm">Ask me anything…</p>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.type === "human" ? (
            <QuestionBubble key={i} content={msg.content} />
          ) : (
            <AnswerBubble key={i} content={msg.content} />
          )
        )}

        {loading && (
          <div className="flex items-center space-x-3 animate-fade-in">
            <BotIcon className="text-primary h-7 w-7" />
            <div className="px-5 py-3 rounded-2xl bg-muted/70 shadow-inner">
              <BeatLoader size={8} color="#6d28d9" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-destructive font-medium animate-fade-in">
            ⚠️ Error: {error}
          </p>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Dock */}
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        loading={loading}
      />
    </div>
  );
};

export default ChatPage;
