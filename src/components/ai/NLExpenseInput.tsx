import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Sparkles, Send, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";

interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
  confidence: number;
  date: string;
}

export function NLExpenseInput() {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedExpense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { createTransaction } = useTransactions();

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice not supported", description: "Try typing instead", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText(transcript);
      setIsListening(false);
      parseExpense(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const parseExpense = async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParsed(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-finance-assistant", {
        body: {
          mode: "parse_expense",
          messages: [{ role: "user", content: inputText }],
        },
      });
      if (error) throw error;
      const result = JSON.parse(data.result);
      const today = format(new Date(), "yyyy-MM-dd");
      setParsed({
        ...result,
        date: result.date === "today" ? today : result.date || today,
      });
    } catch (e) {
      console.error("Parse error:", e);
      toast({ title: "Could not parse", description: "Try: 'Paid 500 for grocery'", variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setIsSaving(true);
    try {
      await createTransaction.mutateAsync({
        type: "expense",
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: parsed.date,
        status: "completed",
      });
      setText("");
      setParsed(null);
      toast({ title: "✅ Expense saved!", description: `₹${parsed.amount} for ${parsed.category}` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setParsed(null);
    setText("");
  };

  return (
    <div className="space-y-3">
      {/* Input Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='Try: "Paid 1200 for Zomato dinner"'
            className="pl-9 pr-4 h-11 bg-secondary/50 border-border/50 text-sm placeholder:text-muted-foreground/60"
            onKeyDown={e => e.key === "Enter" && !isParsing && parseExpense(text)}
            disabled={isParsing || isSaving}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-11 w-11 shrink-0 border border-border/50", isListening && "text-destructive border-destructive/30 bg-destructive/10")}
          onClick={isListening ? stopVoice : startVoice}
          disabled={isParsing}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
          className="h-11 px-4 bg-primary text-primary-foreground"
          onClick={() => parseExpense(text)}
          disabled={!text.trim() || isParsing || isSaving}
        >
          {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 bg-destructive rounded-full animate-bounce" style={{ height: "12px", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-xs text-destructive font-medium">Listening... speak now</span>
        </div>
      )}

      {/* AI Parsed Preview */}
      {parsed && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI Detected — Review before saving
            <span className="ml-auto text-muted-foreground">{Math.round(parsed.confidence * 100)}% confidence</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-lg font-bold text-expense">₹{parsed.amount.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <p className="text-sm font-semibold text-foreground">{parsed.category}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{parsed.description}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 h-9 bg-primary text-primary-foreground text-sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Check className="h-3.5 w-3.5 mr-2" />}
              Save Expense
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-3" onClick={handleDiscard}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
