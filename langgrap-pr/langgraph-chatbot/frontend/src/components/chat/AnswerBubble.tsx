import React from "react";
import ReactMarkdown from "react-markdown";
import { BotIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AnswerBubbleProps {
  content: string;
}

const AnswerBubble: React.FC<AnswerBubbleProps> = ({ content }) => {
  return (
    <div className="flex items-end gap-3 animate-fade-in my-4">
      {/* Bot Avatar */}
      <Avatar className="h-10 w-10 border shadow-sm">
        <AvatarImage src="/bot-avatar.png" alt="Bot" />
        <AvatarFallback>
          <BotIcon className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>

      {/* Answer Card */}
      <Card className="bg-gray-700 text-white dark:bg-gray-300 dark:text-black shadow-xl border border-gray-600 rounded-b-2xl rounded-tr-2xl max-w-[75%] transition hover:shadow-2xl">
        <CardContent className="prose dark:prose-invert prose-p:leading-relaxed text-sm md:text-base p-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnswerBubble;
