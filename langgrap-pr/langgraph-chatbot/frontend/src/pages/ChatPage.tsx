// src/pages/ChatPage.tsx
import { useState, useRef, useEffect, JSX } from "react";
import { Button } from "@/components/ui/button";
import { BotIcon, Settings } from "lucide-react";
import useChat from "@/hooks/useChat";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import QuestionBubble from "@/components/chat/QuestionBubble";
import AnswerBubble from "@/components/chat/AnswerBubble";
import ToolBubble from "@/components/chat/ToolBubble";
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

  // map message id -> ref for scrolling
  const aiRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log(messages)
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      fetchConversation(sessionId);
    }
  }, [sessionId, fetchConversation]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue, sessionId || undefined);
      setInputValue("");
    }
  };

  // scroll helper: scroll to ai message by id
  // const scrollToAi = (aiId?: string | null) => {
  //   try {
  //     if (!aiId) return;
  //     const el = aiRefs.current[aiId];
  //     if (el && typeof el.scrollIntoView === "function") {
  //       el.scrollIntoView({ behavior: "smooth", block: "center" });
  //     } else {
  //       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //     }
  //   } catch {
  //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //   }
  // };

  // Compose rendered messages; when we detect tool followed by ai, pass tool result into AnswerBubble
  const renderedMessages: JSX.Element[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLast = i === messages.length - 1;
    const aiStreaming =
      loading && msg.type === "ai" && !(msg as any).isFinal && isLast;

    if (msg.type === "human") {
      renderedMessages.push(<QuestionBubble key={msg.id} msg={msg} />);
      continue;
    }

    if (msg.type === "tool") {
      const next = messages[i + 1];
      if (next && next.type === "ai") {
        // Extract tool result (if any) from this tool message meta
        const toolMeta = msg.meta ?? {};
        const toolResult =
          toolMeta.result ?? toolMeta.output ?? toolMeta.content ?? null;

        // prepare a ref holder for the AI message
        const aiRefId = next.id;
        if (!aiRefs.current[aiRefId]) aiRefs.current[aiRefId] = null;

        renderedMessages.push(
          <div key={`${msg.id}-${next.id}`} className="flex flex-col">
            <ToolBubble msg={msg} />
            <div
              ref={(el) => {
                aiRefs.current[aiRefId] = el;
              }}
            >
              <AnswerBubble
                msg={msg.content}
                isStreaming={aiStreaming}
                isFinal={(next as any).isFinal}
                toolResult={toolResult}
              />
            </div>
          </div>
        );
        i++; // skip the ai since we've rendered the pair
        continue;
      } else {
        // tool alone
        renderedMessages.push(
          <>
            <ToolBubble key={msg.id} msg={msg} />
            <AnswerBubble
              msg={msg.content}
              isStreaming={aiStreaming}
              isFinal={true}
              toolResult={msg.content}
            />
          </>
        );
        continue;
      }
    }

    if (msg.type === "ai") {
      renderedMessages.push(
        <div
          key={msg.id}
          ref={(el) => {
            aiRefs.current[msg.id] = el;
          }}
        >
          <AnswerBubble
            msg={msg}
            isStreaming={aiStreaming}
            isFinal={(msg as any).isFinal}
          />
        </div>
      );
      continue;
    }

    // fallback
    renderedMessages.push(
      <div key={msg.id} className="my-4 text-sm text-muted-foreground">
        {String(msg.content).slice(0, 1000)}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[78vh] overflow-y-auto md:overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background text-foreground">
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

      <main className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar max-w-[75vw]!">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
            <BotIcon className="h-14 w-14 text-primary/70" />
            <p className="text-lg font-medium">Start a conversation 🚀</p>
            <p className="text-sm">Ask me anything…</p>
          </div>
        )}

        {renderedMessages}

        {error && (
          <p className="text-destructive font-medium animate-fade-in">
            ⚠️ Error: {error}
          </p>
        )}

        <div ref={messagesEndRef} />
      </main>

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
