import React from "react";
import { CircleUserRound } from "lucide-react";

interface QuestionBubbleProps {
  content: string;
}

const QuestionBubble: React.FC<QuestionBubbleProps> = ({ content }) => {
  return (
    <div className="flex justify-end items-center animate-fade-in animation-delay-100">
      <div className="max-w-[75%] dark:text-gray-900 dark:bg-gray-200 p-4 rounded-tl-2xl rounded-br-2xl rounded-tr-xl rounded-bl-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl transform transition-all duration-300 hover:scale-[1.01] cursor-default me-3">
        {content}
      </div>
      <CircleUserRound size={32} />
    </div>
  );
};

export default QuestionBubble;
