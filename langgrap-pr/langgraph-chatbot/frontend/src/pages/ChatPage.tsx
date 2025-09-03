import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BotIcon, Settings } from "lucide-react";
import useChat from "@/hooks/useChat";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import QuestionBubble from "@/components/chat/QuestionBubble";
import AnswerBubble from "@/components/chat/AnswerBubble";
import ChatInput from "@/components/chat/ChatInput";
import { useSearchParams } from "react-router-dom";
import { useConversationHistory } from "@/hooks/useConversationHistory";

const ChatPage = () => {
  const [inputValue, setInputValue] = useState("");
  const { sendMessage } = useChat();
  const { fetchConversation } = useConversationHistory();
  const { messages, loading, error } = useSelector(
    (state: RootState) => state.chat
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  // scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // fetch history when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchConversation(sessionId);
    }
  }, [sessionId, fetchConversation]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue, sessionId || undefined); // ✅ pass sessionId to backend
      setInputValue("");
    }
  };

  return (
    <div className="relative flex flex-col h-[78vh] overflow-y-auto md:overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background text-foreground">
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
            <AnswerBubble
              key={i}
              content={msg.content}
              isStreaming={loading && i === messages.length - 1}
              isFinal={(msg as any).isFinal}
            />
          )
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
