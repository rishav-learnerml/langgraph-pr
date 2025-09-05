// src/components/chat/AnswerBubble.tsx
import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import { BotIcon, HammerIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface AnswerBubbleProps {
  msg: any;
  isStreaming?: boolean;
  isFinal?: boolean;
  toolResult?: any;
}

function extractToolResult(raw: any): string | null {
  if (raw == null) return null;
  try {
    if (typeof raw === "object") {
      if ("result" in raw) return JSON.stringify(raw.result, null, 2);
      return JSON.stringify(raw, null, 2);
    }
    return String(raw);
  } catch {
    return String(raw);
  }
}

const AnswerBubble: React.FC<AnswerBubbleProps> = ({
  msg,
  isStreaming,
  isFinal,
  toolResult,
}) => {
  const content = String(msg?.content ?? "");
  const prettyTool = useMemo(() => extractToolResult(toolResult), [toolResult]);

  if (!prettyTool && !content.trim()) return null;

  // ----- MINIMAL HIGHLIGHT: replace [tool_name] with an inline span that ReactMarkdown will render -----
  // keep the brackets visible as requested, just wrap them in a highlighted span
  const highlightedContent = content
    .replace(/\. /g, "")
    .replace(
      /\[([a-zA-Z0-9_:-]+)\]/g,
      (_match, p1) =>
        `<span class="bg-yellow-200 text-yellow-900 px-1 rounded"> ${p1} 🔨</span><br/><br/>`
    );

  return (
    <div className="flex items-start gap-3 animate-fade-in my-4">
      <Avatar className="h-10 w-10 border shadow-sm mt-2">
        <AvatarImage src="/bot-avatar.png" alt="Bot" />
        <AvatarFallback>
          <BotIcon className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>

      <div className="w-full max-w-[78vw]">
        <Card className="bg-gray-700 text-white dark:bg-gray-300 dark:text-black shadow-xl border border-gray-600 rounded-b-2xl rounded-tr-2xl transition hover:shadow-2xl">
          <CardContent className="prose dark:prose-invert prose-p:leading-relaxed text-sm md:text-base p-4">
            {isStreaming && !isFinal ? (
              <span key={content.length}>
                {content}
                <span className="animate-pulse">▋</span>
              </span>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
              >
                {highlightedContent}
              </ReactMarkdown>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnswerBubble;
