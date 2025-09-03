import { Home, MessageSquare, MessageSquarePlus } from "lucide-react";
import { generateSessionId } from "@/utils/helper/generateSessionId";

export const navItems = [
  { name: "Home", path: "/", icon: Home, expandable: false },
  {
    name: "New Chat",
    path: "/chat?sessionId=" + generateSessionId(),
    icon: MessageSquarePlus,
    expandable: false,
  },
  {
    name: "Chat Sessions",
    path: null,
    icon: MessageSquare,
    expandable: true,
  },
];
