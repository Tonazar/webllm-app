import { motion } from "framer-motion";

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={className}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-current rounded-full animate-[bounce_1s_infinite_100ms]" />
        <div className="w-2 h-2 bg-current rounded-full animate-[bounce_1s_infinite_200ms]" />
        <div className="w-2 h-2 bg-current rounded-full animate-[bounce_1s_infinite_300ms]" />
      </div>
    </div>
  );
}
