import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "openclaw-chat";
const GATEWAY_TOKEN = "REDACTED_TOKEN";

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hey! I'm your OpenClaw assistant. How can I help you today?",
  timestamp: Date.now(),
};

function TypingIndicator() {
  return (
    <div className="message assistant">
      <div className="bubble typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    // Send full conversation history for context
    const historyForAPI = updatedMessages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const token = localStorage.getItem("openclaw-gateway-token") || GATEWAY_TOKEN;
      const r = await fetch("/gateway/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: historyForAPI,
        }),
        signal: AbortSignal.timeout(30000),
      });

      let reply: string | null = null;
      if (r.ok) {
        const data = await r.json() as {
          choices?: { message?: { content?: string } }[];
        };
        reply = data.choices?.[0]?.message?.content ?? null;
      }

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply ?? "Got it! (no response text received)",
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm not connected right now. Please make sure the gateway is running and try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="bubble">{msg.content}</div>
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-bar">
        <Input
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)"
          disabled={isTyping}
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          size="icon"
          className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
          aria-label="Send message"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
