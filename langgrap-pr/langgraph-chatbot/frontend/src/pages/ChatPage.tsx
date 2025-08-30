import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BotIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useChat from "@/hooks/useChat";
import { BeatLoader } from "react-spinners";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import QuestionBubble from "@/components/chat/QuestionBubble";
import AnswerBubble from "@/components/chat/AnswerBubble";

const ChatPage = () => {
  const [inputValue, setInputValue] = useState("");
  const { sendMessage } = useChat();
  const { messages, loading, error } = useSelector(
    (state: RootState) => state.chat
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent new line on Enter
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto flex flex-col h-[85vh] bg-card text-card-foreground border border-border shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border py-5 px-7 flex flex-row items-center justify-between bg-gradient-to-r from-card to-background">
        <CardTitle className="text-2xl font-bold text-primary tracking-wide">
          ChatSphere Assistant
        </CardTitle>
        {/* Potentially add more header elements like a settings button or user icon here */}
      </CardHeader>
      <CardContent className="flex-1 p-6 overflow-y-auto bg-background custom-scrollbar">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) =>
            msg.type === "human" ? (
              <QuestionBubble key={index} content={msg.content} />
            ) : (
              <AnswerBubble key={index} content={msg.content} />
            )
          )}
          {loading && (
            <div className="flex justify-start items-center">
              <BotIcon size={32} />

              <div className="max-w-[75%] p-4 rounded-lg bg-muted text-muted-foreground animate-fade-in shadow-inner dark:text-gray-200">
                <BeatLoader size={10} color="#624477"/>
              </div>
            </div>
          )}
          {error && (
            <div className="text-destructive mt-3 animate-fade-in font-medium">
              Error: {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="flex p-5 border-t border-border bg-card">
        <Input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 mr-4 bg-input border-input text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:ring-offset-background text-base rounded-lg px-4 py-3 shadow-inner transition-all duration-200"
        />
        <Button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-primary border light:border-black-100 dark:border-gray-100 hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-lg rounded-lg px-6 py-3 font-semibold text-base"
        >
          Send
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatPage;
