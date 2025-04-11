import { motion } from "framer-motion";

export function LoadingDots() {
  return (
    <div className="flex space-x-1.5 items-center h-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="w-1.5 h-1.5 rounded-full bg-zinc-400"
        />
      ))}
    </div>
  );
}