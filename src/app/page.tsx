"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ui/chat-message";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useChatHistory } from "@/hooks/use-chat-history";
import {
  CreateMLCEngine,
  ChatCompletionMessageParam,
  MLCEngine,
} from "@mlc-ai/web-llm";
import { Trash2, ArrowUpCircle } from "lucide-react";

export default function Home() {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const { messages, addMessage, updateLastMessage, clearHistory } = useChatHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "50px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    async function loadModel() {
      const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

      const loadedEngine = await CreateMLCEngine(selectedModel, {
        // Enable WebGPU acceleration if available
        useWebGPU: true,
        // Optimize thread count for CPU fallback
        numThreads: navigator.hardwareConcurrency || 4,
        // Use streaming for better memory management
        streaming: true,
        // Progress callback
        initProgressCallback: (progress: { text: string }) => {
          setLoadingStatus(progress.text);
        },
      });

      console.log("[WebLLM] Engine initialized ✅");
      setEngine(loadedEngine);
    }

    loadModel();
  }, []);

  const handleSubmit = async () => {
    if (!engine || !input.trim()) return;
    
    setLoading(true);
    const userMessage = input.trim();
    setInput("");
    addMessage({ content: userMessage, isUser: true });

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: userMessage },
    ];

    try {
      const stream = await engine.chat.completions.create({
        messages: chatMessages,
        stream: true,
        stream_options: { include_usage: true },
      });

      let assistantResponse = "";
      addMessage({ content: "", isUser: false });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        assistantResponse += delta;
        updateLastMessage(assistantResponse);
      }
    } catch (error: unknown) {
      console.error("❌ Streaming error:", error);
      addMessage({ content: "⚠️ Error streaming response.", isUser: false });
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100 overflow-hidden">
      {/* Sidebar - only shown on larger screens */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden md:flex w-[300px] bg-zinc-900 border-r border-zinc-800 flex-col p-4"
      >
        <Button
          onClick={() => clearHistory()}
          variant="outline"
          className="mb-4 w-full justify-start gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </Button>
      </motion.aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[140%] h-[140%] bg-gradient-radial from-blue-500/10 via-transparent to-transparent blur-3xl gradient-animate" />
          <div className="absolute -bottom-[40%] -right-[20%] w-[140%] h-[140%] bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl gradient-animate" />
        </div>

        {/* Chat container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative">
          {!engine && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm"
            >
              <div className="text-center space-y-4">
                <LoadingDots />
                <p className="text-sm text-zinc-400">{loadingStatus || "Loading model..."}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.timestamp}
                content={message.content}
                isUser={message.isUser}
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                exit={{ opacity: 0, y: -20 }}
              />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-4 md:p-6">
          <div className="max-w-3xl mx-auto flex gap-4 items-end">
            <motion.textarea
              ref={textareaRef}
              whileFocus={{ scale: 1.005 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Message Llama..."
              className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-sm min-h-[50px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              disabled={loading || !engine}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !engine || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 transition-all duration-200 rounded-xl px-4 py-2 h-auto"
            >
              {loading ? (
                <LoadingDots />
              ) : (
                <ArrowUpCircle className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-zinc-500 mt-2">
            Shift + Enter for new line • Enter to send
          </p>
        </div>
      </main>
    </div>
  );
}
