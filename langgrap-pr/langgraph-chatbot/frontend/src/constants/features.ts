import { MessageCircle, Sparkles, ShieldCheck, LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

export const features: Feature[] = [
  {
    icon: MessageCircle,
    title: "Natural Conversations",
    desc: "Chat like you’re talking to a friend — smooth, intelligent, and engaging.",
    color: "text-primary",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    desc: "Powered by cutting-edge AI to give you the best answers, every time.",
    color: "text-secondary",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    desc: "Your conversations are safe, encrypted, and never shared.",
    color: "text-green-500",
  },
];
