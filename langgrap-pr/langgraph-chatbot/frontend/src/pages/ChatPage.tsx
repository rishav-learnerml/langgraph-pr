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
    console.log("[ChatPage] messages:", messages);
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

  const renderedMessages: JSX.Element[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLast = i === messages.length - 1;

    // HUMAN message
    if (msg.type === "human") {
      renderedMessages.push(<QuestionBubble key={msg.id} msg={msg} />);
      continue;
    }

    // TOOL message (preferred order: tool -> ai)
    if (msg.type === "tool") {
      const next = messages[i + 1];

      // If next is AI, render tool + AI pair
      if (next && next.type === "ai") {
        const toolMeta = msg.meta ?? {};
        const toolResult =
          toolMeta.result ?? toolMeta.output ?? toolMeta.content ?? null;

        const aiRefId = next.id;
        if (!aiRefs.current[aiRefId]) aiRefs.current[aiRefId] = null;

        const aiStreaming = loading && !(next as any).isFinal && isLast;

        renderedMessages.push(
          <div key={`${msg.id}-${next.id}`} className="flex flex-col">
            <ToolBubble msg={msg} />
            <div
              ref={(el) => {
                aiRefs.current[aiRefId] = el;
              }}
            >
              <AnswerBubble
                msg={next}
                isStreaming={aiStreaming}
                isFinal={(next as any).isFinal}
                toolResult={toolResult}
              />
            </div>
          </div>
        );
        i++; // skip the ai since we've rendered the pair
        continue;
      }

      // tool alone -> just render the tool
      renderedMessages.push(
        <div key={msg.id}>
          <ToolBubble msg={msg} />
        </div>
      );
      continue;
    }

    // AI message branch
    if (msg.type === "ai") {
      const prev = messages[i - 1];
      const next = messages[i + 1];

      // CASE A: previous is tool -> this ai was already handled by the tool branch earlier,
      // so skip rendering here to avoid duplicate (tool branch would have consumed it).
      if (prev && prev.type === "tool") {
        // skip: already handled
        continue;
      }

      // CASE B: next is tool (AI came BEFORE tool in messages array)
      // We want to render Tool first then Answer. So if next is a tool, render
      // the tool followed by this ai (tool-first ordering), and skip the tool index.
      if (next && next.type === "tool") {
        const toolMsg = next;
        const toolMeta = toolMsg.meta ?? {};
        const toolResult =
          toolMeta.result ?? toolMeta.output ?? toolMeta.content ?? null;

        const aiRefId = msg.id;
        if (!aiRefs.current[aiRefId]) aiRefs.current[aiRefId] = null;

        const aiStreaming = loading && !(msg as any).isFinal && isLast;

        renderedMessages.push(
          <div key={`${toolMsg.id}-${msg.id}`} className="flex flex-col">
            <ToolBubble msg={toolMsg} />
            <div
              ref={(el) => {
                aiRefs.current[aiRefId] = el;
              }}
            >
              <AnswerBubble
                msg={msg}
                isStreaming={aiStreaming}
                isFinal={(msg as any).isFinal}
                toolResult={toolResult}
              />
            </div>
          </div>
        );

        i++; // skip the tool (we rendered it here)
        continue;
      }

      // CASE C: standalone AI (no adjacent tool) -> render AI normally
      const aiStreaming = loading && !(msg as any).isFinal && isLast;
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
