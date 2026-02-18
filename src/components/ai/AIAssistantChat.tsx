import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Send, Loader2, Sparkles, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions } from "@/hooks/useTransactions";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string; id: string };

const QUICK_PROMPTS = [
  "Where am I overspending?",
  "Can I save more this month?",
  "What's my EMI risk?",
  "Analyse my spending",
];

export function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { transactions } = useTransactions();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { role: "assistant", content: "", id: assistantId }]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-finance-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          mode: "chat",
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          transactions: transactions.slice(0, 100),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunk) {
              full += chunk;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: full } : m));
            }
          } catch { /* partial chunk */ }
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Sorry, I encountered an error: ${e.message}. Please try again.` }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "👋 Hi! I'm **Finzo**, your AI finance assistant.\n\nI can see your transactions and help you understand your spending. Ask me anything!",
        id: "welcome",
      }]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-primary/50"
              size="icon"
            >
              <Sparkles className="h-6 w-6" />
            </Button>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-success rounded-full animate-pulse border-2 border-background" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col" style={{ height: "480px" }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Finzo AI</p>
                  <p className="text-xs text-muted-foreground">Your financial assistant</p>
                </div>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      )}>
                        {msg.content ? (
                          <span className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}</span>
                        ) : (
                          <div className="flex gap-1 py-1">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Quick prompts */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors shrink-0"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask anything about your finances..."
                    className="h-9 text-sm bg-secondary/50 border-border/50"
                    onKeyDown={e => e.key === "Enter" && send(input)}
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0 bg-primary text-primary-foreground"
                    onClick={() => send(input)}
                    disabled={!input.trim() || isLoading}
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
