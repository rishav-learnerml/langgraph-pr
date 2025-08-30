import React from "react";
import ReactMarkdown from "react-markdown";
import { BotIcon } from "lucide-react";

interface AnswerBubbleProps {
  content: string;
}

const AnswerBubble: React.FC<AnswerBubbleProps> = ({ content }) => {
  return (
    <div className="flex justify-start items-center animate-fade-in animation-delay-200">
      <BotIcon size={32} />

      <div className="max-w-[75%] dark:bg-gray-200 dark:text-black ms-3 p-4 rounded-tr-2xl rounded-bl-2xl rounded-tl-xl rounded-br-xl bg-muted text-muted-foreground shadow-xl transform transition-all duration-300 hover:scale-[1.01] cursor-default prose dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default AnswerBubble;
