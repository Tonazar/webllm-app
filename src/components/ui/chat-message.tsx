import { motion, AnimationProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  animate?: AnimationProps["animate"];
  initial?: AnimationProps["initial"];
  exit?: AnimationProps["exit"];
}

export function ChatMessage({
  content,
  isUser,
  animate,
  initial,
  exit,
}: ChatMessageProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      className={cn(
        "flex gap-4 max-w-3xl mx-auto w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-blue-600" : "bg-zinc-700"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex-1 prose prose-invert max-w-none",
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-sm"
        )}
      >
        {content || (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="inline-block w-2 h-4 bg-current"
          />
        )}
      </div>
    </motion.div>
  );
}
