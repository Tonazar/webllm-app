"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ui/chat-message";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Header } from "@/components/ui/header";
import { useChatHistory } from "@/hooks/use-chat-history";
import {
  CreateMLCEngine,
  ChatCompletionMessageParam,
  MLCEngine,
} from "@mlc-ai/web-llm";
import { Trash2, ArrowUpCircle, StopCircle, PlusCircle } from "lucide-react";

export default function Home() {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { messages, addMessage, updateLastMessage, clearHistory } =
    useChatHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      abortControllerRef.current = new AbortController();
      const stream = await engine.chat.completions.create({
        messages: chatMessages,
        stream: true,
        stream_options: { include_usage: true },
      });

      let assistantResponse = "";
      addMessage({ content: "", isUser: false });

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        const delta = chunk.choices[0]?.delta?.content ?? "";
        assistantResponse += delta;
        updateLastMessage(assistantResponse);
      }
    } catch (error: unknown) {
      if (abortControllerRef.current?.signal.aborted) {
        console.log("Generation stopped by user");
        updateLastMessage("Generation stopped by user.");
      } else {
        console.error("❌ Streaming error:", error);
        addMessage({ content: "⚠️ Error streaming response.", isUser: false });
      }
    }

    setLoading(false);
    abortControllerRef.current = null;
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    clearHistory();
  };

  return (
    <div className="h-screen">
      {!engine && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center backdrop-blur-md z-50"
        >
          <div className="text-center space-y-4">
            <div className="progress-ring mx-auto ">
              <LoadingDots />
            </div>
            <p className="text-foreground/70 animate-pulse">
              {loadingStatus || "Loading model..."}
            </p>
          </div>
        </motion.div>
      )}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Background gradients */}
      <div className="gradient-blur" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: isSidebarOpen ? 0 : -300 }}
          className={`fixed md:relative md:translate-x-0 rounded-xl z-10 h-[relative-3rem] mt-4 w-[300px] gradient-card flex-col p-4 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-200 ease-in-out md:flex`}
        >
          <div className="space-y-2">
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              New Chat
            </Button>
            <Button
              onClick={clearHistory}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          </div>

          {/* Chat History List */}
          <div className="mt-4 space-y-2 overflow-y-auto flex-1">
            {messages
              .filter((m) => m.isUser)
              .map((message) => (
                <button
                  key={message.timestamp}
                  className="w-full text-left p-2 text-sm rounded hover:bg-border/20 truncate opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => setInput(message.content)}
                >
                  {message.content}
                </button>
              ))}
          </div>
        </motion.aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col h-[calc(100vh-7rem)] mt-14 relative max-w-4xl mx-auto w-full px-4">
          {/* Chat container */}
          <div className="flex-1 overflow-y-auto space-y-6 relative pb-6">
            <AnimatePresence>
              {messages.map((message) => (
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
          <div className="gradient-card p-4 rounded-t-xl">
            <div className="flex gap-4 items-end">
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
                className="flex-1 bg-background/50 border border-border/50 rounded-xl p-3 text-sm min-h-[50px] max-h-[200px] focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                disabled={loading || !engine}
              />
              {loading ? (
                <Button
                  onClick={handleStopGeneration}
                  className="bg-accent hover:bg-accent/90 transition-colors rounded-xl px-4 py-2 h-auto"
                >
                  <StopCircle className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !engine || !input.trim()}
                  className="bg-highlight hover:bg-highlight/90 transition-colors rounded-xl px-4 py-2 h-auto"
                >
                  <ArrowUpCircle className="w-5 h-5" />
                </Button>
              )}
            </div>
            <p className="text-xs text-center text-foreground/50 mt-2">
              Shift + Enter for new line • Enter to send
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
