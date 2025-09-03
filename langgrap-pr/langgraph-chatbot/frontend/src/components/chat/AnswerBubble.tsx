import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // pick any theme you like
import { BotIcon, Clipboard, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnswerBubbleProps } from "@/interfaces/chat-interface";

// 🔧 Normalizer to fix malformed code blocks
function normalizeContent(raw: string) {
  let fixed = raw
    .replace(/```(python|javascript)([^\n])/g, "```$1\n$2")
    .replace(/([^`\n])```/g, "$1\n```")
    .replace(/```(\w+)\s*([\s\S]*?)```(#+)/g, "```$1\n$2\n```\n$3")
    .replace(/(\*\*Example Usage:?\*\*)/gi, "\n\n### Example Usage\n")
    .replace(/(\*\*Explanation:?\*\*)/gi, "\n\n### Explanation\n")
    .replace(/(\*\*Key Notes:?\*\*)/gi, "\n\n### Key Notes\n");

  fixed = fixed.replace(
    /def ([^(]+)\(([^)]*)\):"""(.*?)"""return (.*)/g,
    (_match, fnName, args, doc, ret) =>
      `def ${fnName}(${args}):\n    """${doc}"""\n    return ${ret}`
  );

  return fixed;
}

// ✅ Helper: flatten React children into plain string
function getTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map((child) => getTextFromChildren(child)).join("");
  }
  if (typeof children === "object" && children !== null && "props" in (children as any)) {
    return getTextFromChildren((children as any).props.children);
  }
  return "";
}

const AnswerBubble: React.FC<AnswerBubbleProps> = ({
  content,
  isStreaming,
  isFinal,
}) => {
  const safeContent = normalizeContent(content);

  return (
    <div className="flex items-end gap-3 animate-fade-in my-4">
      {/* Bot Avatar */}
      <Avatar className="h-10 w-10 border shadow-sm">
        <AvatarImage src="/bot-avatar.png" alt="Bot" />
        <AvatarFallback>
          <BotIcon className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>

      <Card className="bg-gray-700 text-white dark:bg-gray-300 dark:text-black shadow-xl border border-gray-600 rounded-b-2xl rounded-tr-2xl transition hover:shadow-2xl">
        <CardContent className="prose dark:prose-invert prose-p:leading-relaxed text-sm md:text-base p-4 max-w-[70vw]">
          {isStreaming && !isFinal ? (
            <span key={content.length}>
              {content}
              <span className="animate-pulse">▋</span>
            </span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ inline, children, ...props }: any) {
                  const [copied, setCopied] = useState(false);

                  if (!inline) {
                    // ✅ Extract plain text safely
                    const codeString = getTextFromChildren(children).trim();

                    const handleCopy = async () => {
                      await navigator.clipboard.writeText(codeString);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    };

                    return (
                      <div className="relative group">
                        <pre className="bg-black/90 text-green-400 p-3 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                          <code {...props}>{children}</code>
                        </pre>
                        <button
                          onClick={handleCopy}
                          className="absolute top-2 right-2 p-1 rounded bg-gray-700 hover:bg-gray-600 transition"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Clipboard className="h-4 w-4 text-gray-300" />
                          )}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <code className="bg-gray-800 px-1 rounded text-pink-400 font-mono">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {safeContent}
            </ReactMarkdown>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnswerBubble;
