"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

export default function Home() {
  const [engine, setEngine] = useState<any>(null);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  useEffect(() => {
    async function loadModel() {
      const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

      const engine = await CreateMLCEngine(selectedModel, {
        initProgressCallback: (progress) => {
          setLoadingStatus(progress.text);
        },
      });

      console.log("[WebLLM] Engine initialized ✅");
      setEngine(engine);
    }

    loadModel();
  }, []);

  const handleSubmit = async () => {
    if (!engine || !input) return;
    setLoading(true);
    setResponse(""); // clear previous response

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: input },
    ];

    try {
      const chunks = await engine.chat.completions.create({
        messages,
        stream: true,
        stream_options: { include_usage: true },
      });

      let reply = "";
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || "";
        reply += delta;
        setResponse((prev) => prev + delta); // progressively update UI
      }
    } catch (err) {
      console.error("❌ Streaming error:", err);
      setResponse("⚠️ Error streaming response.");
    }

    setLoading(false);
  };

  return (
    <>
      {!engine && <p className="text-sm text-gray-500">{loadingStatus}</p>}
      <main className="container mx-auto p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold">🧠 WebLLM (Llama 3)</h1>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          className="w-full h-24 p-2 border rounded"
        />

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Thinking..." : "Submit"}
        </Button>

        {response && (
          <div className="mt-4 p-3 border rounded bg-gray-100 whitespace-pre-wrap">
            {response}
          </div>
        )}
      </main>
    </>
  );
}
