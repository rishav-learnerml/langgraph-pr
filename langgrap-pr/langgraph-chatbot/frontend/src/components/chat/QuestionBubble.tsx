import React from "react";
import { CircleUserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface QuestionBubbleProps {
  content: string;
}

const QuestionBubble: React.FC<QuestionBubbleProps> = ({ content }) => {
  return (
    <div className="flex justify-end items-end gap-3 animate-fade-in my-4">
      {/* User Question Card */}
      <Card className="dark:bg-gray-700 dark:text-white bg-gray-300 text-black shadow-xl rounded-b-2xl rounded-tl-2xl max-w-[75%] transition hover:shadow-2xl border border-gray-700">
        <CardContent className="text-sm md:text-base p-4">
          {content}
        </CardContent>
      </Card>

      {/* User Avatar */}
      <Avatar className="h-10 w-10 border shadow-sm">
        <AvatarImage src="/user-avatar.png" alt="You" />
        <AvatarFallback>
          <CircleUserRound className="h-5 w-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default QuestionBubble;
