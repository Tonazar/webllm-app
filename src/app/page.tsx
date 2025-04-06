"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CreateMLCEngine,
  ChatCompletionMessageParam,
  MLCEngine,
  ChatCompletionChunk,
} from "@mlc-ai/web-llm";

export default function Home() {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [loadingStatus, setLoadingStatus] = useState("");

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
    if (!engine || !input) return;
    setLoading(true);
    setResponse("");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: input },
    ];

    try {
      const chunks: AsyncGenerator<ChatCompletionChunk> =
        await engine.chat.completions.create({
          messages,
          stream: true,
          stream_options: { include_usage: true },
        });

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        setResponse((prev) => prev + delta);
      }
    } catch (error: unknown) {
      console.error("❌ Streaming error:", error);
      setResponse("⚠️ Error streaming response.");
    }

    setLoading(false);
  };

  return (
    <main className="container mx-auto p-4 flex flex-col items-center">
      {!engine && (
        <p className="text-sm text-gray-500 mb-4">
          {loadingStatus || "Loading model..."}
        </p>
      )}

      <h1 className="text-2xl font-bold"> WebLLM (Llama 3)</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
        className="w-full h-24 p-2 border rounded my-4"
      />

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Thinking..." : "Submit"}
      </Button>

      {response && (
        <div className="mt-4 p-3 border rounded bg-gray-100 whitespace-pre-wrap w-full">
          {response}
        </div>
      )}
    </main>
  );
}
